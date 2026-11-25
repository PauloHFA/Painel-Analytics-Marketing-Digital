import { randomUUID } from 'node:crypto';

export function gerarUuidCliente(numero: number): string {
  return `c0000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
}

export function gerarUuidDeterministico(prefixoHex8: string, numero: number): string {
  return `${prefixoHex8}-0000-4000-8000-${String(numero).padStart(12, '0')}`;
}

export const SEED_IDS = {
  AGENCIA: 'a0000000-0000-4000-8000-000000000001',
  CLIENTES: {
    TECHNOVA: gerarUuidCliente(1),
    MODA_URBANA: gerarUuidCliente(2),
    CLINICA_SAUDE: gerarUuidCliente(3),
  },
  USUARIOS: {
    RICK: 'd0000000-0000-4000-8000-000000000000',
    ADMIN: 'd0000000-0000-4000-8000-000000000001',
    GESTOR: 'd0000000-0000-4000-8000-000000000002',
    CLIENTE_01: 'd0000000-0000-4000-8000-000000000003',
    CLIENTE_02: 'd0000000-0000-4000-8000-000000000004',
  },
  CONTAS: {
    TN_GA4: 'b0000000-0000-4000-8000-000000000001',
    TN_GADS: 'b0000000-0000-4000-8000-000000000002',
    TN_META: 'b0000000-0000-4000-8000-000000000003',
    TN_INSTA: 'b0000000-0000-4000-8000-000000000004',
    MU_GA4: 'b0000000-0000-4000-8000-000000000005',
    MU_META: 'b0000000-0000-4000-8000-000000000006',
  },
} as const;

export function novoUuid(): string {
  return randomUUID();
}
