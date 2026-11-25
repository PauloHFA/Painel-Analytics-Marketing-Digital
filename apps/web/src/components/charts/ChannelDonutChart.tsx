import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import './chartSetup';
import { temaCores } from './chartSetup';
import { MetricasPorCanal, formatarMoeda } from '@dashboard/shared';
import { useTheme } from '../../context/ThemeContext';
import { Table } from 'lucide-react';

interface Props {
  canais: MetricasPorCanal[];
}

export const ChannelDonutChart: React.FC<Props> = ({ canais }) => {
  const { isDark } = useTheme();
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const canaisComInvestimento = canais.filter((c) => c.investimento > 0);

  const data = {
    labels: canaisComInvestimento.map((c) => c.nomeExibicao),
    datasets: [
      {
        data: canaisComInvestimento.map((c) => c.investimento),
        backgroundColor: canaisComInvestimento.map((c) =>
          c.canal === 'google_ads' ? temaCores.canais.google_ads : temaCores.canais.meta_ads
        ),
        borderWidth: 2,
        borderColor: isDark ? '#0f172a' : '#ffffff',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 },
          color: isDark ? '#cbd5e1' : '#334155',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    cutout: '72%',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setMostrarTabela((v) => !v)}
          aria-expanded={mostrarTabela}
          className="no-print inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
        >
          <Table className="w-3 h-3" />
          <span>{mostrarTabela ? 'Ver gráfico' : 'Tabela acessível'}</span>
        </button>
      </div>
      {mostrarTabela ? (
        <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden" aria-label="Distribuição de investimento por canal">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="py-2 px-3">Canal</th>
              <th className="py-2 px-3 text-right">Investimento</th>
              <th className="py-2 px-3 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {canaisComInvestimento.map((c) => (
              <tr key={c.canal}>
                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{c.nomeExibicao}</td>
                <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{formatarMoeda(c.investimento)}</td>
                <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-400">{c.participacaoInvestimento}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="w-full h-64 flex items-center justify-center" role="img" aria-label="Gráfico de rosca de distribuição de investimento por canal">
          <Doughnut data={data} options={options} />
        </div>
      )}
    </div>
  );
};
