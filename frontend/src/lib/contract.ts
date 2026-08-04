import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

// Disputatio contract address on GenLayer StudioNet.
// Set as empty string initially; the user will deploy and provide the address.
export const CONTRACT_ADDRESS =
  '0x925DADc52640F1357D62028A36A355142cEdE866' as `0x${string}`;
export const DEPLOY_TX = '';

export const EXPLORER_URL = 'https://explorer-studio.genlayer.com';
export const FAUCET_URL = 'https://testnet-faucet.genlayer.foundation/';
export const DOCS_URL = 'https://docs.genlayer.com';

// Read-only client for fetching public state
export const readClient = createClient({ chain: studionet });

// Wallet client factory for dispatching signed write transactions
export const makeWalletClient = (account: `0x${string}`) =>
  createClient({ chain: studionet, account });

export type WalletClient = ReturnType<typeof makeWalletClient>;

// ---- State interface structures mapping from python contract schemas ----

export type CategoricalVerdict = 'PROPONENT' | 'CHALLENGER' | '' | string;
export type DuelResult = 'OVERTHROW' | 'DEFEND' | string;

export interface ProgressionLog {
  proponent: string;
  claim: string;
  defenses: number;
  progression_index: number;
  toppled_by: string;
  margin: number;
}

export interface QuaestioRecord {
  id: string;
  topic: string;
  proponent: string;
  claim: string;
  founder: string;
  progression_index: number;
  defenses: number;
  clashes: number;
  last_winner: CategoricalVerdict;
  last_margin: number;
  last_note: string;
  progression: ProgressionLog[];
}

export interface LedgerEvent {
  arena: string;
  topic: string;
  opponent: string;
  result: DuelResult;
  margin: number;
  note: string;
  proponent: string;
}

export interface ColiseumStats {
  arenas: number;
  debates: number;
  overthrows: number;
  accumulated_fees: string;
}

// 0.05 GEN represented in Wei
const REGISTRATION_FEE_WEI = 50000000000000000n;

// ---- Map and BigInt normalization layers for genlayer-js outputs ----

function castToRecord<T>(value: unknown): T {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = normalizeValue(v);
    return obj as T;
  }
  return value as T;
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Map) return castToRecord(value);
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function parseProgressionLog(raw: unknown): ProgressionLog {
  const r = castToRecord<Record<string, unknown>>(raw);
  return {
    proponent: String(r.proponent ?? ''),
    claim: String(r.claim ?? ''),
    defenses: toNum(r.defenses),
    progression_index: toNum(r.progression_index),
    toppled_by: String(r.toppled_by ?? ''),
    margin: toNum(r.margin),
  };
}

function parseQuaestio(raw: unknown): QuaestioRecord {
  const r = castToRecord<Record<string, unknown>>(raw);
  const progressionRaw = normalizeValue(r.progression);
  const progression = Array.isArray(progressionRaw) ? progressionRaw.map(parseProgressionLog) : [];
  return {
    id: String(r.id ?? ''),
    topic: String(r.topic ?? ''),
    proponent: String(r.proponent ?? ''),
    claim: String(r.claim ?? ''),
    founder: String(r.founder ?? ''),
    progression_index: toNum(r.progression_index),
    defenses: toNum(r.defenses),
    clashes: toNum(r.clashes),
    last_winner: String(r.last_winner ?? ''),
    last_margin: toNum(r.last_margin),
    last_note: String(r.last_note ?? ''),
    progression,
  };
}

function parseLedgerEvent(raw: unknown): LedgerEvent {
  const r = castToRecord<Record<string, unknown>>(raw);
  return {
    arena: String(r.arena ?? ''),
    topic: String(r.topic ?? ''),
    opponent: String(r.opponent ?? ''),
    result: String(r.result ?? ''),
    margin: toNum(r.margin),
    note: String(r.note ?? ''),
    proponent: String(r.proponent ?? ''),
  };
}

// ---- Resilient RPC reads with exponential backoff ----

export async function executeWithRpcRetry<T>(queryFn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (e) {
      lastErr = e;
      if (!/rate limit|429|timeout|network|fetch|too many/i.test(String(e))) throw e;
      await new Promise((resolve) => setTimeout(resolve, 2500 * 2 ** attempt));
    }
  }
  throw lastErr;
}

export async function fetchQuaestiones(startIdx = 0): Promise<QuaestioRecord[]> {
  if (!CONTRACT_ADDRESS) return [];
  const raw = await executeWithRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_quaestiones',
      args: [startIdx],
    }),
  );
  const arr = (normalizeValue(raw) as unknown[]) ?? [];
  return arr.map(parseQuaestio);
}

export async function fetchQuaestio(id: string): Promise<QuaestioRecord | null> {
  if (!CONTRACT_ADDRESS) return null;
  const raw = await executeWithRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_quaestio',
      args: [id],
    }),
  );
  return parseQuaestio(normalizeValue(raw));
}

