import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from './context/FilterContext';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { fetchApi } from './services/api';
import { resolverUsuarioToken } from './constants/ids';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { OverviewView } from './views/OverviewView';
import {
  AgenciaMarca,
  Granularidade,
  ResumoMetricas,
  VariacaoMetrica,
  PontoSerieTemporal,
  MetricasPorCanal,
  ResumoCampanha,
  OrigemMidiaGA4,
  InstagramMidia,
  AlertaMetrica,
} from '@dashboard/shared';

const PaidAdsView = lazy(() => import('./views/PaidAdsView').then((m) => ({ default: m.PaidAdsView })));
const GA4View = lazy(() => import('./views/GA4View').then((m) => ({ default: m.GA4View })));
const InstagramView = lazy(() => import('./views/InstagramView').then((m) => ({ default: m.InstagramView })));
const ManualEntriesView = lazy(() => import('./views/ManualEntriesView').then((m) => ({ default: m.ManualEntriesView })));
const ConnectionsView = lazy(() => import('./views/ConnectionsView').then((m) => ({ default: m.ConnectionsView })));
const BrandSettingsView = lazy(() => import('./views/BrandSettingsView').then((m) => ({ default: m.BrandSettingsView })));
const AlertsView = lazy(() => import('./views/AlertsView').then((m) => ({ default: m.AlertsView })));
const ReportsView = lazy(() => import('./views/ReportsView').then((m) => ({ default: m.ReportsView })));
const ReportPrintView = lazy(() => import('./components/ReportPrintView').then((m) => ({ default: m.ReportPrintView })));
import {
  LayoutDashboard,
  Megaphone,
  Globe,
  Instagram,
  Edit3,
  Link2,
  Settings,
  AlertTriangle,
  FileText,
} from 'lucide-react';

type AbaAtiva =
  | 'visao_geral'
  | 'anuncios'
  | 'ga4'
  | 'instagram'
  | 'entradas_manuais'
  | 'conexoes'
  | 'alertas'
  | 'relatorios'
  | 'marca';

