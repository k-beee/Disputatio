'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { ThesisIndex } from '@/components/ThesisIndex';
import { ThesisCard } from '@/components/ThesisCard';
import { ProgressionHistory } from '@/components/ProgressionHistory';
import { Footer } from '@/components/Footer';
import { ThesisModal } from '@/components/ThesisModal';
import { ClashModal } from '@/components/ClashModal';
import { ToastHost, dismissToast, pushToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, DataErrorBoundary } from '@/components/ErrorState';
import { ThesisSkeleton } from '@/components/Skeleton';
import { useWallet } from '@/hooks/useWallet';
import { useContractData } from '@/hooks/useContractData';
import { useTransaction } from '@/hooks/useTransaction';
import {
  QuaestioRecord,
  disputeThesis,
  fetchQuaestio,
  raiseQuaestio,
} from '@/lib/contract';
import { Crown, Shield, BookOpen, Flame, Copy, Check } from '@/components/icons';
import { copyText, ordinal, shortAddr } from '@/lib/format';

function StatsCabinetCard({
  icon: Icon,
  label,
  value,
  description,
  actionButton,
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number | string; color?: string; className?: string }>;
  label: string;
  value: React.ReactNode;
  description: string;
  actionButton?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div
      className="parchment-card"
      style={{
        padding: '1.25rem',
        display: 'grid',
        gap: '0.5rem',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div className="card-corner-top-right" />
      <div className="card-corner-bottom-left" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span className="uppercase-tab" style={{ fontSize: '0.65rem' }}>
          {label}
        </span>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="gothic-header" style={{ fontSize: '1.45rem', color: 'var(--white-chalk)', lineHeight: 1.1 }}>
          {value}
        </span>
        {actionButton}
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)', lineHeight: 1.4 }}>
        {description}
      </p>
    </div>
  );
}