export async function fetchScholasticLedger(startIdx = 0): Promise<LedgerEvent[]> {
  if (!CONTRACT_ADDRESS) return [];
  const raw = await executeWithRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_scholastic_ledger',
      args: [startIdx],
    }),
  );
  const arr = (normalizeValue(raw) as unknown[]) ?? [];
  return arr.map(parseLedgerEvent);
}

export async function fetchColiseumStats(): Promise<ColiseumStats | null> {
  if (!CONTRACT_ADDRESS) return null;
  const raw = await executeWithRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_disputatio_stats',
      args: [],
    }),
  );
  const r = castToRecord<Record<string, unknown>>(normalizeValue(raw));
  return {
    arenas: toNum(r.arenas),
    debates: toNum(r.debates),
    overthrows: toNum(r.overthrows),
    accumulated_fees: String(r.accumulated_fees ?? '0'),
  };
}

// ---- State Mutating Method Dispatches (0.05 GEN fee enforced) ----

export function raiseQuaestio(client: WalletClient, topic: string, openingThesis: string) {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not set.');
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'raise_quaestio',
    args: [topic, openingThesis],
    value: REGISTRATION_FEE_WEI,
  });
}

export function disputeThesis(
  client: WalletClient,
  quaestioId: string,
  antithesisClaim: string,
) {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not set.');
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'dispute_thesis',
    args: [quaestioId, antithesisClaim],
    value: REGISTRATION_FEE_WEI,
  });
}

export function withdrawFees(client: WalletClient) {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address not set.');
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'withdraw_fees',
    args: [],
    value: 0n,
  });
}

// ---- Transaction Consensus Polling & Peeking ----

const CONSENSUS_STATUSES: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
};

export const getStatusName = (statusCode: unknown): string =>
  CONSENSUS_STATUSES[String(statusCode)] ?? String(statusCode ?? 'PENDING').toUpperCase();

const TERMINAL_STATUSES = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface JuryVerdictDraft {
  verdict: string;
  margin?: number;
  note?: string;
}

function traverse(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

function parseJuryDraft(value: unknown): JuryVerdictDraft | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!('verdict' in v)) return null;
  return {
    verdict: String(v.verdict ?? '').toUpperCase(),
    margin: 'margin' in v ? toNum(v.margin) : undefined,
    note: 'note' in v ? String(v.note ?? '') : undefined,
  };
}

function scanStringForJson(text: string): JuryVerdictDraft | null {
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] !== '{') continue;
    try {
      const obj = JSON.parse(text.slice(i));
      const draft = parseJuryDraft(obj);
      if (draft) return draft;
    } catch {
      /* continue scanning backwards */
    }
  }
  return null;
}

export function extractJuryDraft(tx: unknown): JuryVerdictDraft | null {
  try {
    const receipts = traverse(traverse(tx, 'consensus_data'), 'leader_receipt');
    const firstReceipt = Array.isArray(receipts) ? receipts[0] : receipts;
    const outputs = traverse(traverse(firstReceipt, 'eq_outputs'), '0');
    if (outputs == null) return null;

    if (typeof outputs === 'object') {
      const readable = traverse(outputs, 'readable') ?? traverse(outputs, 'payload');
      if (typeof readable === 'string') {
        try {
          const directMatch = parseJuryDraft(JSON.parse(readable));
          if (directMatch) return directMatch;
        } catch {
          /* fail through to backward scan */
        }
        const scannedMatch = scanStringForJson(readable);
        if (scannedMatch) return scannedMatch;
      }
      const inlineMatch = parseJuryDraft(outputs);
      if (inlineMatch) return inlineMatch;
      return null;
    }

    if (typeof outputs === 'string' && outputs.length > 0) {
      let rawText = outputs;
      try {
        rawText = atob(outputs);
      } catch {
        /* not base64 formatted, proceed with raw */
      }
      return scanStringForJson(rawText);
    }
    return null;
  } catch {
    return null;
  }
}

export async function pollConsensusState(
  client: WalletClient,
  txHash: `0x${string}`,
  onProgress?: (status: string, draft: JuryVerdictDraft | null) => void,
): Promise<{ status: string; draft: JuryVerdictDraft | null }> {
  let draft: JuryVerdictDraft | null = null;
  for (let pollCount = 0; pollCount < 150; pollCount++) {
    const tx = await client
      .getTransaction({ hash: txHash } as Parameters<typeof client.getTransaction>[0])
      .catch(() => null);
    
    const status = getStatusName(tx ? (tx as { status?: unknown }).status : 'PENDING');
    draft = extractJuryDraft(tx) ?? draft;
    
    onProgress?.(status, draft);
    
    if (TERMINAL_STATUSES.has(status)) {
      return { status, draft };
    }
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  return { status: 'TIMEOUT', draft };
}
