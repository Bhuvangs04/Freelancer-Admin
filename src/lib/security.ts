/**
 * XOR encryption matching the backend's xorDecrypt logic.
 * Backend decrypts by: atob(obfuscated) -> XOR with key -> string
 * So we encrypt by: string -> XOR with key -> btoa()
 */

const XOR_KEY = "SecureOnlyThingsAreDone";

export function xorEncrypt(plainText: string, key: string = XOR_KEY): string {
  const xored = plainText
    .split("")
    .map((c, i) => c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
  const encoded = String.fromCharCode(...xored);
  return btoa(encoded);
}
