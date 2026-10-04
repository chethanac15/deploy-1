export async function hashShareToken(token: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure share links require a modern browser with Web Crypto support.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createShareToken(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure share links require a modern browser with Web Crypto support.');
  }
  const random = new Uint8Array(32);
  globalThis.crypto.getRandomValues(random);
  return Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
}
