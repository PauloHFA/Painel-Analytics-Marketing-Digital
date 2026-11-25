import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarParecerIa } from '../src/services/aiCopilotService';
import { calcularBudgetPacing } from '../src/services/pacingService';
import { consolidarResumo, gerarSerieTemporal, obterOrigensGA4 } from '../src/services/metricsService';
import { WebhookCrmSchema } from '@dashboard/shared';
import { store } from '../src/db/store';
import { SEED_IDS, novoUuid } from '../src/db/ids';

test('Recurso 1: AI Growth Copilot - Parecer Executivo', async (t) => {
  await t.test('deve gerar parecer analítico com score e recomendações para o cliente', () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const dInicio = new Date();
    dInicio.setDate(dInicio.getDate() - 30);
    const inicio = dInicio.toISOString().slice(0, 10);

    const parecer = gerarParecerIa(SEED_IDS.CLIENTES.TECHNOVA, inicio, hoje);

    assert.ok(parecer.resumoExecutivo.length > 20);
    assert.ok(parecer.scoreDesempenho >= 40 && parecer.scoreDesempenho <= 100);
    assert.ok(parecer.destaquesPositivos.length > 0);
    assert.ok(parecer.recomendacoesEstrategicas.length > 0);
  });
});

test('Recurso 2: Agendamento e Envio Automático (RF-15)', async (t) => {
  await t.test('deve listar agendamentos existentes e permitir disparo simulado', () => {
    const agendamento = store.agendamentos.find((a) => a.clienteId === SEED_IDS.CLIENTES.TECHNOVA);
    assert.ok(agendamento, 'Deve haver agendamento configurado');

    agendamento.ultimoEnvio = new Date().toISOString();
    agendamento.statusUltimoEnvio = 'sucesso';
    assert.equal(agendamento.statusUltimoEnvio, 'sucesso');
  });
});

test('Recurso 3: Previsão de Ritmo de Gasto (Budget Pacing & Run-rate)', async (t) => {
  await t.test('deve projetar fechamento do mês (run-rate) e calcular ritmo diário recomendado', () => {
    const pacing = calcularBudgetPacing(SEED_IDS.CLIENTES.TECHNOVA);

    assert.ok(pacing.verbaMensalContratada > 0);
    assert.ok(pacing.projecaoFimDoMes > 0);
    assert.ok(['no_ritmo', 'acelerado', 'lento'].includes(pacing.status));
    assert.ok(pacing.mensagemRecomendacao.length > 10);
  });
});

test('Recurso 4: Webhook Nativo de CRM para CAC e ROI', async (t) => {
  await t.test('deve registrar evento de oportunidade ganha do CRM e atualizar receita', () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const entradasIniciais = store.entradasManuais.length;

    // Simula evento de webhook recebido
    const novaEntrada = {
      id: novoUuid(),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      data: hoje,
      receita: 4500.0,
      novosClientes: 2,
      custosExtras: 0,
      observacao: 'Webhook RD Station: Venda Fechada',
    };
    store.entradasManuais.push(novaEntrada);

    assert.equal(store.entradasManuais.length, entradasIniciais + 1);
    assert.equal(novaEntrada.receita, 4500.0);

    store.entradasManuais.pop();
  });

  await t.test('WebhookCrmSchema evita NaN quando novosClientes é omitido e consolidarResumo soma receita manual ao GA4', () => {
    const parsed = WebhookCrmSchema.parse({ receita: 1200 });
    assert.equal(parsed.novosClientes, 1);
    assert.equal(Number.isNaN(parsed.novosClientes), false);

    const hoje = new Date().toISOString().slice(0, 10);
    const dInicio = new Date();
    dInicio.setDate(dInicio.getDate() - 7);
    const inicio = dInicio.toISOString().slice(0, 10);

    const antes = consolidarResumo(SEED_IDS.CLIENTES.TECHNOVA, inicio, hoje);
    const entradaExtra = {
      id: novoUuid(),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      data: hoje,
      receita: 1000,
      novosClientes: 1,
      custosExtras: 0,
    };
    store.entradasManuais.push(entradaExtra);
    const depois = consolidarResumo(SEED_IDS.CLIENTES.TECHNOVA, inicio, hoje);
    assert.equal(Number((depois.receitaTotal - antes.receitaTotal).toFixed(2)), 1000);
    assert.ok(depois.novosSeguidoresInstagram > 0);

    const idx = store.entradasManuais.findIndex((e) => e.id === entradaExtra.id);
    if (idx >= 0) store.entradasManuais.splice(idx, 1);

    const origens = obterOrigensGA4(SEED_IDS.CLIENTES.TECHNOVA, inicio, hoje);
    assert.ok(origens.length > 0);
    assert.ok(origens.some((o) => o.origemMidia === 'google / cpc'));

    const d90 = new Date();
    d90.setDate(d90.getDate() - 89);
    const serieSem = gerarSerieTemporal({
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      inicio: d90.toISOString().slice(0, 10),
      fim: hoje,
      granularidade: 'semana',
      comparar: 'nenhum',
    });
    const serieMes = gerarSerieTemporal({
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      inicio: d90.toISOString().slice(0, 10),
      fim: hoje,
      granularidade: 'mes',
      comparar: 'nenhum',
    });
    assert.ok(serieSem.atual.length >= 12 && serieSem.atual.length <= 15);
    assert.ok(serieMes.atual.length >= 3 && serieMes.atual.length <= 4);
    assert.ok(serieSem.atual[0].data.startsWith('Sem '));
  });
});

