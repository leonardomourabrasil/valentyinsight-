import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Star,
  BarChart3,
  Target,
  Award,
  Building
} from 'lucide-react';

interface KPIData {
  totalRespondentes: number;
  mediaGeral: number;
  npsTotal: number;
  blocoMelhor: string;
  avaliacaoMedia: {
    autoavaliacao: number;
    professor: number;
    metodologia: number;
    infraestrutura: number;
  };
}

interface KPICardsProps {
  data: KPIData;
  className?: string;
}

export function KPICards({ data, className }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total de Respondentes',
      value: data.totalRespondentes,
      description: 'Respostas coletadas',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      format: (val: number) => val.toString(),
    },
    {
      title: 'Média Geral',
      value: data.mediaGeral,
      description: 'Todas as avaliações',
      icon: Star,
      color: 'text-success',
      bgColor: 'bg-success/10',
      format: (val: number) => val.toFixed(1),
    },
    {
      title: 'NPS Combinado',
      value: data.npsTotal,
      description: 'Curso + Marca',
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      format: (val: number) => Math.ceil(val).toString(),
    },
    {
      title: 'Melhor Bloco',
      value: data.blocoMelhor,
      description: 'Maior pontuação',
      icon: Award,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      format: (val: any) => val,
    },
  ];

  const getStatusBadge = (type: string, value: number) => {
    if (type === 'nps') {
      if (value >= 70) return { text: 'Excelente', variant: 'default' };
      if (value >= 30) return { text: 'Bom', variant: 'secondary' };
      if (value >= 0) return { text: 'Regular', variant: 'outline' };
      return { text: 'Crítico', variant: 'destructive' };
    }
    
    if (type === 'media') {
      if (value >= 8.5) return { text: 'Excelente', variant: 'default' };
      if (value >= 7.0) return { text: 'Bom', variant: 'secondary' };
      if (value >= 6.0) return { text: 'Regular', variant: 'outline' };
      return { text: 'Crítico', variant: 'destructive' };
    }

    return { text: 'Normal', variant: 'secondary' };
  };

  return (
    <div className={className}>
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="relative overflow-hidden shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {typeof kpi.value === 'number' ? kpi.format(kpi.value) : kpi.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpi.description}
                </p>
                
                {/* Badge de status para NPS e Média */}
                {(kpi.title === 'NPS Combinado' && typeof kpi.value === 'number') && (
                  <div className="mt-2">
                    {(() => {
                      const status = getStatusBadge('nps', Math.ceil(kpi.value as number));
                      return <Badge variant={status.variant as any} className="text-xs">{status.text}</Badge>;
                    })()}
                  </div>
                )}
                
                {(kpi.title === 'Média Geral' && typeof kpi.value === 'number') && (
                  <div className="mt-2">
                    {(() => {
                      const status = getStatusBadge('media', kpi.value as number);
                      return <Badge variant={status.variant as any} className="text-xs">{status.text}</Badge>;
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalhamento por Bloco */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Detalhamento por Bloco</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                name: 'Autoavaliação', 
                value: data.avaliacaoMedia.autoavaliacao, 
                icon: GraduationCap,
                color: 'text-primary',
                bgColor: 'bg-primary/5'
              },
              { 
                name: 'Professor', 
                value: data.avaliacaoMedia.professor, 
                icon: Users,
                color: 'text-accent',
                bgColor: 'bg-accent/5'
              },
              { 
                name: 'Metodologia', 
                value: data.avaliacaoMedia.metodologia, 
                icon: Target,
                color: 'text-success',
                bgColor: 'bg-success/5'
              },
              { 
                name: 'Infraestrutura', 
                value: data.avaliacaoMedia.infraestrutura, 
                icon: Building,
                color: 'text-warning',
                bgColor: 'bg-warning/5'
              },
            ].map((bloco, index) => {
              const Icon = bloco.icon;
              const status = getStatusBadge('media', bloco.value);
              
              return (
                <div key={index} className={`p-4 rounded-lg border ${bloco.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${bloco.color}`} />
                    <Badge variant={status.variant as any} className="text-xs">
                      {status.text}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {bloco.value.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bloco.name}
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-2 w-full bg-border rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        bloco.value >= 8.5 ? 'bg-success' :
                        bloco.value >= 7.0 ? 'bg-primary' :
                        bloco.value >= 6.0 ? 'bg-warning' : 'bg-destructive'
                      }`}
                      style={{ width: `${(bloco.value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}