export const UUID_CLIENTES = {
  TECHNOVA: 'c0000000-0000-4000-8000-000000000001',
  MODA_URBANA: 'c0000000-0000-4000-8000-000000000002',
  CLINICA_SAUDE: 'c0000000-0000-4000-8000-000000000003',
} as const;

export const UUID_USUARIOS = {
  RICK: 'd0000000-0000-4000-8000-000000000000',
  ADMIN: 'd0000000-0000-4000-8000-000000000001',
  GESTOR: 'd0000000-0000-4000-8000-000000000002',
  CLIENTE_01: 'd0000000-0000-4000-8000-000000000003',
} as const;

const LEGACY_USER_MAP: Record<string, string> = {
  'usr-rick': UUID_USUARIOS.RICK,
  'usr-admin': UUID_USUARIOS.ADMIN,
  'usr-gestor': UUID_USUARIOS.GESTOR,
  'usr-cliente-01': UUID_USUARIOS.CLIENTE_01,
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolverUsuarioToken(raw: string | null): string {
  if (!raw) return UUID_USUARIOS.RICK;
  if (LEGACY_USER_MAP[raw]) return LEGACY_USER_MAP[raw];
  return UUID_REGEX.test(raw) ? raw : UUID_USUARIOS.RICK;
}

export function isUuidValido(valor?: string): boolean {
  return Boolean(valor && UUID_REGEX.test(valor));
}
