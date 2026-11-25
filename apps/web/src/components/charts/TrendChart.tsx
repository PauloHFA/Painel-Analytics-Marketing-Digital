import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import './chartSetup';
import { temaCores } from './chartSetup';
import { PontoSerieTemporal } from '@dashboard/shared';
import { useTheme } from '../../context/ThemeContext';
import { Table } from 'lucide-react';

interface Props {
  atual: PontoSerieTemporal[];
  comparativo?: PontoSerieTemporal[];
  metrica: 'investimento' | 'conversoes' | 'cliques' | 'receita';
  titulo?: string;
  corPrimaria?: string;
  corNeutra?: string;
}

const configMetricas = {
  investimento: { label: 'Investimento (R$)', prefixo: 'R$ ' },
  receita: { label: 'Receita (R$)', prefixo: 'R$ ' },
  conversoes: { label: 'Conversões', prefixo: '' },
  cliques: { label: 'Cliques', prefixo: '' },
};

export const TrendChart: React.FC<Props> = ({ atual, comparativo, metrica, titulo, corPrimaria, corNeutra }) => {
  const { isDark } = useTheme();
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const cfg = configMetricas[metrica];
  const corLinha = corPrimaria || temaCores.primaria;
  const corComp = isDark ? '#64748b' : corNeutra || temaCores.neutra;

  const datasets: any[] = [
    {
      label: 'Período Atual',
      data: atual.map((p) => p[metrica]),
      borderColor: corLinha,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : `${corLinha}1a`,
      fill: true,
      tension: 0.28,
      pointRadius: atual.length > 40 ? 0 : 3,
      pointHoverRadius: 6,
      borderWidth: 2.5,
    },
  ];

  if (comparativo && comparativo.length > 0) {
    datasets.push({
      label: 'Período Comparado',
      data: comparativo.map((p) => p[metrica]),
      borderColor: corComp,
      borderDash: [6, 4], // Especificação formal da seção 11.3
      fill: false,
      tension: 0.28,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
    });
  }

  const data = {
    labels: atual.map((p) => p.data),
    datasets,
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Inter, sans-serif', size: 12 },
          color: isDark ? '#cbd5e1' : '#334155',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: (context: any) => {
            let val = context.raw || 0;
            if (cfg.prefixo) {
              val = Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
              val = Number(val).toLocaleString('pt-BR');
            }
            return ` ${context.dataset.label}: ${cfg.prefixo}${val}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxTicksLimit: 12, color: isDark ? '#94a3b8' : '#64748b' },
      },
      y: {
        grid: { color: isDark ? '#1e293b' : '#f1f5f9' },
        ticks: {
          font: { size: 11 },
          color: isDark ? '#94a3b8' : '#64748b',
          callback: (value: any) => (cfg.prefixo ? `${cfg.prefixo}${value}` : value),
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {titulo ? <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{titulo}</h4> : <span />}
        <button
          type="button"
          onClick={() => setMostrarTabela((v) => !v)}
          aria-expanded={mostrarTabela}
          className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
        >
          <Table className="w-3.5 h-3.5" />
          <span>{mostrarTabela ? 'Ver gráfico' : 'Tabela acessível'}</span>
        </button>
      </div>

      {mostrarTabela ? (
        <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse" aria-label={`Dados de ${cfg.label}`}>
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3">Período</th>
                <th className="py-2 px-3 text-right">Atual ({cfg.label})</th>
                {comparativo && comparativo.length > 0 && <th className="py-2 px-3 text-right">Comparado</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {atual.map((p, idx) => (
                <tr key={p.dataCompleta}>
                  <td className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200">{p.data}</td>
                  <td className="py-1.5 px-3 text-right text-slate-700 dark:text-slate-300">
                    {cfg.prefixo}
                    {p[metrica].toLocaleString('pt-BR', cfg.prefixo ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined)}
                  </td>
                  {comparativo && comparativo.length > 0 && (
                    <td className="py-1.5 px-3 text-right text-slate-500 dark:text-slate-400">
                      {comparativo[idx]
                        ? `${cfg.prefixo}${comparativo[idx][metrica].toLocaleString(
                            'pt-BR',
                            cfg.prefixo ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined
                          )}`
                        : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full h-72" role="img" aria-label={`Gráfico de linha de ${cfg.label}`}>
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
};