export const App: React.FC = () => {
  const { clienteId, inicio, fim, canais, comparar, clienteAtual } = useFilters();
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('visao_geral');
  const [granularidade, setGranularidade] = useState<Granularidade>('dia');
  const [exibirRelatorioPdf, setExibirRelatorioPdf] = useState(false);
  const [minutosDesdeAtualizacao, setMinutosDesdeAtualizacao] = useState(0);

  // Contador de frescor (Seção 11.4)
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutosDesdeAtualizacao((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // TanStack Query: polling a cada 60s conforme RFC da Seção 11.4 do PDF
  const queryChave = ['metricas', clienteId, inicio, fim, canais.join(','), comparar];

  const {
    data: dadosResumo,
    isLoading: carregandoResumo,
    refetch,
  } = useQuery({
    queryKey: queryChave,
    queryFn: async () => {
      const params = new URLSearchParams({
        clienteId,
        inicio,
        fim,
        canais: canais.join(','),
        comparar,
      });
      const res = await fetchApi<{
        resumoAtual: ResumoMetricas;
        resumoComparativo?: ResumoMetricas;
        variacoes?: Record<string, VariacaoMetrica>;
      }>(`/metricas/resumo?${params.toString()}`);
      setMinutosDesdeAtualizacao(0);
      return res;
    },
    refetchInterval: 60000, // 60 segundos
  });

  const { data: dadosSerie } = useQuery({
    queryKey: ['serie', clienteId, inicio, fim, canais.join(','), comparar, granularidade],
    queryFn: async () => {
      const params = new URLSearchParams({
        clienteId,
        inicio,
        fim,
        canais: canais.join(','),
        comparar,
        granularidade,
      });
      return fetchApi<{ atual: PontoSerieTemporal[]; comparativo: PontoSerieTemporal[] }>(
        `/metricas/serie?${params.toString()}`
      );
    },
  });

  const { data: dadosMarca } = useQuery({
    queryKey: ['agencia-marca'],
    queryFn: async () => fetchApi<{ marca: AgenciaMarca }>('/agencia/marca'),
  });

  const { data: dadosCanais } = useQuery({
    queryKey: ['por-canal', clienteId, inicio, fim, canais.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({ clienteId, inicio, fim, canais: canais.join(',') });
      return fetchApi<{ canais: MetricasPorCanal[] }>(`/metricas/por-canal?${params.toString()}`);
    },
  });

  const { data: dadosCampanhas } = useQuery({
    queryKey: ['campanhas', clienteId, inicio, fim, canais.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({ clienteId, inicio, fim, canais: canais.join(',') });
      return fetchApi<{ campanhas: ResumoCampanha[] }>(`/metricas/campanhas?${params.toString()}`);
    },
  });

  const { data: dadosGa4Origens } = useQuery({
    queryKey: ['ga4-origens', clienteId, inicio, fim],
    queryFn: async () => {
      const params = new URLSearchParams({ clienteId, inicio, fim });
      return fetchApi<{ origens: OrigemMidiaGA4[] }>(`/ga4/origens?${params.toString()}`);
    },
  });

  const { data: dadosInstagram } = useQuery({
    queryKey: ['instagram-midias', clienteId],
    queryFn: async () => {
      return fetchApi<{ midias: InstagramMidia[] }>(`/instagram/midias?clienteId=${clienteId}`);
    },
  });

  const { data: dadosAlertas } = useQuery({
    queryKey: ['alertas', clienteId, inicio, fim],
    queryFn: async () => {
      return fetchApi<{ alertas: AlertaMetrica[]; total: number }>(`/clientes/${clienteId}/alertas?inicio=${inicio}&fim=${fim}`);
    },
    refetchInterval: 30000,
  });

  const abas = [
    { id: 'visao_geral', label: 'Visão Geral', icone: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'anuncios', label: 'Anúncios', icone: <Megaphone className="w-4 h-4" /> },
    { id: 'ga4', label: 'Site (GA4)', icone: <Globe className="w-4 h-4" /> },
    { id: 'instagram', label: 'Instagram', icone: <Instagram className="w-4 h-4" /> },
    { id: 'entradas_manuais', label: 'Entradas Manuais', icone: <Edit3 className="w-4 h-4" /> },
    { id: 'conexoes', label: 'Conexões & Status', icone: <Link2 className="w-4 h-4" /> },
    {
      id: 'alertas',
      label: 'Alertas & Metas',
      icone: <AlertTriangle className="w-4 h-4" />,
      badge: (dadosAlertas?.total || 0) > 0 ? dadosAlertas?.total : undefined,
    },
    { id: 'relatorios', label: 'Relatórios & CSV', icone: <FileText className="w-4 h-4" /> },
    ...(usuario?.perfil === 'admin'
      ? [{ id: 'marca', label: 'Marca da Agência', icone: <Settings className="w-4 h-4" /> }]
      : []),
  ];

  const handleExportCsv = async () => {
    try {
      const token = resolverUsuarioToken(localStorage.getItem('auth_token'));
      const resp = await fetch(`/api/v1/metricas/exportar-csv?clienteId=${clienteId}&inicio=${inicio}&fim=${fim}`, {
        headers: { 'x-user-id': token },
      });
      if (!resp.ok) {
        throw new Error(`Erro ${resp.status} ao exportar CSV`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `metricas_${clienteId}_${inicio}_${fim}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      mostrarToast(err.message || 'Falha ao exportar CSV.', 'erro');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        marca={dadosMarca?.marca}
        minutosDesdeAtualizacao={minutosDesdeAtualizacao}
        onRefresh={() => {
          refetch();
          setMinutosDesdeAtualizacao(0);
        }}
        onExportPdf={() => setExibirRelatorioPdf(true)}
        onExportCsv={handleExportCsv}
      />

      <FilterBar />

      {/* Navegação Secundária por Abas */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto py-2">
            {abas.map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id as AbaAtiva)}
                className={`flex items-center gap-1.5 py-2 px-1 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
                  abaAtiva === aba.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {aba.icone}
                <span>{aba.label}</span>
                {'badge' in aba && aba.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {aba.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {carregandoResumo && !dadosResumo ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Consolidando métricas multicliente...</p>
          </div>
        ) : (
          dadosResumo && (
            <Suspense
              fallback={
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  Carregando módulo...
                </div>
              }
            >
              {abaAtiva === 'visao_geral' && (
                <OverviewView
                  resumoAtual={dadosResumo.resumoAtual}
                  resumoComparativo={dadosResumo.resumoComparativo}
                  variacoes={dadosResumo.variacoes}
                  serieAtual={dadosSerie?.atual || []}
                  serieComparativa={dadosSerie?.comparativo}
                  canais={dadosCanais?.canais || []}
                  marca={dadosMarca?.marca}
                  granularidade={granularidade}
                  onChangeGranularidade={setGranularidade}
                />
              )}

              {abaAtiva === 'anuncios' && <PaidAdsView campanhas={dadosCampanhas?.campanhas || []} />}

              {abaAtiva === 'ga4' && <GA4View resumo={dadosResumo.resumoAtual} origens={dadosGa4Origens?.origens || []} />}

              {abaAtiva === 'instagram' && (
                <InstagramView resumo={dadosResumo.resumoAtual} midias={dadosInstagram?.midias || []} />
              )}

              {abaAtiva === 'entradas_manuais' && <ManualEntriesView />}

              {abaAtiva === 'conexoes' && <ConnectionsView />}

              {abaAtiva === 'alertas' && <AlertsView />}

              {abaAtiva === 'relatorios' && <ReportsView />}

              {abaAtiva === 'marca' && <BrandSettingsView />}
            </Suspense>
          )
        )}
      </main>

      {/* Modal / Layout para Impressão em PDF */}
      {exibirRelatorioPdf && dadosResumo && (
        <Suspense fallback={null}>
          <ReportPrintView
            cliente={clienteAtual}
            marca={dadosMarca?.marca}
            inicio={inicio}
            fim={fim}
            resumoAtual={dadosResumo.resumoAtual}
            serieAtual={dadosSerie?.atual || []}
            campanhas={dadosCampanhas?.campanhas || []}
            onFechar={() => setExibirRelatorioPdf(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
