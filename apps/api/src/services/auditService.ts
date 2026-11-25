import { AuditoriaLog } from '@dashboard/shared';
import { store } from '../db/store';
import { novoUuid } from '../db/ids';

export interface RegistrarAuditoriaInput {
  usuarioId: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: Record<string, any>;
  ip?: string;
}

export function registrarAuditoria(input: RegistrarAuditoriaInput): AuditoriaLog {
  const registro: AuditoriaLog = {
    id: novoUuid(),
    usuarioId: input.usuarioId,
    acao: input.acao,
    entidade: input.entidade,
    entidadeId: input.entidadeId,
    detalhes: input.detalhes,
    ip: input.ip,
    criadoEm: new Date().toISOString(),
  };

  store.auditoria.unshift(registro);
  if (store.auditoria.length > 500) {
    store.auditoria.length = 500;
  }
  return registro;
}
