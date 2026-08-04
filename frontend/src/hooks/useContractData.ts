'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  QuaestioRecord,
  LedgerEvent,
  ColiseumStats,
  fetchQuaestiones,
  fetchScholasticLedger,
  fetchColiseumStats,
} from '@/lib/contract';

const POLLING_INTERVAL_MS = 95_000;

export interface ContractDataHook {
  quaestiones: QuaestioRecord[];
  ledger: LedgerEvent[];
  stats: ColiseumStats | null;
  isLoading: boolean;
  fetchError: string | null;
  isStale: boolean;
  refreshData: () => Promise<void>;
  setPollingPaused: (paused: boolean) => void;
}

function handleFetchError(error: unknown): string {
  const errMsg = String(error);
  if (/contract not found|execution reverted|no contract/i.test(errMsg)) {
    return 'Disputatio contract address not deployed or incorrect on StudioNet. Re-deployment might be necessary.';
  }
  if (/rate limit|429|too many/i.test(errMsg)) {
    return 'The network node is rate-limiting reads. Retrying shortly...';
  }
  return 'Could not retrieve data from the contract. Check your node connection and retry.';
}

export function useContractData(): ContractDataHook {
  const [quaestiones, setQuaestiones] = useState<QuaestioRecord[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [stats, setStats] = useState<ColiseumStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const isComponentMounted = useRef(true);
  const isPollingPaused = useRef(false);
  const timestampLastFetch = useRef<number>(0);

  const loadContractState = useCallback(async () => {
    try {
      const [records, logEvents, globalStats] = await Promise.all([
        fetchQuaestiones(0),
        fetchScholasticLedger(0),
        fetchColiseumStats(),
      ]);
      
      if (!isComponentMounted.current) return;
      
      setQuaestiones(records);
      setLedger(logEvents);
      setStats(globalStats);
      setFetchError(null);
      setIsStale(false);
      timestampLastFetch.current = Date.now();
    } catch (err) {
      if (!isComponentMounted.current) return;
      setFetchError(handleFetchError(err));
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading((prev) => prev || quaestiones.length === 0);
    await loadContractState();
  }, [loadContractState, quaestiones.length]);

  const setPollingPaused = useCallback((paused: boolean) => {
    isPollingPaused.current = paused;
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;
    loadContractState();

    const intervalId = setInterval(() => {
      if (isPollingPaused.current) return; // Skip polling if a transaction is pending
      if (Date.now() - timestampLastFetch.current > POLLING_INTERVAL_MS * 1.5) {
        setIsStale(true);
      }
      loadContractState();
    }, POLLING_INTERVAL_MS);

    return () => {
      isComponentMounted.current = false;
      clearInterval(intervalId);
    };
  }, [loadContractState]);

  return {
    quaestiones,
    ledger,
    stats,
    isLoading,
    fetchError,
    isStale,
    refreshData,
    setPollingPaused,
  };
}
