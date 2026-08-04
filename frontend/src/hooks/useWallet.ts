'use client';

import { useCallback, useEffect, useState } from 'react';

// StudioNet constants
const GEN_STUDIONET_PARAMS = {
  chainId: '0xF22F', // Hex for 61999
  chainName: 'GenLayer StudioNet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://studio.genlayer.com/api'],
  blockExplorerUrls: ['https://explorer-studio.genlayer.com/'],
};
const EXPECTED_CHAIN_ID_HEX = '0xf22f';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

export interface WalletHookState {
  userAddress: `0x${string}` | null;
  activeChainId: string | null;
  nativeBalance: string | null;
  isConnecting: boolean;
  walletError: string | null;
  providerDetected: boolean;
  isCorrectNetwork: boolean;
  triggerConnect: () => Promise<void>;
  triggerDisconnect: () => void;
  updateBalance: () => Promise<void>;
}

function convertWeiToGen(hexWei: string, precisionDigits = 4): string {
  try {
    const weiVal = BigInt(hexWei);
    const mainUnits = weiVal / 10n ** 18n;
    const fractionPart = (weiVal % 10n ** 18n)
      .toString()
      .padStart(18, '0')
      .slice(0, precisionDigits)
      .replace(/0+$/, '');
    return fractionPart ? `${mainUnits}.${fractionPart}` : mainUnits.toString();
  } catch {
    return '0';
  }
}

export function useWallet(): WalletHookState {
  const [userAddress, setUserAddress] = useState<`0x${string}` | null>(null);
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [providerDetected, setProviderDetected] = useState(false);

  useEffect(() => {
    setProviderDetected(!!getProvider());
  }, []);

  const fetchChainInfo = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const chain = (await provider.request({ method: 'eth_chainId' })) as string;
      setActiveChainId(chain);
    } catch {
      /* ignore */
    }
  }, []);

  const updateBalance = useCallback(async () => {
    const provider = getProvider();
    if (!provider || !userAddress) return;
    try {
      const hexBal = (await provider.request({
        method: 'eth_getBalance',
        params: [userAddress, 'latest'],
      })) as string;
      setNativeBalance(convertWeiToGen(hexBal));
    } catch {
      /* ignore */
    }
  }, [userAddress]);

  const triggerConnect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setWalletError('Web3 wallet extension not detected.');
      return;
    }
    setIsConnecting(true);
    setWalletError(null);
    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error('No user accounts were returned.');
      }
      
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [GEN_STUDIONET_PARAMS],
        });
      } catch {
        /* Chain metadata might already be registered */
      }
      
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GEN_STUDIONET_PARAMS.chainId }],
        });
      } catch {
        /* user might decline network switch */
      }

      setUserAddress(accounts[0] as `0x${string}`);
      await fetchChainInfo();
    } catch (e) {
      const errorMsg = String((e as { message?: string })?.message ?? e);
      if (/reject|denied|4001/i.test(errorMsg)) {
        setWalletError('Signature request cancelled by user.');
      } else {
        setWalletError('Unable to connect browser wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [fetchChainInfo]);

  const triggerDisconnect = useCallback(() => {
    setUserAddress(null);
    setNativeBalance(null);
  }, []);

  useEffect(() => {
    const provider = getProvider();
    if (!provider || !provider.on) return;
    
    const handleAccounts = (...args: unknown[]) => {
      const accountsList = args[0] as string[];
      if (!accountsList || accountsList.length === 0) {
        setUserAddress(null);
      } else {
        setUserAddress(accountsList[0] as `0x${string}`);
      }
    };
    
    const handleChainChanged = (...args: unknown[]) => {
      setActiveChainId(args[0] as string);
    };

    provider.on('accountsChanged', handleAccounts);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccounts);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (userAddress) {
      updateBalance();
    }
  }, [userAddress, updateBalance]);

  const isCorrectNetwork = (activeChainId ?? '').toLowerCase() === EXPECTED_CHAIN_ID_HEX;

  return {
    userAddress,
    activeChainId,
    nativeBalance,
    isConnecting,
    walletError,
    providerDetected,
    isCorrectNetwork,
    triggerConnect,
    triggerDisconnect,
    updateBalance,
  };
}
