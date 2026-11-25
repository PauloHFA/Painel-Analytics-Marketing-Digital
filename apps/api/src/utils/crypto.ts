import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env';

const ALGORITMO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function resolverChave(chave?: string): Buffer {
  const segredo = chave ?? env.ENCRYPTION_KEY_AES;
  const buf = Buffer.from(segredo, 'utf8');
  if (buf.length !== 32) {
    throw new Error('Chave AES-256-GCM deve possuir exatamente 32 bytes.');
  }
  return buf;
}

export function cifrarCredencial(textoPlano: string, chave?: string): string {
  const key = resolverChave(chave);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITMO, key, iv);
  const encrypted = Buffer.concat([cipher.update(textoPlano, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decifrarCredencial(payloadCifrado: string, chave?: string): string {
  const partes = payloadCifrado.split(':');
  if (partes.length !== 3) {
    throw new Error('Formato de credencial cifrada inválido.');
  }
  const [ivHex, tagHex, cipherHex] = partes;
  const key = resolverChave(chave);
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(cipherHex, 'hex');

  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error('IV ou AuthTag inválido na credencial cifrada.');
  }

  const decipher = createDecipheriv(ALGORITMO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
