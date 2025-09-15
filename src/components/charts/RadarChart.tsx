import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface RadarData {
  autoavaliacao: number;
  professor: number;
  metodologia: number;
  infraestrutura: number;
}

interface RadarChartProps {
  data: RadarData;
  className?: string;
}

const chartConfig = {
  score: {
    label: 'Pontuação',
    color: 'hsl(var(--primary))',
  },
};

export function RadarChart({ data, className }: RadarChartProps) {
  const radarData = [
    {
      bloco: 'Autoavaliação',
      score: data.autoavaliacao,
      fullMark: 10,
    },
    {
      bloco: 'Professor',
      score: data.professor,
      fullMark: 10,
    },
    {
      bloco: 'Metodologia',
      score: data.metodologia,
      fullMark: 10,
    },
    {
      bloco: 'Infraestrutura',
      score: data.infraestrutura,
      fullMark: 10,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Radar por Bloco de Avaliação</CardTitle>
        <CardDescription>
          Comparação das médias entre autoavaliação, professor, metodologia e infraestrutura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsRadar data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                strokeDasharray="2 2"
              />
              <PolarAngleAxis 
                dataKey="bloco" 
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                className="text-xs"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 10]} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickCount={6}
              />
              <Radar
                name="Pontuação"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any) => [value.toFixed(1), 'Pontuação']}
              />
            </RechartsRadar>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legenda com valores */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {radarData.map((item) => (
            <div key={item.bloco} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.bloco}</span>
              <span className="font-medium">{item.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}