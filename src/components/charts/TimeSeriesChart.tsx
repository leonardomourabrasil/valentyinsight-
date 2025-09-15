import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface TimeSeriesData {
  date: string;
  semana: string;
  respondentes: number;
  autoavaliacao: number;
  professor: number;
  metodologia: number;
  infraestrutura: number;
  npsCurso: number;
  npsMarca: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  className?: string;
}

const chartConfig = {
  autoavaliacao: {
    label: 'Autoavaliação',
    color: 'hsl(var(--primary))',
  },
  professor: {
    label: 'Professor',
    color: 'hsl(var(--accent))',
  },
  metodologia: {
    label: 'Metodologia',
    color: 'hsl(var(--success))',
  },
  infraestrutura: {
    label: 'Infraestrutura',
    color: 'hsl(var(--warning))',
  },
  npsCurso: {
    label: 'NPS Curso',
    color: 'hsl(var(--destructive))',
  },
};

export function TimeSeriesChart({ data, className }: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Evolução Temporal</CardTitle>
          <CardDescription>Não há dados suficientes para gerar o gráfico temporal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Dados insuficientes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Evolução Temporal das Avaliações</CardTitle>
        <CardDescription>
          Médias semanais por bloco de avaliação e NPS do curso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="semana" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(label) => `Semana: ${label}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
              <Line
                type="monotone"
                dataKey="autoavaliacao"
                stroke={chartConfig.autoavaliacao.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.autoavaliacao.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.autoavaliacao.color, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="professor"
                stroke={chartConfig.professor.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.professor.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.professor.color, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="metodologia"
                stroke={chartConfig.metodologia.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.metodologia.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.metodologia.color, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="infraestrutura"
                stroke={chartConfig.infraestrutura.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.infraestrutura.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartConfig.infraestrutura.color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}