export default function Page() {
  const wallet = useWallet();
  const data = useContractData();
  const tx = useTransaction();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [clashOpen, setClashOpen] = useState(false);
  const [outcome, setOutcome] = useState<'OVERTHROW' | 'DEFEND' | null>(null);
  const [justChanged, setJustChanged] = useState(false);
  const [proponentCopied, setProponentCopied] = useState(false);

  const handleCopyProponent = useCallback(async (address: string) => {
    const success = await copyText(address);
    if (success) {
      setProponentCopied(true);
      setTimeout(() => setProponentCopied(false), 1500);
    }
  }, []);

  const lastSubmitRef = useRef<{ kind: 'propose' | 'clash'; claim?: string } | null>(null);

  // Maintain valid selection as topics load
  useEffect(() => {
    if (data.quaestiones.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !data.quaestiones.some((q) => q.id === selectedId)) {
      setSelectedId(data.quaestiones[0].id);
    }
  }, [data.quaestiones, selectedId]);

  const selectedQuaestio: QuaestioRecord | null = useMemo(
    () => data.quaestiones.find((q) => q.id === selectedId) ?? null,
    [data.quaestiones, selectedId],
  );

  const verifyWalletReady = useCallback((): boolean => {
    if (!wallet.userAddress) {
      pushToast({ kind: 'info', title: 'Unlock your wallet to raise a Quaestio or challenge a Thesis.' });
      wallet.triggerConnect();
      return false;
    }
    if (!wallet.isCorrectNetwork) {
      pushToast({
        kind: 'error',
        title: 'Incorrect Network Detected',
        body: 'Please configure Metamask to GenLayer StudioNet.',
      });
      return false;
    }
    return true;
  }, [wallet]);

  const openProposeModal = useCallback(() => {
    if (!verifyWalletReady()) return;
    setProposeOpen(true);
  }, [verifyWalletReady]);

  const openClashModal = useCallback(() => {
    if (!selectedQuaestio) return;
    if (!verifyWalletReady()) return;
    tx.resetTxState();
    setOutcome(null);
    setClashOpen(true);
  }, [verifyWalletReady, selectedQuaestio, tx]);

  // ---- Dispatch Propose Topic ----
  const submitPropose = useCallback(
    (topic: string, openingThesis: string) => {
      if (!wallet.userAddress) return;
      lastSubmitRef.current = { kind: 'propose', claim: openingThesis };
      const toastId = pushToast({ kind: 'loading', title: 'Recording Quaestio transaction...' });
      
      tx.dispatchTransaction({
        walletAddress: wallet.userAddress,
        transactionCallback: (client) => raiseQuaestio(client, topic, openingThesis),
        onStateChange: data.setPollingPaused,
        onSuccess: async () => {
          dismissToast(toastId);
          pushToast({
            kind: 'success',
            title: 'Quaestio Registered',
            body: 'Your scholastic topic and thesis have been written to the ledger.',
            txHash: tx.txState.txHash ?? undefined,
          });
          await data.refreshData();
        },
      });
    },
    [wallet.userAddress, tx, data],
  );

  // Close proposal modal on completion
  useEffect(() => {
    if (proposeOpen && lastSubmitRef.current?.kind === 'propose') {
      if (tx.txState.currentPhase === 'finalized') {
        setProposeOpen(false);
        tx.resetTxState();
      }
    }
  }, [tx.txState.currentPhase, proposeOpen, tx]);

  // Handle errors
  useEffect(() => {
    if (lastSubmitRef.current?.kind === 'propose' && tx.txState.currentPhase === 'reverted') {
      pushToast({ kind: 'error', title: 'Unable to raise Quaestio', body: tx.txState.errorMessage ?? '' });
    }
  }, [tx.txState.currentPhase, tx.txState.errorMessage]);

  // ---- Dispatch Challenge Clash ----
  const submitClash = useCallback(
    (antithesis: string) => {
      if (!wallet.userAddress || !selectedQuaestio) return;
      lastSubmitRef.current = { kind: 'clash', claim: antithesis };
      const qId = selectedQuaestio.id;
      
      tx.dispatchTransaction({
        walletAddress: wallet.userAddress,
        transactionCallback: (client) => disputeThesis(client, qId, antithesis),
        onStateChange: data.setPollingPaused,
        onSuccess: async () => {
          let disputeResult: 'OVERTHROW' | 'DEFEND' = 'DEFEND';
          try {
            const freshRecord = await fetchQuaestio(qId);
            disputeResult = freshRecord?.last_winner === 'CHALLENGER' ? 'OVERTHROW' : 'DEFEND';
          } catch {
            disputeResult = 'DEFEND';
          }
          setOutcome(disputeResult);
          if (disputeResult === 'OVERTHROW') {
            setJustChanged(true);
          }
          pushToast({
            kind: 'success',
            title: disputeResult === 'OVERTHROW' ? 'Thesis Overthrown!' : 'Thesis Defended!',
            txHash: tx.txState.txHash ?? undefined,
          });
          await data.refreshData();
        },
      });
    },
    [wallet.userAddress, selectedQuaestio, tx, data],
  );

  const handleRetryClash = useCallback(() => {
    const last = lastSubmitRef.current;
    if (last?.kind === 'clash' && last.claim) {
      tx.resetTxState();
      setOutcome(null);
      submitClash(last.claim);
    }
  }, [submitClash, tx]);

  const closeClashModal = useCallback(() => {
    setClashOpen(false);
    tx.resetTxState();
    setOutcome(null);
    setTimeout(() => setJustChanged(false), 1200);
  }, [tx]);

  const showSkeleton = data.isLoading && data.quaestiones.length === 0 && !data.fetchError;

  return (
    <>
      <Header wallet={wallet} stats={data.stats} onRefreshStats={data.refreshData} />

      <main className="shell" style={{ padding: '2rem 1.5rem 0' }}>
        {data.isStale && (
          <div className="badge badge-crimson" style={{ marginBottom: '1rem' }} role="status">
            Reconnecting to StudioNet RPC node...
          </div>
        )}

        <DataErrorBoundary onRetry={data.refreshData}>
          {data.fetchError && data.quaestiones.length === 0 ? (
            <ErrorState message={data.fetchError} onRetry={data.refreshData} />
          ) : showSkeleton ? (
            <div className="layout-triptych">
              <div className="parchment-card" style={{ padding: '1rem', minHeight: 200 }} />
              <ThesisSkeleton />
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div className="parchment-card" style={{ height: 100 }} />
                <div className="parchment-card" style={{ height: 100 }} />
                <div className="parchment-card" style={{ height: 100 }} />
              </div>
            </div>
          ) : data.quaestiones.length === 0 ? (
            <EmptyState
              title="No Scholastic Disputes Registered"
              body="Introduce the first disputation topic. Formulate a Quaestio and a dominant opening Thesis to establish the arena."
              action={
                <button className="btn btn-primary" onClick={openProposeModal}>
                  Initiate Scriptorium Thesis
                </button>
              }
            />
          ) : (
            <div className="layout-triptych">
              {/* Left Column: Topic Index */}
              <aside>
                <ThesisIndex
                  quaestiones={data.quaestiones}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onRaiseQuaestio={openProposeModal}
                />
              </aside>

              {/* Center Column: Active Topic & Progression History */}
              <div style={{ display: 'grid', gap: '2rem', minWidth: 0 }}>
                {selectedQuaestio && (
                  <>
                    <ThesisCard
                      quaestio={selectedQuaestio}
                      onDispute={openClashModal}
                      onRaiseNew={openProposeModal}
                      justChanged={justChanged}
                    />
                    <ProgressionHistory quaestio={selectedQuaestio} />
                  </>
                )}
              </div>

              {/* Right Column: Stats Panel */}
              <aside style={{ display: 'grid', gap: '1.25rem', height: 'fit-content' }}>
                {selectedQuaestio ? (
                  <>
                    <StatsCabinetCard
                      icon={Crown}
                      iconColor="var(--gold-accent)"
                      label="Current Proponent"
                      value={shortAddr(selectedQuaestio.proponent)}
                      description="The scholar addressing the Quaestio who currently holds the dominant Thesis."
                      actionButton={
                        <button
                          onClick={() => handleCopyProponent(selectedQuaestio.proponent)}
                          aria-label="Copy proponent address"
                          style={{
                            color: 'var(--crimson-accent)',
                            display: 'inline-flex',
                            cursor: 'pointer',
                            marginLeft: 4,
                            background: 'none',
                            border: 'none',
                          }}
                        >
                          {proponentCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      }
                    />
                    <StatsCabinetCard
                      icon={Shield}
                      iconColor="var(--teal-accent)"
                      label="Defensive Objections"
                      value={`${selectedQuaestio.defenses} Defenses`}
                      description="Objections evaluated and dismissed by validators in favor of the active proponent."
                    />
                    <StatsCabinetCard
                      icon={BookOpen}
                      label="Generation Level"
                      value={`${ordinal(selectedQuaestio.progression_index)} Stage`}
                      description="The generational evolution count of logical claims under this topic."
                    />
                    <StatsCabinetCard
                      icon={Flame}
                      iconColor="var(--crimson-accent)"
                      label="Timeline History"
                      value={`${selectedQuaestio.progression.length} Overthrown`}
                      description="Total count of previous scholars logically overthrown in this debate."
                    />
                  </>
                ) : (
                  <div className="parchment-card" style={{ padding: '1.25rem', color: 'var(--text-faint)', textAlign: 'center' }}>
                    Select a debate topic from the directory to review its status.
                  </div>
                )}
              </aside>
            </div>
          )}
        </DataErrorBoundary>
      </main>

      <Footer />

      {/* Write modals */}
      <ThesisModal
        open={proposeOpen}
        onClose={() => {
          if (tx.txState.currentPhase === 'signing' || tx.txState.currentPhase === 'sent') return;
          setProposeOpen(false);
        }}
        onSubmit={submitPropose}
        submitting={
          lastSubmitRef.current?.kind === 'propose' &&
          (tx.txState.currentPhase === 'signing' ||
            tx.txState.currentPhase === 'sent' ||
            tx.txState.currentPhase === 'deliberation')
        }
      />

      <ClashModal
        open={clashOpen}
        onClose={closeClashModal}
        quaestio={selectedQuaestio}
        tx={tx.txState}
        outcome={outcome}
        onSubmit={submitClash}
        onRetry={handleRetryClash}
      />

      <ToastHost />
    </>
  );
}
