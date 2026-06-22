import CryptoJS from "crypto-js";
import { getEnv } from "@/lib/config/env";

export function encrypt(text: string): string {
  const { ENCRYPTION_KEY } = getEnv();
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const { ENCRYPTION_KEY } = getEnv();
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function encryptObject<T extends Record<string, unknown>>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

export function decryptObject<T extends Record<string, unknown>>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext)) as T;
}
