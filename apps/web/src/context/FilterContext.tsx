import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchApi } from '../services/api';
import { Cliente } from '@dashboard/shared';
import { UUID_CLIENTES, isUuidValido } from '../constants/ids';

export type PresetPeriodo = '7d' | '30d' | '90d' | 'este_mes' | 'mes_anterior' | 'personalizado';

interface FilterContextType {
  clienteId: string;
  setClienteId: (id: string) => void;
  inicio: string;
  fim: string;
  setDatas: (inicio: string, fim: string) => void;
  preset: PresetPeriodo;
  setPreset: (preset: PresetPeriodo) => void;
  canais: string[];
  alternarCanal: (canal: string) => void;
  comparar: 'anterior' | 'ano_anterior' | 'nenhum';
  setComparar: (modo: 'anterior' | 'ano_anterior' | 'nenhum') => void;
  clientes: Cliente[];
  clienteAtual: Cliente | undefined;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

function obterIntervaloPreset(preset: PresetPeriodo): { inicio: string; fim: string } {
  const hoje = new Date();
  const fim = hoje.toISOString().slice(0, 10);

  if (preset === '7d') {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 6);
    return { inicio: d.toISOString().slice(0, 10), fim };
  }
  if (preset === '90d') {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 89);
    return { inicio: d.toISOString().slice(0, 10), fim };
  }
  if (preset === 'este_mes') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio: d.toISOString().slice(0, 10), fim };
  }
  if (preset === 'mes_anterior') {
    const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return {
      inicio: inicioMesAnt.toISOString().slice(0, 10),
      fim: fimMesAnt.toISOString().slice(0, 10),
    };
  }

  // 30 dias padrão
  const d = new Date(hoje);
  d.setDate(hoje.getDate() - 29);
  return { inicio: d.toISOString().slice(0, 10), fim };
}

function lerFiltrosDaUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const clienteId = params.get('clienteId') || undefined;
  const inicio = params.get('inicio') || undefined;
  const fim = params.get('fim') || undefined;
  const preset = params.get('preset') as PresetPeriodo | null;
  const canaisRaw = params.get('canais');
  const comparar = params.get('comparar') as 'anterior' | 'ano_anterior' | 'nenhum' | null;
  return {
    clienteId,
    inicio,
    fim,
    preset: preset && ['7d', '30d', '90d', 'este_mes', 'mes_anterior', 'personalizado'].includes(preset) ? preset : undefined,
    canais: canaisRaw ? canaisRaw.split(',').filter(Boolean) : undefined,
    comparar: comparar && ['anterior', 'ano_anterior', 'nenhum'].includes(comparar) ? comparar : undefined,
  };
}

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const urlInicial = lerFiltrosDaUrl();
  const urlCliente = urlInicial?.clienteId && isUuidValido(urlInicial.clienteId) ? urlInicial.clienteId : undefined;
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>(urlCliente || UUID_CLIENTES.TECHNOVA);
  const [preset, setPresetState] = useState<PresetPeriodo>(urlInicial?.preset || (urlInicial?.inicio && urlInicial?.fim ? 'personalizado' : '30d'));
  const [datas, setDatasState] = useState(() =>
    urlInicial?.inicio && urlInicial?.fim
      ? { inicio: urlInicial.inicio, fim: urlInicial.fim }
      : obterIntervaloPreset(urlInicial?.preset || '30d')
  );
  const [canais, setCanais] = useState<string[]>(
    urlInicial?.canais && urlInicial.canais.length > 0
      ? urlInicial.canais
      : ['google_ads', 'meta_ads', 'ga4', 'instagram']
  );
  const [comparar, setComparar] = useState<'anterior' | 'ano_anterior' | 'nenhum'>(urlInicial?.comparar || 'anterior');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('clienteId', clienteId);
    params.set('inicio', datas.inicio);
    params.set('fim', datas.fim);
    params.set('preset', preset);
    params.set('canais', canais.join(','));
    params.set('comparar', comparar);
    const novaUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', novaUrl);
  }, [clienteId, datas.inicio, datas.fim, preset, canais, comparar]);

  useEffect(() => {
    if (!usuario) return;
    fetchApi<{ clientes: Cliente[] }>('/clientes')
      .then((res) => {
        setClientes(res.clientes);
        if (usuario.perfil === 'cliente') {
          // Cliente final é restrito estritamente ao seu id
          setClienteId(usuario.clientesIds[0] || UUID_CLIENTES.TECHNOVA);
        } else if (!res.clientes.some((c) => c.id === clienteId)) {
          setClienteId(res.clientes[0]?.id || UUID_CLIENTES.TECHNOVA);
        }
      })
      .catch(console.error);
  }, [usuario]);

  const setPreset = (p: PresetPeriodo) => {
    setPresetState(p);
    if (p !== 'personalizado') {
      setDatasState(obterIntervaloPreset(p));
    }
  };

  const setDatas = (inicio: string, fim: string) => {
    setPresetState('personalizado');
    setDatasState({ inicio, fim });
  };

  const alternarCanal = (canal: string) => {
    setCanais((prev) =>
      prev.includes(canal) ? (prev.length > 1 ? prev.filter((c) => c !== canal) : prev) : [...prev, canal]
    );
  };

  const clienteAtual = clientes.find((c) => c.id === clienteId);

  return (
    <FilterContext.Provider
      value={{
        clienteId,
        setClienteId,
        inicio: datas.inicio,
        fim: datas.fim,
        setDatas,
        preset,
        setPreset,
        canais,
        alternarCanal,
        comparar,
        setComparar,
        clientes,
        clienteAtual,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters deve ser usado dentro de FilterProvider');
  return context;
};

