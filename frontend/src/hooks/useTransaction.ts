'use client';

import { useCallback, useRef, useState } from 'react';
import {
  JuryVerdictDraft,
  makeWalletClient,
  pollConsensusState,
  WalletClient,
} from '@/lib/contract';

export type TxStepPhase = 'idle' | 'signing' | 'sent' | 'deliberation' | 'finalized' | 'reverted';

export interface TxWorkflowState {
  currentPhase: TxStepPhase;
  txHash: `0x${string}` | null;
  consensusProgress: string;
  peekedDraft: JuryVerdictDraft | null;
  errorMessage: string | null;
}

const INITIAL_TX_STATE: TxWorkflowState = {
  currentPhase: 'idle',
  txHash: null,
  consensusProgress: '',
  peekedDraft: null,
  errorMessage: null,
};

function processWalletError(err: unknown): string {
  const msg = String((err as { message?: string })?.message ?? err);
  if (/LackOfFundForMaxFee|insufficient funds/i.test(msg)) {
    return 'Wallet balance is below the fee reserve required for AI transactions (0.05 GEN fee + gas). Please request funds from the faucet.';
  }
  if (/reject|denied|4001/i.test(msg)) {
    return 'Transaction signature request rejected by user.';
  }
  if (/rate limit|429|too many/i.test(msg)) {
    return 'The StudioNet network node is rate-limiting requests. The transaction might still process.';
  }
  if (/network|fetch|timeout/i.test(msg)) {
    return 'Network connection lost. Verify your settings and internet connection.';
  }
  return 'The transaction failed. Please ensure you have sufficient GEN and try again.';
}

export interface DispatchParams {
  walletAddress: `0x${string}`;
  transactionCallback: (client: WalletClient) => Promise<unknown>;
  onSuccess?: (finalStatus: string, finalDraft: JuryVerdictDraft | null) => void;
  onStateChange?: (isProcessing: boolean) => void;
}

export function useTransaction() {
  const [txState, setTxState] = useState<TxWorkflowState>(INITIAL_TX_STATE);
  const isSubmitting = useRef(false);

  const resetTxState = useCallback(() => {
    setTxState(INITIAL_TX_STATE);
  }, []);

  const dispatchTransaction = useCallback(async (params: DispatchParams) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    params.onStateChange?.(true);
    
    setTxState({ ...INITIAL_TX_STATE, currentPhase: 'signing' });
    
    try {
      const client = makeWalletClient(params.walletAddress);
      const hashResult = (await params.transactionCallback(client)) as `0x${string}`;
      
      setTxState((prev) => ({
        ...prev,
        currentPhase: 'sent',
        txHash: hashResult,
      }));

      setTxState((prev) => ({
        ...prev,
        currentPhase: 'deliberation',
        consensusProgress: 'PENDING',
      }));

      // Begin polling the on-chain consensus state and peeking proposed leader outputs
      const { status, draft } = await pollConsensusState(client, hashResult, (currStatus, currentDraft) => {
        setTxState((prev) => ({
          ...prev,
          consensusProgress: currStatus,
          peekedDraft: currentDraft,
        }));
      });

      if (status === 'ACCEPTED' || status === 'FINALIZED') {
        setTxState((prev) => ({
          ...prev,
          currentPhase: 'finalized',
          consensusProgress: status,
          peekedDraft: draft,
        }));
        params.onSuccess?.(status, draft);
      } else if (status === 'UNDETERMINED') {
        setTxState((prev) => ({
          ...prev,
          currentPhase: 'reverted',
          consensusProgress: status,
          errorMessage: 'The validator jury failed to achieve consensus on this debate. Try again.',
        }));
      } else {
        setTxState((prev) => ({
          ...prev,
          currentPhase: 'reverted',
          consensusProgress: status,
          errorMessage: 'The network could not complete consensus. Check the explorer for updates.',
        }));
      }
    } catch (error) {
      setTxState((prev) => ({
        ...prev,
        currentPhase: 'reverted',
        errorMessage: processWalletError(error),
      }));
    } finally {
      isSubmitting.current = false;
      params.onStateChange?.(false);
    }
  }, []);

  return {
    txState,
    dispatchTransaction,
    resetTxState,
  };
}
