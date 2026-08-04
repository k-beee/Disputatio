export function shortAddr(address: string | null | undefined): string {
  if (!address) return '';
  const clean = address.startsWith('0x') ? address : `0x${address}`;
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
