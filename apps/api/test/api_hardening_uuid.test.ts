import test from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { app } from '../src/server';
import { SEED_IDS, gerarUuidCliente } from '../src/db/ids';
import { cifrarCredencial, decifrarCredencial } from '../src/utils/crypto';
import { pgManager } from '../src/db/postgres';

test('UUID, Criptografia AES-256-GCM, RLS SQL e Rotas HTTP da API', async (t) => {
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(() => {
    server.close();
  });

  await t.test('AES-256-GCM cifra e decifra tokens externos com autenticidade', () => {
    const tokenOriginal = 'ya29.a0AfH6SMBx-token-oauth-teste';
    const cifrado = cifrarCredencial(tokenOriginal);
    assert.notEqual(cifrado, tokenOriginal);
    assert.equal(cifrado.split(':').length, 3);
    assert.equal(decifrarCredencial(cifrado), tokenOriginal);
  });

  await t.test('PostgresClientManager.gerarComandoRLS aceita apenas UUIDs válidos e bloqueia injeção', () => {
    const sql = pgManager.gerarComandoRLS([SEED_IDS.CLIENTES.TECHNOVA, SEED_IDS.CLIENTES.MODA_URBANA]);
    assert.match(sql, /^SET LOCAL app\.cliente_ids = '[0-9a-f-,]+';$/);

    assert.throws(() => {
      pgManager.gerarComandoRLS(["' OR 1=1 --"]);
    });
  });

  await t.test('API aplica headers de segurança (Helmet + RateLimit) e rejeita IDOR/UUID inválido via HTTP', async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const respInvalido = await fetch(
      `${baseUrl}/api/v1/metricas/resumo?clienteId=nao-e-uuid&inicio=${hoje}&fim=${hoje}`,
      { headers: { 'x-user-id': SEED_IDS.USUARIOS.ADMIN } }
    );
    assert.equal(respInvalido.status, 422);
    assert.ok(respInvalido.headers.get('x-content-type-options'));
    assert.ok(respInvalido.headers.get('ratelimit-limit'));

    const respIdor = await fetch(
      `${baseUrl}/api/v1/metricas/resumo?clienteId=${SEED_IDS.CLIENTES.MODA_URBANA}&inicio=${hoje}&fim=${hoje}`,
      { headers: { 'x-user-id': SEED_IDS.USUARIOS.CLIENTE_01 } }
    );
    assert.equal(respIdor.status, 403);
  });

  await t.test('Gestor não pode criar entrada manual em cliente fora da sua carteira', async () => {
    const clienteNaoAtribuido = gerarUuidCliente(50);
    const resp = await fetch(`${baseUrl}/api/v1/clientes/${clienteNaoAtribuido}/entradas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': SEED_IDS.USUARIOS.GESTOR,
      },
      body: JSON.stringify({
        data: '2026-11-19',
        receita: 1000,
        novosClientes: 1,
        custosExtras: 0,
      }),
    });
    assert.equal(resp.status, 403);
  });

  await t.test('CRUD de Clientes, exclusão LGPD e trilha de auditoria funcionam com UUID', async () => {
    const criarResp = await fetch(`${baseUrl}/api/v1/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': SEED_IDS.USUARIOS.ADMIN,
      },
      body: JSON.stringify({
        nome: 'Cliente Teste LGPD',
        moeda: 'BRL',
        fontePrimariaConversoes: 'ga4',
      }),
    });
    assert.equal(criarResp.status, 201);
    const criado: any = await criarResp.json();
    assert.match(criado.cliente.id, /^[0-9a-f-]{36}$/);

    const patchResp = await fetch(`${baseUrl}/api/v1/clientes/${criado.cliente.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': SEED_IDS.USUARIOS.ADMIN,
      },
      body: JSON.stringify({ nome: 'Cliente Teste Atualizado' }),
    });
    assert.equal(patchResp.status, 200);

    const lgpdResp = await fetch(`${baseUrl}/api/v1/clientes/${criado.cliente.id}/dados`, {
      method: 'DELETE',
      headers: { 'x-user-id': SEED_IDS.USUARIOS.ADMIN },
    });
    assert.equal(lgpdResp.status, 200);

    const auditResp = await fetch(`${baseUrl}/api/v1/auditoria`, {
      headers: { 'x-user-id': SEED_IDS.USUARIOS.ADMIN },
    });
    assert.equal(auditResp.status, 200);
    const auditBody: any = await auditResp.json();
    assert.ok(auditBody.registros.some((r: any) => r.acao === 'exclusao_dados_lgpd' && r.entidadeId === criado.cliente.id));
  });
});
