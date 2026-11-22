'use client';

export const CONSENT_EVENT_NAME = 'ayurswift:consent-accepted';
const LOCAL_CONSENT_KEY = 'ayurswift_consent_v1';

export interface SolvedCheckoutGuard {
  guardToken: string;
  guardSolution: string;
  issuedAt: number;
  expiresAt: number;
}

// Lightweight pure-JS SHA-256 fallback (only used if WebCrypto subtle is unavailable on non-HTTPS LAN)
function sha256FallbackHex(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));
  const maxWord = Math.pow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(buf);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }
  return sha256FallbackHex(input);
}

/**
 * Fetches a single-use HMAC-signed anti-bot challenge and solves the lightweight
 * SHA-256 micro-puzzle invisibly (~20-40ms on mobile) with zero user friction.
 */
export async function fetchAndSolveCheckoutGuard(): Promise<SolvedCheckoutGuard | null> {
  try {
    const res = await fetch('/api/checkout-guard', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      guardToken?: string;
      nonce?: string;
      difficultyHexZeros?: number;
      expiresAt?: number;
    };
    if (!data?.success || !data.guardToken || !data.nonce) return null;

    const prefix = '0'.repeat(Math.max(1, Math.min(5, data.difficultyHexZeros || 3)));
    const issuedAt = Date.now();
    const maxAttempts = 250_000;

    for (let i = 0; i < maxAttempts; i++) {
      const candidate = i.toString(36);
      const digest = await sha256Hex(`${data.nonce}:${candidate}`);
      if (digest.startsWith(prefix)) {
        return {
          guardToken: data.guardToken,
          guardSolution: candidate,
          issuedAt,
          expiresAt: data.expiresAt || issuedAt + 9 * 60_000,
        };
      }
      // Yield every 512 hashes so mobile scrolling stays buttery smooth at 60fps
      if ((i & 511) === 511) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkPrivacyConsentStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/consent', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = (await res.json()) as { accepted?: boolean; version?: string };
    const accepted = Boolean(data?.accepted);
    try {
      if (accepted && data.version) {
        localStorage.setItem(LOCAL_CONSENT_KEY, data.version);
      } else {
        localStorage.removeItem(LOCAL_CONSENT_KEY);
      }
    } catch {}
    return accepted;
  } catch {
    return false;
  }
}

export async function acceptPrivacyConsent(): Promise<boolean> {
  try {
    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ accepted: true }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean; accepted?: boolean; version?: string };
    if (data?.success && data.accepted) {
      try {
        localStorage.setItem(LOCAL_CONSENT_KEY, data.version || 'accepted');
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME));
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
