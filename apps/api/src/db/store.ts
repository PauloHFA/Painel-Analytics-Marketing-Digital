import {
  AgenciaMarca,
  Cliente,
  Usuario,
  ContaConectada,
  FatoAdsDiario,
  FatoGA4Diario,
  FatoInstagramDiario,
  InstagramMidia,
  EntradaManual,
  SincronizacaoLog,
  MetaCliente,
  RelatorioGerado,
  AgendamentoRelatorio,
  AuditoriaLog,
} from '@dashboard/shared';
import { SEED_IDS, gerarUuidCliente, gerarUuidDeterministico, novoUuid } from './ids';

export interface DataStore {
  marca: AgenciaMarca;
  clientes: Cliente[];
  usuarios: Usuario[];
  contas: ContaConectada[];
  fatosAds: FatoAdsDiario[];
  fatosGA4: FatoGA4Diario[];
  fatosInstagram: FatoInstagramDiario[];
  midiasInstagram: InstagramMidia[];
  entradasManuais: EntradaManual[];
  sincronizacoes: SincronizacaoLog[];
  metas: MetaCliente[];
  relatorios: RelatorioGerado[];
  agendamentos: AgendamentoRelatorio[];
  auditoria: AuditoriaLog[];
}

export function inicializarStore(): DataStore {
  const marca: AgenciaMarca = {
    id: SEED_IDS.AGENCIA,
    nome: 'Agência GrowMetrics Digital',
    logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    corPrimaria: '#2563eb', // Azul Royal
    corSecundaria: '#0ea5e9', // Ciano
    corNeutra: '#64748b', // Slate
    fonte: 'Inter, sans-serif',
    rodapeTexto: 'Relatório confidencial gerado pela Agência GrowMetrics Digital - Todos os direitos reservados.',
  };

  // Criação dos 60 clientes da agência (conforme especificado no PDF)
  const clientes: Cliente[] = [
    {
      id: SEED_IDS.CLIENTES.TECHNOVA,
      nome: 'TechNova Soluções SaaS',
      documento: '12.345.678/0001-90',
      fusoHorario: 'America/Sao_Paulo',
      moeda: 'BRL',
      fontePrimariaConversoes: 'ga4',
      ativo: true,
      criadoEm: '2025-01-15T00:00:00Z',
    },
    {
      id: SEED_IDS.CLIENTES.MODA_URBANA,
      nome: 'Moda Urbana E-commerce',
      documento: '23.456.789/0001-01',
      fusoHorario: 'America/Sao_Paulo',
      moeda: 'BRL',
      fontePrimariaConversoes: 'ga4',
      ativo: true,
      criadoEm: '2025-02-10T00:00:00Z',
    },
    {
      id: SEED_IDS.CLIENTES.CLINICA_SAUDE,
      nome: 'Clínica Saúde & Estética',
      documento: '34.567.890/0001-12',
      fusoHorario: 'America/Sao_Paulo',
      moeda: 'BRL',
      fontePrimariaConversoes: 'plataformas',
      ativo: true,
      criadoEm: '2025-03-01T00:00:00Z',
    },
  ];

  // Adicionar outros clientes para completar a carteira de 60 clientes
  for (let i = 4; i <= 60; i++) {
    clientes.push({
      id: gerarUuidCliente(i),
      nome: `Cliente Corporativo ${i} - Brasil`,
      fusoHorario: 'America/Sao_Paulo',
      moeda: 'BRL',
      fontePrimariaConversoes: 'ga4',
      ativo: true,
      criadoEm: '2025-01-01T00:00:00Z',
    });
  }

  // Usuários com perfis definidos (Admin, Gestor, Cliente)
  const usuarios: Usuario[] = [
    {
      id: SEED_IDS.USUARIOS.RICK,
      nome: 'Rick (Colaborador / Admin)',
      email: 'rickphtb@gmail.com',
      perfil: 'admin',
      ativo: true,
      clientesIds: clientes.map((c) => c.id),
      criadoEm: '2025-01-01T00:00:00Z',
    },
    {
      id: SEED_IDS.USUARIOS.ADMIN,
      nome: 'Ricardo Cardoso (Diretor)',
      email: 'admin@agencia.com',
      perfil: 'admin',
      ativo: true,
      clientesIds: clientes.map((c) => c.id),
      criadoEm: '2025-01-01T00:00:00Z',
    },
    {
      id: SEED_IDS.USUARIOS.GESTOR,
      nome: 'Mariana Gestora de Contas',
      email: 'gestor@agencia.com',
      perfil: 'gestor',
      ativo: true,
      clientesIds: [
        SEED_IDS.CLIENTES.TECHNOVA,
        SEED_IDS.CLIENTES.MODA_URBANA,
        SEED_IDS.CLIENTES.CLINICA_SAUDE,
      ],
      criadoEm: '2025-01-10T00:00:00Z',
    },
    {
      id: SEED_IDS.USUARIOS.CLIENTE_01,
      nome: 'Carlos Mendes (TechNova)',
      email: 'carlos@technova.com.br',
      perfil: 'cliente',
      ativo: true,
      clientesIds: [SEED_IDS.CLIENTES.TECHNOVA],
      criadoEm: '2025-01-15T00:00:00Z',
    },
    {
      id: SEED_IDS.USUARIOS.CLIENTE_02,
      nome: 'Beatriz Lima (Moda Urbana)',
      email: 'beatriz@modaurbana.com',
      perfil: 'cliente',
      ativo: true,
      clientesIds: [SEED_IDS.CLIENTES.MODA_URBANA],
      criadoEm: '2025-02-10T00:00:00Z',
    },
  ];

  // Contas conectadas para os clientes principais
  const contas: ContaConectada[] = [
    // TechNova
    {
      id: SEED_IDS.CONTAS.TN_GA4,
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      canal: 'ga4',
      idExterno: 'properties/458921789',
      nome: 'GA4 - TechNova Produção',
      moeda: 'BRL',
      fuso: 'America/Sao_Paulo',
      status: 'conectado',
      ultimaSincronizacao: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      minutosDesdeSincronizacao: 15,
    },
    {
      id: SEED_IDS.CONTAS.TN_GADS,
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      canal: 'google_ads',
      idExterno: '849-201-9921',
      nome: 'Google Ads - TechNova Institucional & Pesquisa',
      moeda: 'BRL',
      fuso: 'America/Sao_Paulo',
      status: 'conectado',
      ultimaSincronizacao: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      minutosDesdeSincronizacao: 32,
    },
    {
      id: SEED_IDS.CONTAS.TN_META,
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      canal: 'meta_ads',
      idExterno: 'act_98231049281',
      nome: 'Meta Ads - TechNova Leads & Retargeting',
      moeda: 'BRL',
      fuso: 'America/Sao_Paulo',
      status: 'conectado',
      ultimaSincronizacao: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      minutosDesdeSincronizacao: 48,
    },
    {
      id: SEED_IDS.CONTAS.TN_INSTA,
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      canal: 'instagram',
      idExterno: '178414019283749',
      nome: '@technova.saas Oficial',
      moeda: 'BRL',
      fuso: 'America/Sao_Paulo',
      status: 'conectado',
      ultimaSincronizacao: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      minutosDesdeSincronizacao: 120,
    },

    // Moda Urbana
    {
      id: SEED_IDS.CONTAS.MU_GA4,
      clienteId: SEED_IDS.CLIENTES.MODA_URBANA,
      canal: 'ga4',
      idExterno: 'properties/991823712',
      nome: 'GA4 - Moda Urbana Store',
      moeda: 'BRL',
      fuso: 'America/Sao_Paulo',
      status: 'conectado',
      ultimaSincronizacao: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      minutosDesdeSincronizacao: 22,
    },
    {
      id: SEED_IDS.CONTAS.MU_META,
      clienteId: SEED_IDS.CLIENTES.MODA_URBANA,
      canal: 'meta_ads',
      idExterno: 'act_4455667788',
      nome: 'Meta Ads - Moda Urbana Catálogo',
      moeda: 'BRL',
      fuso: 'America/Sao_Paulo',
      status: 'requer_reconexao',
      ultimaSincronizacao: new Date(Date.now() - 1440 * 60 * 1000).toISOString(),
      minutosDesdeSincronizacao: 1440,
      mensagemErro: 'Token de usuário do Business Manager expirado. Necessário renovar OAuth.',
    },
  ];

  // Geração de 90 dias de dados históricos realistas
  const fatosAds: FatoAdsDiario[] = [];
  const fatosGA4: FatoGA4Diario[] = [];
  const fatosInstagram: FatoInstagramDiario[] = [];
  const entradasManuais: EntradaManual[] = [];

  const campanhasGAds = [
    { id: gerarUuidDeterministico('e1000001', 1), nome: 'Pesquisa - Institucional Fundo de Funil' },
    { id: gerarUuidDeterministico('e1000001', 2), nome: 'Pesquisa - Soluções de TI e SaaS' },
    { id: gerarUuidDeterministico('e1000001', 3), nome: 'Performance Max - Aquisição Brasil' },
  ];

  const campanhasMeta = [
    { id: gerarUuidDeterministico('e1000002', 1), nome: 'Meta Leads - Ebook & Demonstração' },
    { id: gerarUuidDeterministico('e1000002', 2), nome: 'Meta Remarketing - Visitantes 30d' },
    { id: gerarUuidDeterministico('e1000002', 3), nome: 'Meta Prospecção - Vídeo Views' },
  ];

  const origensGA4 = [
    { origem: 'google / cpc', fator: 0.38 },
    { origem: 'facebook / paid', fator: 0.28 },
    { origem: 'instagram / organic', fator: 0.14 },
    { origem: 'direct / none', fator: 0.12 },
    { origem: 'google / organic', fator: 0.08 },
  ];

  const hoje = new Date();

  for (let diasAtras = 90; diasAtras >= 0; diasAtras--) {
    const dataObj = new Date(hoje);
    dataObj.setDate(hoje.getDate() - diasAtras);
    const dataStr = dataObj.toISOString().slice(0, 10);
    const diaDaSemana = dataObj.getDay();
    const fatorFimDeSemana = diaDaSemana === 0 || diaDaSemana === 6 ? 0.7 : 1.15;
    // Pequena tendência de crescimento ao longo do tempo
    const fatorCrescimento = 1 + (90 - diasAtras) * 0.003;

    // --- Fatos Ads Google Ads (TechNova) ---
    campanhasGAds.forEach((cmp, idx) => {
      const baseInvestimento = (120 + idx * 80) * fatorFimDeSemana * fatorCrescimento;
      const cpc = 2.1 + (idx * 0.4);
      const cliques = Math.round(baseInvestimento / cpc);
      const ctr = 0.035 + (idx * 0.008);
      const impressoes = Math.round(cliques / ctr);
      const taxaConv = 0.045 - (idx * 0.005);
      const conversoes = Math.max(1, Math.round(cliques * taxaConv));
      const valorConversao = conversoes * (240 + idx * 60);

      fatosAds.push({
        id: novoUuid(),
        clienteId: SEED_IDS.CLIENTES.TECHNOVA,
        contaId: SEED_IDS.CONTAS.TN_GADS,
        canal: 'google_ads',
        data: dataStr,
        campanhaId: cmp.id,
        campanhaNome: cmp.nome,
        investimento: Number(baseInvestimento.toFixed(2)),
        impressoes,
        cliques,
        conversoes,
        valorConversao: Number(valorConversao.toFixed(2)),
      });
    });

    // --- Fatos Ads Meta Ads (TechNova) ---
    campanhasMeta.forEach((cmp, idx) => {
      const baseInvestimento = (110 + idx * 65) * fatorFimDeSemana * fatorCrescimento;
      const cpc = 1.6 + (idx * 0.3);
      const cliques = Math.round(baseInvestimento / cpc);
      const ctr = 0.018 + (idx * 0.004);
      const impressoes = Math.round(cliques / ctr);
      const taxaConv = 0.05 + (idx * 0.005);
      const conversoes = Math.max(1, Math.round(cliques * taxaConv));
      const valorConversao = conversoes * (190 + idx * 50);

      fatosAds.push({
        id: novoUuid(),
        clienteId: SEED_IDS.CLIENTES.TECHNOVA,
        contaId: SEED_IDS.CONTAS.TN_META,
        canal: 'meta_ads',
        data: dataStr,
        campanhaId: cmp.id,
        campanhaNome: cmp.nome,
        investimento: Number(baseInvestimento.toFixed(2)),
        impressoes,
        cliques,
        conversoes,
        valorConversao: Number(valorConversao.toFixed(2)),
      });
    });

    // --- Fatos GA4 (TechNova) ---
    origensGA4.forEach((origem) => {
      const baseSessoes = Math.round((450 * origem.fator) * fatorFimDeSemana * fatorCrescimento);
      const usuarios = Math.round(baseSessoes * 0.82);
      const novosUsuarios = Math.round(usuarios * 0.65);
      const conversoes = Math.round(baseSessoes * (origem.origem.includes('cpc') ? 0.042 : 0.025));
      const receita = conversoes * 280;

      fatosGA4.push({
        id: novoUuid(),
        clienteId: SEED_IDS.CLIENTES.TECHNOVA,
        contaId: SEED_IDS.CONTAS.TN_GA4,
        data: dataStr,
        origemMidia: origem.origem,
        sessoes: baseSessoes,
        usuarios,
        novosUsuarios,
        conversoes,
        receita,
      });
    });

    // --- Fatos Instagram (TechNova) ---
    const baseViews = Math.round((2800 + Math.sin(diasAtras) * 400) * fatorFimDeSemana * fatorCrescimento);
    const alcance = Math.round(baseViews * 0.72);
    const interacoes = Math.round(alcance * 0.065);
    const visitasPerfil = Math.round(interacoes * 0.45);
    const novosSeguidores = Math.max(2, Math.round(visitasPerfil * 0.12));

    fatosInstagram.push({
      id: novoUuid(),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      contaId: SEED_IDS.CONTAS.TN_INSTA,
      data: dataStr,
      views: baseViews,
      alcance,
      visitasPerfil,
      novosSeguidores,
      interacoes,
    });

    // --- Entradas Manuais para CAC & ROI (a cada 3 dias para simulação fiel) ---
    if (diasAtras % 3 === 0) {
      const novosClientes = Math.round((4 + Math.random() * 3) * fatorCrescimento);
      const receita = novosClientes * 1450;
      const custosExtras = 350; // Custos de onboarding/ferramentas

      entradasManuais.push({
        id: novoUuid(),
        clienteId: SEED_IDS.CLIENTES.TECHNOVA,
        data: dataStr,
        receita,
        novosClientes,
        custosExtras,
        observacao: `Vendas fechadas pelo CRM na data ${dataStr}`,
      });
    }
  }

  // Mídias do Instagram (Top Posts & Reels)
  const midiasInstagram: InstagramMidia[] = [
    {
      id: gerarUuidDeterministico('f1000001', 1),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      contaId: SEED_IDS.CONTAS.TN_INSTA,
      idMidia: '180293817263541',
      tipo: 'REEL',
      legenda: '🚀 5 Erros que impedem seu SaaS de bater as metas de aquisição no primeiro trimestre! Veja o passo a passo completo no link da bio.',
      permalink: 'https://instagram.com/p/reel1',
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
      publicadoEm: new Date(Date.now() - 3 * 86400000).toISOString(),
      views: 14820,
      alcance: 11400,
      interacoes: 980,
      curtidas: 840,
      comentarios: 65,
      compartilhamentos: 75,
    },
    {
      id: gerarUuidDeterministico('f1000001', 2),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      contaId: SEED_IDS.CONTAS.TN_INSTA,
      idMidia: '180293817263542',
      tipo: 'CAROUSEL_ALBUM',
      legenda: '📊 Case Study: Como aumentamos em 140% as conversões da TechNova utilizando testes A/B contínuos e análise preditiva.',
      permalink: 'https://instagram.com/p/post2',
      thumbnailUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&auto=format&fit=crop&q=80',
      publicadoEm: new Date(Date.now() - 8 * 86400000).toISOString(),
      views: 9340,
      alcance: 7650,
      interacoes: 720,
      curtidas: 590,
      comentarios: 48,
      compartilhamentos: 82,
    },
    {
      id: gerarUuidDeterministico('f1000001', 3),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      contaId: SEED_IDS.CONTAS.TN_INSTA,
      idMidia: '180293817263543',
      tipo: 'IMAGE',
      legenda: '💡 Anunciar sem medir CAC e LTV é como navegar sem bússola. Salve este post para consultar depois!',
      permalink: 'https://instagram.com/p/post3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&auto=format&fit=crop&q=80',
      publicadoEm: new Date(Date.now() - 14 * 86400000).toISOString(),
      views: 6500,
      alcance: 5200,
      interacoes: 410,
      curtidas: 350,
      comentarios: 22,
      compartilhamentos: 38,
    },
  ];

  const sincronizacoes: SincronizacaoLog[] = [
    {
      id: gerarUuidDeterministico('f2000001', 1),
      contaId: SEED_IDS.CONTAS.TN_GA4,
      canal: 'ga4',
      janelaInicio: '2026-03-01',
      janelaFim: '2026-03-31',
      status: 'sucesso',
      inicio: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      fim: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      linhasAfetadas: 155,
    },
    {
      id: gerarUuidDeterministico('f2000001', 2),
      contaId: SEED_IDS.CONTAS.TN_GADS,
      canal: 'google_ads',
      janelaInicio: '2026-03-01',
      janelaFim: '2026-03-31',
      status: 'sucesso',
      inicio: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      fim: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      linhasAfetadas: 93,
    },
  ];

  const metas: MetaCliente[] = [
    {
      id: gerarUuidDeterministico('f3000001', 1),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      cpaMaximo: 45.0, // R$ 45,00
      ctrMinimo: 2.0, // 2%
      roasMinimo: 3.5, // 3.5x
      investimentoMaximoMensal: 15000.0,
      conversoesMinimoMensal: 300,
    },
    {
      id: gerarUuidDeterministico('f3000001', 2),
      clienteId: SEED_IDS.CLIENTES.MODA_URBANA,
      cpaMaximo: 35.0,
      ctrMinimo: 1.5,
      roasMinimo: 4.0,
      investimentoMaximoMensal: 25000.0,
      conversoesMinimoMensal: 600,
    },
  ];

  const relatorios: RelatorioGerado[] = [
    {
      id: gerarUuidDeterministico('f4000001', 1),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      usuarioId: SEED_IDS.USUARIOS.ADMIN,
      nomeArquivo: 'Relatorio_Mensal_TechNova_Fev2026.pdf',
      formato: 'pdf',
      status: 'concluido',
      parametros: {
        inicio: '2026-02-01',
        fim: '2026-02-28',
        canais: ['google_ads', 'meta_ads', 'ga4'],
        comparar: 'anterior',
      },
      arquivoUrl: `/api/v1/relatorios/${gerarUuidDeterministico('f4000001', 1)}/download`,
      criadoEm: '2026-03-01T10:00:00Z',
      concluidoEm: '2026-03-01T10:00:15Z',
    },
  ];

  const agendamentos: AgendamentoRelatorio[] = [
    {
      id: gerarUuidDeterministico('f5000001', 1),
      clienteId: SEED_IDS.CLIENTES.TECHNOVA,
      titulo: 'Envio Mensal de Fechamento de Metas',
      frequencia: 'mensal',
      diaEnvio: 1, // Todo dia 1º
      horaEnvio: '08:00',
      destinatariosEmail: ['carlos@technova.com.br', 'diretoria@technova.com.br'],
      webhookWhatsapp: 'https://api.whatsapp-service.com/webhook/send-group',
      formato: 'pdf',
      ativo: true,
      ultimoEnvio: '2026-10-01T08:00:00Z',
      statusUltimoEnvio: 'sucesso',
    },
  ];

  const auditoria: AuditoriaLog[] = [];

  return {
    marca,
    clientes,
    usuarios,
    contas,
    fatosAds,
    fatosGA4,
    fatosInstagram,
    midiasInstagram,
    entradasManuais,
    sincronizacoes,
    metas,
    relatorios,
    agendamentos,
    auditoria,
  };
}

export const store = inicializarStore();

