import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NPSData {
  nps: number;
  promoters: number;
  detractors: number;
  neutros: number;
  total: number;
}

interface NPSChartProps {
  npsCurso: NPSData;
  npsMarca: NPSData;
  className?: string;
}

const NPSColors = {
  promoters: 'hsl(var(--success))',
  neutros: 'hsl(var(--warning))',
  detractors: 'hsl(var(--destructive))',
};

const chartConfig = {
  promoters: {
    label: 'Promotores (9-10)',
    color: NPSColors.promoters,
  },
  neutros: {
    label: 'Neutros (7-8)',
    color: NPSColors.neutros,
  },
  detractors: {
    label: 'Detratores (0-6)',
    color: NPSColors.detractors,
  },
};

export function NPSChart({ npsCurso, npsMarca, className }: NPSChartProps) {
  const data = [
    {
      categoria: 'NPS Curso',
      promoters: npsCurso.promoters,
      neutros: npsCurso.neutros,
      detractors: npsCurso.detractors,
      nps: npsCurso.nps,
    },
    {
      categoria: 'NPS Marca',
      promoters: npsMarca.promoters,
      neutros: npsMarca.neutros,
      detractors: npsMarca.detractors,
      nps: npsMarca.nps,
    },
  ];

  const getNPSStatus = (nps: number) => {
    if (nps >= 70) return { text: 'Excelente', variant: 'default', icon: TrendingUp };
    if (nps >= 30) return { text: 'Bom', variant: 'secondary', icon: TrendingUp };
    if (nps >= 0) return { text: 'Regular', variant: 'outline', icon: Minus };
    return { text: 'Crítico', variant: 'destructive', icon: TrendingDown };
  };

  return (
    <div className={className}>
      {/* Grid com 2 colunas em telas grandes; cards lado a lado e gráfico abaixo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS do Curso */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">NPS do Curso</CardTitle>
              {(() => {
                const status = getNPSStatus(Math.ceil(npsCurso.nps));
                return (
                  <Badge variant={status.variant as any} className="flex items-center space-x-1">
                    <status.icon className="w-3 h-3" />
                    <span>{status.text}</span>
                  </Badge>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-primary">{Math.ceil(npsCurso.nps)}</div>
              <div className="text-sm text-muted-foreground">pontos</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div className="text-center">
                <div className="font-medium text-success">{npsCurso.promoters}</div>
                <div className="text-muted-foreground">Promotores</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-warning">{npsCurso.neutros}</div>
                <div className="text-muted-foreground">Neutros</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-destructive">{npsCurso.detractors}</div>
                <div className="text-muted-foreground">Detratores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NPS da Marca */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">NPS da Marca</CardTitle>
              {(() => {
                const status = getNPSStatus(Math.ceil(npsMarca.nps));
                return (
                  <Badge variant={status.variant as any} className="flex items-center space-x-1">
                    <status.icon className="w-3 h-3" />
                    <span>{status.text}</span>
                  </Badge>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-primary">{Math.ceil(npsMarca.nps)}</div>
              <div className="text-sm text-muted-foreground">pontos</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div className="text-center">
                <div className="font-medium text-success">{npsMarca.promoters}</div>
                <div className="text-muted-foreground">Promotores</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-warning">{npsMarca.neutros}</div>
                <div className="text-muted-foreground">Neutros</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-destructive">{npsMarca.detractors}</div>
                <div className="text-muted-foreground">Detratores</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição NPS - ocupa a largura total em telas grandes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição NPS</CardTitle>
            <CardDescription>
              Comparação entre promotores, neutros e detratores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="categoria" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  />
                  <Bar dataKey="promoters" stackId="a" fill={NPSColors.promoters} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutros" stackId="a" fill={NPSColors.neutros} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="detractors" stackId="a" fill={NPSColors.detractors} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}