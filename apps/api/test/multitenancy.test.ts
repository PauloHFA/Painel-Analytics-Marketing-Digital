import test from 'node:test';
import assert from 'node:assert/strict';
import { authMiddleware, isolamentoClienteMiddleware, usuarioTemAcessoAoCliente } from '../src/middleware/auth';
import { store } from '../src/db/store';
import { SEED_IDS, gerarUuidCliente } from '../src/db/ids';

test('Isolamento Multi-tenant e Defesa em Camadas (Seção 9.2 e 14 do PDF)', async (t) => {
  await t.test('Cliente A (usr-cliente-01) DEVE ter acesso bloqueado (403) ao tentar consultar dados do Cliente B (Moda Urbana)', () => {
    const usuarioClienteA = store.usuarios.find((u) => u.id === SEED_IDS.USUARIOS.CLIENTE_01);
    assert.ok(usuarioClienteA);

    let statusRetornado = 0;
    let jsonRetornado: any = null;

    const reqMock: any = {
      usuario: usuarioClienteA,
      query: { clienteId: SEED_IDS.CLIENTES.MODA_URBANA }, // Tentativa de IDOR acessando outro cliente
      params: {},
      body: {},
    };

    const resMock: any = {
      status: (code: number) => {
        statusRetornado = code;
        return {
          json: (data: any) => {
            jsonRetornado = data;
          },
        };
      },
    };

    let nextChamado = false;
    const nextMock = () => {
      nextChamado = true;
    };

    isolamentoClienteMiddleware(reqMock, resMock, nextMock);

    assert.equal(statusRetornado, 403, 'Acesso cruzado de cliente deve retornar 403 Forbidden');
    assert.equal(nextChamado, false, 'Middleware não pode prosseguir para consulta');
    assert.match(jsonRetornado.detail, /Violação de isolamento/);
  });

  await t.test('Cliente A deve ter acesso permitido (200) aos seus próprios dados (TechNova)', () => {
    const usuarioClienteA = store.usuarios.find((u) => u.id === SEED_IDS.USUARIOS.CLIENTE_01);
    assert.ok(usuarioClienteA);

    const reqMock: any = {
      usuario: usuarioClienteA,
      query: { clienteId: SEED_IDS.CLIENTES.TECHNOVA },
      params: {},
      body: {},
    };

    const resMock: any = {};
    let nextChamado = false;
    const nextMock = () => {
      nextChamado = true;
    };

    isolamentoClienteMiddleware(reqMock, resMock, nextMock);

    assert.equal(nextChamado, true);
    assert.equal(reqMock.clienteIdPermitido, SEED_IDS.CLIENTES.TECHNOVA);
  });

  await t.test('Admin da Agência pode alternar e auditar qualquer cliente da carteira de 60 clientes', () => {
    const admin = store.usuarios.find((u) => u.id === SEED_IDS.USUARIOS.ADMIN);
    assert.ok(admin);

    const cliente45 = gerarUuidCliente(45);
    const reqMock: any = {
      usuario: admin,
      query: { clienteId: cliente45 }, // Acessa cliente 45 da carteira
      params: {},
      body: {},
    };

    let nextChamado = false;
    isolamentoClienteMiddleware(reqMock, {} as any, () => {
      nextChamado = true;
    });

    assert.equal(nextChamado, true);
    assert.equal(reqMock.clienteIdPermitido, cliente45);
  });

  await t.test('Gestor de Contas tem acesso limitado aos clientes sob sua gestão', () => {
    const gestor = store.usuarios.find((u) => u.id === SEED_IDS.USUARIOS.GESTOR);
    assert.ok(gestor);

    // Cliente atribuído ao gestor
    const reqPermitido: any = {
      usuario: gestor,
      query: { clienteId: SEED_IDS.CLIENTES.MODA_URBANA },
      params: {},
      body: {},
    };

    let permitidoChamado = false;
    isolamentoClienteMiddleware(reqPermitido, {} as any, () => {
      permitidoChamado = true;
    });
    assert.equal(permitidoChamado, true);

    // Cliente não atribuído (cliente 50)
    let statusBloqueado = 0;
    const reqBloqueado: any = {
      usuario: gestor,
      query: { clienteId: gerarUuidCliente(50) },
      params: {},
      body: {},
    };
    const resMock: any = {
      status: (code: number) => {
        statusBloqueado = code;
        return { json: () => {} };
      },
    };

    isolamentoClienteMiddleware(reqBloqueado, resMock, () => {});
    assert.equal(statusBloqueado, 403);
  });

  await t.test('usuarioTemAcessoAoCliente bloqueia gestor em cliente fora da sua carteira e authMiddleware aceita query token', () => {
    const gestor = store.usuarios.find((u) => u.id === SEED_IDS.USUARIOS.GESTOR)!;
    assert.equal(usuarioTemAcessoAoCliente(gestor, SEED_IDS.CLIENTES.TECHNOVA), true);
    assert.equal(usuarioTemAcessoAoCliente(gestor, gerarUuidCliente(50)), false);

    const reqCsv: any = { headers: {}, query: { token: SEED_IDS.USUARIOS.CLIENTE_01 } };
    let nextOk = false;
    authMiddleware(reqCsv, {} as any, () => {
      nextOk = true;
    });
    assert.equal(nextOk, true);
    assert.equal(reqCsv.usuario?.id, SEED_IDS.USUARIOS.CLIENTE_01);
  });
});

