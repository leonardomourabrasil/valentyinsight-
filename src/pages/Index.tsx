import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CSVUploader } from '@/components/CSVUploader';
import { KPICards } from '@/components/KPICards';
import { NPSChart } from '@/components/charts/NPSChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { FilterPanel, FilterState } from '@/components/FilterPanel';
import { useFilteredData } from '@/hooks/useFilteredData';
import { TransformedSurveyData } from '@/lib/csvSchema';
import { 
  calculateNPS, 
  calculateBlockAverages 
} from '@/lib/transform';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Upload as UploadIcon, BookOpen, Clock, CalendarRange, CheckCircle2, Users, Star, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [surveyData, setSurveyData] = useState<TransformedSurveyData[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    turmas: [],
    cursos: [],
    professores: [],
    blocos: [],
    scoreMin: 0,
    scoreMax: 10,
    nivelAproveitamento: [],
    buscarTexto: '',
  });

  const { toast } = useToast();
  const filteredData = useFilteredData(surveyData, filters);

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const savedData = localStorage.getItem('valenty_survey_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setSurveyData(parsedData);
        toast({
          title: "Dados carregados",
          description: `${parsedData.length} respostas restauradas da sessão anterior.`,
        });
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
        localStorage.removeItem('valenty_survey_data');
      }
    }
  }, [toast]);

  const handleDataLoaded = (data: TransformedSurveyData[]) => {
    setSurveyData(data);
    toast({
      title: "Dados importados com sucesso!",
      description: `${data.length} respostas carregadas. Dashboard atualizado.`,
    });
  };

  const handleExport = async () => {
    try {
      // Implementação básica de exportação
      const dataToExport = {
        timestamp: new Date().toISOString(),
        totalRespostas: filteredData.length,
        filtrosAplicados: filters,
        dados: filteredData,
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `valenty-dashboard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída",
        description: "Dados exportados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    // Limpa dados persistidos e volta para a tela inicial de upload
    localStorage.removeItem('valenty_survey_data');
    setSurveyData([]);
    setFilters({
      turmas: [],
      cursos: [],
      professores: [],
      blocos: [],
      scoreMin: 0,
      scoreMax: 10,
      nivelAproveitamento: [],
      buscarTexto: '',
    });
    toast({
      title: 'Dados resetados',
      description: 'Voltamos à tela inicial para novo upload.',
    });
  };

  // Calcular métricas para os dados filtrados
  const kpiData = React.useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalRespondentes: 0,
        mediaGeral: 0,
        npsTotal: 0,
        blocoMelhor: 'N/A',
        avaliacaoMedia: {
          autoavaliacao: 0,
          professor: 0,
          metodologia: 0,
          infraestrutura: 0,
        },
      };
    }

    const blockAverages = calculateBlockAverages(filteredData);
    const npsCurso = calculateNPS(filteredData.map(d => d.nps.npsCurso));
    const npsMarca = calculateNPS(filteredData.map(d => d.nps.npsMarca));

    const mediaGeral = (
      blockAverages.autoavaliacao +
      blockAverages.professor +
      blockAverages.metodologia +
      blockAverages.infraestrutura
    ) / 4;

    const npsTotal = Math.ceil((npsCurso.nps + npsMarca.nps) / 2);

    // Encontrar melhor bloco
    const blocos = [
      { nome: 'Autoavaliação', valor: blockAverages.autoavaliacao },
      { nome: 'Professor', valor: blockAverages.professor },
      { nome: 'Metodologia', valor: blockAverages.metodologia },
      { nome: 'Infraestrutura', valor: blockAverages.infraestrutura },
    ];
    const blocoMelhor = blocos.reduce((max, bloco) => 
      bloco.valor > max.valor ? bloco : max
    ).nome;

    return {
      totalRespondentes: filteredData.length,
      mediaGeral,
      npsTotal,
      blocoMelhor,
      avaliacaoMedia: blockAverages,
    };
  }, [filteredData]);

  const npsData = React.useMemo(() => {
    const cursoScores = filteredData.map(d => d.nps.npsCurso);
    const marcaScores = filteredData.map(d => d.nps.npsMarca);
    const npsCurso = calculateNPS(cursoScores);
    const npsMarca = calculateNPS(marcaScores);
    const npsCombined = calculateNPS([...cursoScores, ...marcaScores]);
    
    return { npsCurso, npsMarca, npsCombined };
  }, [filteredData]);

  // Gauge do NPS (curso)
  const npsGauge = React.useMemo(() => {
    const c = npsData.npsCombined;
    const percent = Math.max(0, Math.min(100, Math.ceil(c.nps)));
    const r = 80;
    const circumference = Math.PI * r; // semicircunferência
    const dash = (percent / 100) * circumference;
    const zone = percent >= 90
      ? 'Zona de Excelência'
      : percent >= 70
      ? 'Excelente'
      : percent >= 30
      ? 'Bom'
      : percent >= 0
      ? 'Regular'
      : 'Crítico';
    return { percent, r, circumference, dash, zone, c };
  }, [npsData]);



// Nova: cálculo das médias por dimensão do Professor
  const professorMetrics = React.useMemo(() => {
    const avg = (values: Array<number | null>) => {
      const valid = values.filter((v): v is number => typeof v === 'number');
      if (valid.length === 0) return null;
      return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
    };

    const relacionamento = avg(filteredData.map(d => d.avaliacaoProfessor.relacionamento));
    const dominioAssunto = avg(filteredData.map(d => d.avaliacaoProfessor.dominioAssunto));
    const aplicabilidade = avg(filteredData.map(d => d.avaliacaoProfessor.aplicabilidade));
    const didatica = avg(filteredData.map(d => d.avaliacaoProfessor.didaticaComunicacao));
    const pontualidade = avg(filteredData.map(d => d.avaliacaoProfessor.pontualidade));

    let professorNome = '';
    if (filters.professores.length === 1) {
      professorNome = filters.professores[0];
    } else {
      const uniq = Array.from(new Set(filteredData.map(d => d.professor).filter(Boolean)));
      if (uniq.length === 1) professorNome = uniq[0] as string;
    }

    return { relacionamento, dominioAssunto, aplicabilidade, didatica, pontualidade, professorNome };
  }, [filteredData, filters.professores]);

  // Comparativo entre Turmas (agrupado por CLUSTERS de datas globais)
  const turmasComparativo = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [] as Array<{
      title: string; // ex.: "Turma Agosto 2025"
      subtitle: string; // ex.: "01-02 de Agosto | TURMA-001 e TURMA-002"
      participantes: number;
      mediaGeral: number;
      npsTotal: number;
      focoTotal: number | null;
      start: Date | null;
    }>;

    const toMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayMs = 24 * 60 * 60 * 1000;
    const gapDays = 3;

    // Coleta todas as datas relevantes (início/fim; fallback submittedAt) normalizadas
    const rowDates: Map<TransformedSurveyData, number[]> = new Map();
    const allTimes: number[] = [];
    filteredData.forEach(r => {
      const dates: number[] = [];
      const pushDate = (x: any) => {
        if (!x) return;
        const d = x instanceof Date ? x : new Date(x);
        if (!isNaN(d.getTime())) dates.push(toMidnight(d).getTime());
      };
      if (r.dataInicio) pushDate(r.dataInicio);
      if (r.dataTermino) pushDate(r.dataTermino);
      if (dates.length === 0 && r.submittedAt) pushDate(r.submittedAt);
      const uniq = Array.from(new Set(dates));
      rowDates.set(r, uniq);
      uniq.forEach(t => allTimes.push(t));
    });

    const sorted = Array.from(new Set(allTimes)).sort((a, b) => a - b).map(t => new Date(t));
    if (sorted.length === 0) return [];

    // Clusterização global de datas
    type Cluster = { start: Date; end: Date };
    const clusters: Cluster[] = [];
    let current: Cluster = { start: sorted[0], end: sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
      const prev = current.end;
      const curr = sorted[i];
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / dayMs);
      if (diffDays <= gapDays) {
        current.end = curr;
      } else {
        clusters.push(current);
        current = { start: curr, end: curr };
      }
    }
    clusters.push(current);

    // Utilitários de label
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const formatMonthYear = (d: Date) => `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const pad2 = (n: number) => n.toString().padStart(2, '0');
    const formatShortRange = (s: Date | null, e: Date | null) => {
      if (!s && !e) return '';
      const start = s || e!;
      const end = e || s!;
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      if (sameMonth) {
        const d1 = pad2(start.getDate());
        const d2 = pad2(end.getDate());
        const mes = monthNames[start.getMonth()];
        return start.getDate() === end.getDate() ? `${d1} de ${mes}` : `${d1}-${d2} de ${mes}`;
      }
      // meses diferentes (mesmo ano)
      const d1 = pad2(start.getDate());
      const m1 = monthNames[start.getMonth()];
      const d2 = pad2(end.getDate());
      const m2 = monthNames[end.getMonth()];
      return `${d1} de ${m1} – ${d2} de ${m2}`;
    };

    // Para cada cluster global, agregamos as respostas que tocam o intervalo
    const results = clusters.map(cl => {
      const inCluster = filteredData.filter(r => {
        const times = rowDates.get(r) || [];
        return times.some(t => t >= toMidnight(cl.start).getTime() && t <= toMidnight(cl.end).getTime());
      });
      if (inCluster.length === 0) return null;

      // Frequência por dia dentro do cluster
      const freq = new Map<number, number>();
      const add = (t: number) => freq.set(t, (freq.get(t) || 0) + 1);
      inCluster.forEach(r => {
        const times = (rowDates.get(r) || []).filter(t => t >= toMidnight(cl.start).getTime() && t <= toMidnight(cl.end).getTime());
        times.forEach(add);
      });

      // Lista contínua de dias do cluster
      const days: number[] = [];
      let d = toMidnight(cl.start).getTime();
      const endT = toMidnight(cl.end).getTime();
      while (d <= endT) { days.push(d); d += dayMs; }

      // Escolher a janela mais densa: preferência por 2 dias; depois 3; depois 1. Empate: janela mais recente.
      const lengths = [2, 3, 1];
      let bestStart = days[0];
      let bestLen = 1;
      let bestSum = -1;
      for (const len of lengths) {
        if (days.length < len) continue;
        for (let i = 0; i <= days.length - len; i++) {
          let sum = 0;
          for (let k = 0; k < len; k++) {
            const t = days[i] + k * dayMs;
            sum += freq.get(t) || 0;
          }
          if (sum > bestSum || (sum === bestSum && (days[i] > bestStart))) {
            bestSum = sum; bestStart = days[i]; bestLen = len;
          }
        }
        if (bestSum > 0) break; // encontramos janela com sinal claro
      }
      const repStart = new Date(bestStart);
      const repEnd = new Date(bestStart + (bestLen - 1) * dayMs);

      // Agregações
      const block = calculateBlockAverages(inCluster);
      const mediaGeral = Number((((
        block.autoavaliacao + block.professor + block.metodologia + block.infraestrutura
      ) / 4)).toFixed(1));

      const npsCurso = calculateNPS(inCluster.map((d) => d.nps.npsCurso));
      const npsMarca = calculateNPS(inCluster.map((d) => d.nps.npsMarca));
      const npsTotal = Math.ceil((npsCurso.nps + npsMarca.nps) / 2);

      const focusVals = inCluster
        .map((r) => r.nps.nivelAproveitamento || '')
        .map((txt) => {
          const m = txt.match(/(\d{1,3})\s*%/);
          if (!m) return null;
          const v = parseInt(m[1], 10);
          if (isNaN(v)) return null;
          return Math.max(0, Math.min(100, v));
        })
        .filter((v): v is number => v !== null);
      const focoTotal = focusVals.length ? Math.ceil(focusVals.reduce((a, b) => a + b, 0) / focusVals.length) : null;

      // Título e subtítulo
      const title = `Turma ${formatMonthYear(repStart)}`;
      const short = formatShortRange(repStart, repEnd);
      const turmasSet = new Set(
        inCluster.map(r => (r.turma || '').trim()).filter(Boolean)
      );
      const turmasList = Array.from(turmasSet).sort((a,b) => a.localeCompare(b, 'pt-BR'));
      const joinTurmas = (arr: string[]) => {
        if (arr.length <= 1) return arr[0] || '';
        if (arr.length === 2) return `${arr[0]} e ${arr[1]}`;
        return `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}`;
      };
      const coursesSet = new Set(inCluster.map(r => (r.curso || '').trim()).filter(Boolean));
      const courseSuffix = coursesSet.size === 1 ? ` – ${Array.from(coursesSet)[0]}` : '';
      const subtitle = `${short} | ${joinTurmas(turmasList)}${courseSuffix}`;

      return {
        title,
        subtitle,
        participantes: inCluster.length,
        mediaGeral,
        npsTotal,
        focoTotal,
        start: repStart
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    // Ordenação por início do cluster
    results.sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));

    return results;
  }, [filteredData]);

  // Lista completa de feedbacks com metadados (turma/curso)
  const feedbackItems = React.useMemo(() => {
    const items: { text: string; turma: string; curso: string }[] = [];
    const push = (r: TransformedSurveyData, t?: string | null) => {
      if (t && t.trim().length > 0) {
        items.push({ text: t.trim(), turma: r.turma, curso: r.curso });
      }
    };
    filteredData.forEach(r => {
      push(r, r.autoavaliacao.feedback);
      push(r, r.avaliacaoProfessor.feedback);
      push(r, r.metodologia.feedback);
      push(r, r.nps.melhorias);
    });
    return items;
  }, [filteredData]);

  // Nova seção: informações agregadas do(s) curso(s)
  const courseInfo = React.useMemo(() => {
    const empty = {
      courseLabel: '—',
      cargaHorariaLabel: '—',
      totalHorasLabel: '—',
      periodosLabel: '',
      participantes: 0,
      turmasCount: 0,
      npsPercent: 0,
      npsZone: '—',
      mediaGeral: 0,
      recomendacaoMarcaPct: 0,
      aproveitamentoMaxPct: 0,
    };

    if (!filteredData || filteredData.length === 0) return empty;

    // Curso(s)
    const cursos = Array.from(new Set(filteredData.map(d => (d.curso || '').trim()).filter(Boolean)));
    const courseLabel = cursos.length === 1 ? cursos[0] : `${cursos.length} cursos`;

    // Turmas
    const turmas = Array.from(new Set(filteredData.map(d => (d.turma || '').trim()).filter(Boolean)));

    // Carga horária por turma (heurística: extrair do nome do curso, ex.: "16 horas")
    const hoursVals = filteredData
      .map(d => d.curso || '')
      .map(txt => {
        const m = txt.match(/(\d{1,3})\s*(?:h|horas?)/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    let cargaPorTurma: number | null = null;
    if (hoursVals.length) {
      // escolher o valor mais frequente
      const freq = new Map<number, number>();
      hoursVals.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
      cargaPorTurma = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0][0];
    }

    const cargaHorariaLabel = cargaPorTurma ? `${cargaPorTurma} horas por turma` : '—';
    const totalHorasLabel = cargaPorTurma ? `${cargaPorTurma * Math.max(1, turmas.length)} horas (${Math.max(1, turmas.length)} turmas)` : '—';

    // Períodos por turma
    const byTurma = new Map<string, TransformedSurveyData[]>();
    filteredData.forEach(r => {
      const key = (r.turma || '').trim();
      if (!key) return;
      if (!byTurma.has(key)) byTurma.set(key, []);
      byTurma.get(key)!.push(r);
    });

    const ranges: string[] = Array.from(byTurma.entries()).map(([turma, rows]) => {
      const { start, end } = deriveTrainingRange(rows);
      return formatDateRange(start, end);
    }).filter(Boolean);

    let periodosLabel = ranges.join(' • ');
    if (ranges.length > 2) {
      periodosLabel = `${ranges.slice(0, 2).join(' e ')} +${ranges.length - 2}`;
    }

    // NPS combinado e zona (reutiliza lógica do gauge)
    const cursoScores = filteredData.map(d => d.nps.npsCurso);
    const marcaScores = filteredData.map(d => d.nps.npsMarca);
    const cAll = calculateNPS([...cursoScores, ...marcaScores]);
    const npsPercent = Math.max(0, Math.min(100, Math.ceil(cAll.nps)));
    const npsZone = npsPercent >= 90
      ? 'Nível de excelência em satisfação'
      : npsPercent >= 70
      ? 'Excelente'
      : npsPercent >= 30
      ? 'Bom'
      : npsPercent >= 0
      ? 'Regular'
      : 'Crítico';

    // Média geral
    const mediaGeral = Number(kpiData.mediaGeral.toFixed(1));

    // Taxa de recomendação da marca (promoters / total)
    const npsMarca = calculateNPS(marcaScores);
    const recomendacaoMarcaPct = npsMarca.total > 0 ? Math.ceil((npsMarca.promoters / npsMarca.total) * 100) : 0;

    // Aproveitamento máximo (100% ou menções explícitas a "máximo"). Fallback: >=90%
    const aproxIsMax = (txt: string | null) => {
      if (!txt) return false;
      const t = txt.toLowerCase();
      const m = t.match(/(\d{1,3})\s*%/);
      const v = m ? parseInt(m[1], 10) : null;
      const hasMax = t.includes('aproveitamento max') || t.includes('máximo') || t.includes('maximo');
      if (hasMax) return true;
      if (v !== null) return v >= 100;
      return false;
    };
    const aproxIsHigh = (txt: string | null) => {
      if (!txt) return false;
      const m = txt.match(/(\d{1,3})\s*%/);
      const v = m ? parseInt(m[1], 10) : null;
      return v !== null && v >= 90;
    };

    const maxCount = filteredData.filter(d => aproxIsMax(d.nps.nivelAproveitamento) || (!aproxIsMax(d.nps.nivelAproveitamento) && aproxIsHigh(d.nps.nivelAproveitamento))).length;
    const aproveitamentoMaxPct = Math.ceil((maxCount / filteredData.length) * 100);

    return {
      courseLabel,
      cargaHorariaLabel,
      totalHorasLabel,
      periodosLabel,
      participantes: filteredData.length,
      turmasCount: turmas.length || 1,
      npsPercent,
      npsZone,
      mediaGeral,
      recomendacaoMarcaPct,
      aproveitamentoMaxPct,
    };
  }, [filteredData, kpiData.mediaGeral]);

  // Pontos de Atenção e Melhorias (classificação com rótulo dinâmico)
  const improvementBlocks = React.useMemo(() => {
    type Category = 'Infraestrutura' | 'Formato do Curso' | 'Metodologia' | 'Comunicação e Didática' | 'Outros';

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const tokenize = (t: string) => t.split(/[^a-z0-9]+/).filter(Boolean);

    // Vocabulário base (sem acentos)
    const NEGATIVE = [
      'falta','precisa','precisaria','poderia','melhorar','melhoria','ruim','pior','baixo','pouco','confuso',
      'dific','dificil','lento','devagar','cansativo','cansar','entediante','entediar','barulho','ruido',
      'problema','instavel','queda','oscilacao','atraso','demora','lotado','apertado','quebrado','falho','bug','trava'
    ];
    const STRONG_NEG_WORDS = ['problema','ruim','pior','quebrado','falho','bug','trava','cansativo'];
    const PHRASE_STRONG_NEG = ['nao funciona','sem internet','muito cansativo','sem wifi','sem wi-fi'];
    const POSITIVE_PHRASES = ['sem cansar','sem entediar','nao cansativo','nao entediante','nao e cansativo','nao e entediante'];
    const NEGATORS = ['nao','sem','nunca'];
    const POSITIVE = [
      'excelente','otimo','bom','muito bom','maravilhoso','show','top','gostei','amei','parabens','perfeito','satisfeito','incrivel',
      'bem','preparado','clareza','dinamico','didatica','didatico','engajado','organizado','conduzir','fluido','leve'
    ];

    const scoreText = (raw: string) => {
      const t = normalize(raw);
      let s = 0;
      // Frases compostas muito negativas
      PHRASE_STRONG_NEG.forEach(ph => { if (t.includes(ph)) s += 2; });
      // Frases compostas positivas (ex.: "sem cansar")
      POSITIVE_PHRASES.forEach(ph => { if (t.includes(ph)) s -= 2; });

      const tokens = tokenize(t);
      for (let i = 0; i < tokens.length; i++) {
        const w = tokens[i];
        // Palavras negativas com verificação de negação no contexto anterior (janela de 8)
        if (NEGATIVE.some(k => w.startsWith(k))) {
          let weight = STRONG_NEG_WORDS.some(k => w.startsWith(k)) ? 2 : 1;
          const start = Math.max(0, i - 8);
          const hasNegator = tokens.slice(start, i).some(tok => NEGATORS.includes(tok));
          s += hasNegator ? -weight : weight;
        }
        // Palavras positivas
        if (POSITIVE.some(k => w.startsWith(k))) {
          s -= 1;
        }
      }
      return s;
    };

    const classify = (text: string): { category: Category; title: string; suggestion: string } => {
      const t = normalize(text);
      const hasAny = (arr: string[]) => arr.some(k => t.includes(normalize(k)));

      // Infraestrutura com subcategoria de Internet
      const infraInternet = ['wifi','wi-fi','wireless','internet','conex','rede','banda','latencia','latência'];
      if (hasAny([...infraInternet, 'infraestrutura','projetor','som','microfone','ar condicionado','climatiz','ilumina','acust','ventila','cadeira','mesa','equipament','sala'])) {
        const isNet = hasAny(infraInternet);
        return {
          category: 'Infraestrutura',
          title: isNet ? 'Infraestrutura de Internet' : 'Infraestrutura',
          suggestion: isNet
            ? 'Verificar e aprimorar a internet (ex.: conexão e banda) para garantir melhor experiência em sala.'
            : 'Aprimorar a infraestrutura física e os equipamentos para melhorar a experiência dos participantes.',
        };
      }
      if (hasAny(['formato','carga hor','horario','horário','cronograma','tempo','ritmo','dois dias','seguidos','cansativo','intenso','duracao','duração','semanas','módul','modul','intervalo','pausa'])) {
        return {
          category: 'Formato do Curso',
          title: 'Formato do Curso',
          suggestion: 'Reavaliar a distribuição de conteúdos e carga horária para reduzir cansaço e melhorar absorção.',
        };
      }
      if (hasAny(['metodologia','dinamic','atividade','pratic','mao na massa','mão na massa','interativo','interacao','interação','exercicio','exercício','estudo de caso','participacao'])) {
        return {
          category: 'Metodologia',
          title: 'Metodologia',
          suggestion: 'Aumentar momentos práticos e dinâmicas que favoreçam a aplicação do conteúdo.',
        };
      }
      if (hasAny(['comunicacao','comunicação','didatica','didática','clareza','explica','objetivo','velocidade','rápido','rapido','lento','exemplos','slides'])) {
        return {
          category: 'Comunicação e Didática',
          title: 'Comunicação e Didática',
          suggestion: 'Ajustar ritmo e clareza das explicações, reforçando exemplos e checkpoints de entendimento.',
        };
      }
      return {
        category: 'Outros',
        title: 'Outros',
        suggestion: 'Revisar este ponto com a equipe para propor uma melhoria específica.',
      };
    };

    // Coletar candidatas: prioriza campo de melhorias; inclui outros textos somente quando há indícios claros de problema
    type Cand = { text: string; turma: string; curso: string; score: number; title: string; suggestion: string };
    const candidates: Cand[] = [];
    const seen = new Set<string>();

    filteredData.forEach(r => {
      if (r.nps.melhorias && r.nps.melhorias.trim()) {
        const raw = r.nps.melhorias.trim();
        const key = normalize(raw);
        const cls = classify(raw);
        const score = scoreText(raw);
        if (!seen.has(key)) {
          candidates.push({ text: raw, turma: r.turma, curso: r.curso, score, title: cls.title, suggestion: cls.suggestion });
          seen.add(key);
        }
      }
      const maybe = [r.metodologia.feedback, r.avaliacaoProfessor.feedback, r.autoavaliacao.feedback];
      maybe.forEach(t => {
        if (t && t.trim()) {
          const raw = t.trim();
          const sc = scoreText(raw);
          if (sc > 0 && !seen.has(normalize(raw))) {
            const cls = classify(raw);
            candidates.push({ text: raw, turma: r.turma, curso: r.curso, score: sc, title: cls.title, suggestion: cls.suggestion });
            seen.add(normalize(raw));
          }
        }
      });
    });

    if (candidates.length === 0) return [] as { title: string; label: 'Problema identificado' | 'Feedback'; feedback: string; suggestion: string }[];

    // Agrupar por título de categoria
    const grouped = new Map<string, Cand[]>();
    candidates.forEach(c => {
      const arr = grouped.get(c.title) || [];
      arr.push(c);
      grouped.set(c.title, arr);
    });

    // Seleciona até 3 categorias mais frequentes; em cada uma escolhe a frase com maior score (ou neutra se nenhuma >0)
    const ordered = Array.from(grouped.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([title, items]) => {
        const byScore = [...items].sort((a, b) => b.score - a.score);
        const best = byScore[0];
        const label: 'Problema identificado' | 'Feedback' = best.score > 0 ? 'Problema identificado' : 'Feedback';
        // Sugestão coerente: se for Feedback (não-problema), trocar por uma sugestão neutra
        const suggestion = label === 'Feedback' ? 'Registrar o feedback e manter as práticas que estão funcionando.' : best.suggestion;
        return { title, label, feedback: best.text.replace(/^\"+|\"+$/g, ''), suggestion };
      });

    return ordered;
  }, [filteredData]);

  if (surveyData.length === 0) {
    return (
      <DashboardLayout hasData={false}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
              <UploadIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard de Pesquisa de Satisfação
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Bem-vindo ao dashboard Valenty! Faça upload do arquivo CSV com os dados da pesquisa 
              para visualizar métricas detalhadas, NPS e insights sobre as capacitações.
            </p>
          </div>
          
          <CSVUploader onDataLoaded={handleDataLoaded} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center max-w-2xl">
            <div className="p-4">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium">Visualizações Modernas</h3>
              <p className="text-sm text-muted-foreground">
                Gráficos interativos e responsivos
              </p>
            </div>
            <div className="p-4">
              <UploadIcon className="w-8 h-8 text-accent mx-auto mb-2" />
              <h3 className="font-medium">Upload Drag & Drop</h3>
              <p className="text-sm text-muted-foreground">
                Interface intuitiva para importação
              </p>
            </div>
            <div className="p-4">
              <BarChart3 className="w-8 h-8 text-success mx-auto mb-2" />
              <h3 className="font-medium">Métricas NPS</h3>
              <p className="text-sm text-muted-foreground">
                Análise completa de satisfação
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onExport={handleExport} hasData={true} onReset={handleReset}>
      <div className="space-y-6">
        {/* Status dos dados e filtros */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              {surveyData.length} respostas totais
            </Badge>
            {filteredData.length !== surveyData.length && (
              <Badge variant="secondary" className="text-sm">
                {filteredData.length} após filtros
              </Badge>
            )}
          </div>
          
          {filteredData.length === 0 && surveyData.length > 0 && (
            <Alert className="max-w-md">
              <AlertDescription>
                Os filtros aplicados não retornaram resultados. Ajuste os critérios ou limpe os filtros.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Painel de Filtros */}
        <FilterPanel
          data={surveyData}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {filteredData.length > 0 ? (
          <>
            {/* KPIs */}
            <KPICards data={kpiData} />

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NPSChart 
                npsCurso={npsData.npsCurso} 
                npsMarca={npsData.npsMarca} 
              />
              <RadarChart data={kpiData.avaliacaoMedia} />
            </div>

            {/* Comparativo entre Turmas */}
            {turmasComparativo.length >= 2 && (
              <Card className="border-primary/20 shadow-sm">
                <div className="px-6 pt-6 pb-4 border-b">
                  <h2 className="text-2xl font-semibold leading-none tracking-tight">Comparativo entre Turmas</h2>
                  <p className="text-sm text-muted-foreground mt-1">Resumo por turma: participantes, média geral, NPS e foco total.</p>
                 </div>
                 <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {turmasComparativo.map((t, idx) => (
                      <div key={idx} className="rounded-xl border bg-card/50 p-5 transition-transform duration-300 ease-out hover:shadow-card hover:-translate-y-0.5">
                         <div>
                           <h3 className="text-base font-semibold text-primary">{t.title}</h3>
                           {t.subtitle && (
                             <p className="text-sm text-muted-foreground mt-0.5">{t.subtitle}</p>
                           )}
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
                           <div>
                             <div className="text-2xl font-bold text-primary">{t.participantes}</div>
                             <div className="text-[10px] tracking-wide uppercase text-muted-foreground">Participantes</div>
                           </div>
                           <div>
                             <div className="text-2xl font-bold text-primary">{t.mediaGeral}</div>
                             <div className="text-[10px] tracking-wide uppercase text-muted-foreground">Média Geral</div>
                           </div>
                           <div>
                             <div className="text-2xl font-bold text-primary">{Math.ceil(t.npsTotal)}%</div>
                             <div className="text-[10px] tracking-wide uppercase text-muted-foreground">NPS</div>
                           </div>
                           <div>
                             <div className="text-2xl font-bold text-primary">{t.focoTotal !== null ? `${t.focoTotal}%` : '-'}</div>
                             <div className="text-[10px] tracking-wide uppercase text-muted-foreground">Foco Total</div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             )}

             {/* Avaliação do Professor (substitui Evolução Temporal) */}
             <Card className="border-primary/20 shadow-sm">
               <div className="px-6 pt-6">
                 <h2 className="text-2xl font-semibold leading-none tracking-tight">
                   Avaliação do Professor{professorMetrics.professorNome ? ` ${professorMetrics.professorNome}` : ''}
                 </h2>
                 <p className="text-sm text-muted-foreground mt-1">Médias das dimensões: domínio do assunto, didática, relacionamento, aplicabilidade e pontualidade.</p>
               </div>
               <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Domínio do Assunto', value: professorMetrics.dominioAssunto },
                    { label: 'Didática', value: professorMetrics.didatica },
                    { label: 'Relacionamento', value: professorMetrics.relacionamento },
                    { label: 'Aplicabilidade', value: professorMetrics.aplicabilidade },
                    { label: 'Pontualidade', value: professorMetrics.pontualidade },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center">
                      <div className="w-full h-28 rounded-xl bg-gradient-primary shadow-inner relative transition-transform duration-300 ease-out hover:shadow-glow hover:-translate-y-0.5">
                        <div className="absolute left-1/2 -translate-x-1/2 top-3 text-2xl font-bold text-white drop-shadow-sm">
                          {item.value !== null ? item.value.toFixed(1) : '-'}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Net Promoter Score (NPS) - Gauge */}
            <Card className="border-primary/20 shadow-sm mt-6">
              <div className="px-6 pt-6 pb-4 border-b">
                
                 <h2 className="text-2xl font-semibold leading-none tracking-tight">Net Promoter Score (NPS)</h2>
              </div>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  {/* Gauge em SVG (semicírculo) */}
                  <div className="w-full max-w-2xl">
                    <div className="relative mx-auto flex items-center justify-center" style={{ height: 180 }}>
                      <svg width="100%" height="100%" viewBox="0 0 220 120" className="overflow-visible">
                        <defs>
                          <linearGradient id="npsGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--destructive))" />
                            <stop offset="50%" stopColor="hsl(var(--warning))" />
                            <stop offset="100%" stopColor="hsl(var(--success))" />
                          </linearGradient>
                        </defs>
                        {/* arco de fundo */}
                        <path
                          d="M 20 100 A 90 90 0 0 1 200 100"
                          fill="transparent"
                          stroke="hsl(var(--muted))"
                          strokeOpacity="0.5"
                          strokeWidth="20"
                          strokeLinecap="round"
                        />
                        {/* arco de progresso */}
                        <path
                          d="M 20 100 A 90 90 0 0 1 200 100"
                          fill="transparent"
                          stroke="url(#npsGaugeGradient)"
                          strokeWidth="20"
                          strokeLinecap="round"
                          style={{
                            strokeDasharray: `${npsGauge.dash} ${npsGauge.circumference}`,
                            transition: 'stroke-dasharray 600ms ease-out',
                          }}
                          pathLength={npsGauge.circumference}
                        />
                      </svg>
                      {/* Valor central e rótulo */}
                      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-center">
                        <div className="text-5xl font-bold text-primary">{npsGauge.percent}%</div>
                        <div className="text-sm text-muted-foreground">{npsGauge.zone}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Linhas informativas abaixo do gauge */}
                  <div className="mt-6 text-center">
                    <div className="text-sm text-muted-foreground">
                      {npsData.npsCurso.promoters} participantes deram nota 9 ou 10 para recomendação do curso
                    </div>
                    {npsData.npsCurso.neutros > 0 && (
                      <div className="text-xs text-muted-foreground/80 mt-1">
                        {npsData.npsCurso.neutros} participantes deram nota 7 ou 8 (neutros)
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destaques dos Feedbacks */}
            <Card className="border-primary/20 shadow-sm mt-6">
              <div className="px-6 pt-6 pb-4 border-b">
                <h2 className="text-2xl font-semibold leading-none tracking-tight">Destaques dos Feedbacks</h2>
              </div>
              <CardContent className="pt-6">
                {feedbackItems.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto pr-1">
                    <ul className="space-y-3">
                      {feedbackItems.map((item, idx) => (
                        <li key={idx} className="rounded-md bg-muted/50 dark:bg-muted/20 px-4 py-3 flex gap-3 items-start">
                          <span aria-hidden className="text-xl leading-none text-primary select-none">“</span>
                          <div>
                            <p className="text-sm text-foreground/90 italic">{item.text.replace(/^\"+|\"+$/g, '')}</p>
                            <div className="text-xs text-muted-foreground mt-1">{item.turma || 'Turma não informada'} • {item.curso || 'Curso não informado'}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhum feedback disponível</div>
                )}
              </CardContent>
            </Card>

            {/* Pontos de Atenção e Melhorias */}
            <Card className="border-primary/20 shadow-sm mt-6">
              <div className="px-6 pt-6 pb-4 border-b">
                <h2 className="text-2xl font-semibold leading-none tracking-tight">Pontos de Atenção e Melhorias</h2>
              </div>
              <CardContent className="pt-6">
                {improvementBlocks.length > 0 ? (
                  <div className="space-y-4">
                    {improvementBlocks.map((blk, idx) => (
                      <div key={idx} className="rounded-lg border bg-muted/30 px-5 py-4">
                        <div className="font-medium text-primary mb-3">{blk.title}</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-foreground">{blk.label}:</div>
                            <div className="mt-1 text-sm text-foreground/90 bg-background/70 rounded-md px-3 py-2">{blk.feedback}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">Sugestão:</div>
                            <div className="mt-1 text-sm text-muted-foreground">{blk.suggestion}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhum ponto de atenção encontrado</div>
                )}
              </CardContent>
            </Card>

            {/* Informações dos Cursos */}
            <Card className="border-primary/20 shadow-sm mt-6">
              <div className="px-6 pt-6 pb-4 border-b flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold leading-none tracking-tight">Informações dos Cursos</h2>
              </div>
              <CardContent className="pt-6">
                {/* Linha de informações principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <div className="text-xs text-muted-foreground">Curso</div>
                    <div className="text-sm font-medium text-foreground mt-1 truncate" title={courseInfo.courseLabel}>{courseInfo.courseLabel}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <div className="text-xs text-muted-foreground">Carga Horária</div>
                    <div className="text-sm font-medium text-foreground mt-1 flex items-center gap-2"><Clock className="h-4 w-4 text-primary/80" /> {courseInfo.cargaHorariaLabel}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <div className="text-xs text-muted-foreground">Total de Horas</div>
                    <div className="text-sm font-medium text-foreground mt-1">{courseInfo.totalHorasLabel}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <div className="text-xs text-muted-foreground">Períodos</div>
                    <div className="text-sm font-medium text-foreground mt-1 flex items-center gap-2"><CalendarRange className="h-4 w-4 text-primary/80" /> {courseInfo.periodosLabel || '—'}</div>
                  </div>
                </div>

                {/* Resultados Consolidados */}
                <div className="mt-5 rounded-lg border border-emerald-300/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    Resultados Consolidados
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-start gap-2 text-foreground/90">
                      <Users className="h-4 w-4 text-primary mt-0.5" />
                      <span><span className="font-semibold">{courseInfo.participantes}</span> colaboradores capacitados em <span className="font-semibold">{courseInfo.turmasCount}</span> {courseInfo.turmasCount === 1 ? 'turma' : 'turmas'}</span>
                    </li>
                    <li className="flex items-start gap-2 text-foreground/90">
                      <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span><span className="font-semibold">{courseInfo.npsPercent}%</span> de NPS — <span className="opacity-80">{courseInfo.npsZone}</span></span>
                    </li>
                    <li className="flex items-start gap-2 text-foreground/90">
                      <Award className="h-4 w-4 text-primary mt-0.5" />
                      <span><span className="font-semibold">{courseInfo.mediaGeral.toFixed(1)}</span> de média geral nas avaliações</span>
                    </li>
                    <li className="flex items-start gap-2 text-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                      <span><span className="font-semibold">{courseInfo.recomendacaoMarcaPct}%</span> de recomendação do Instituto Valente</span>
                    </li>
                    <li className="flex items-start gap-2 text-foreground/90">
                      <BarChart3 className="h-4 w-4 text-rose-500 mt-0.5" />
                      <span><span className="font-semibold">{courseInfo.aproveitamentoMaxPct}%</span> dos participantes com aproveitamento máximo</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

          </>
        ) : surveyData.length > 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Nenhum dado corresponde aos filtros aplicados
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Index;


// Helper: deriva o melhor intervalo de treinamento por turma a partir das datas (início/término ou submittedAt),
// agrupando por proximidade (clusters) e escolhendo o cluster dominante; empate favorece o mais recente.
function deriveTrainingRange(rows: TransformedSurveyData[]): { start: Date | null; end: Date | null } {
  const toMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const gapDays = 3; // datas até 3 dias de distância pertencem ao mesmo cluster

  // Coleta de datas: usa início/fim; fallback para submittedAt
  const dateSet = new Set<number>();
  rows.forEach(r => {
    const pushDate = (x: any) => {
      if (!x) return;
      const d = x instanceof Date ? x : new Date(x);
      if (!isNaN(d.getTime())) dateSet.add(toMidnight(d).getTime());
    };
    if (r.dataInicio) pushDate(r.dataInicio);
    if (r.dataTermino) pushDate(r.dataTermino);
    if (!r.dataInicio && !r.dataTermino && r.submittedAt) pushDate(r.submittedAt);
  });

  const dates = Array.from(dateSet).sort((a, b) => a - b).map(t => new Date(t));
  if (dates.length === 0) return { start: null, end: null };

  // Clusterização sequencial com base na distância entre dias consecutivos
  type Cluster = { start: Date; end: Date; count: number };
  const clusters: Cluster[] = [];
  let current: Cluster = { start: dates[0], end: dates[0], count: 1 };
  for (let i = 1; i < dates.length; i++) {
    const prev = current.end;
    const curr = dates[i];
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / dayMs);
    if (diffDays <= gapDays) {
      current.end = curr;
      current.count += 1;
    } else {
      clusters.push(current);
      current = { start: curr, end: curr, count: 1 };
    }
  }
  clusters.push(current);

  // Escolha do cluster: maior count; empate pelo cluster com data final mais recente
  clusters.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.end.getTime() - a.end.getTime();
  });

  const best = clusters[0];
  return { start: best.start, end: best.end };
}

// Helper para formatar intervalo de datas no padrão pt-BR (ex.: 01-02 de Agosto)
function formatDateRange(start: Date | null, end: Date | null) {
  if (!start && !end) return '';
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const day = (d: Date) => d.getDate().toString().padStart(2, '0');
  const monthName = (d: Date) => cap(months[d.getMonth()]);
  const year = (d: Date) => d.getFullYear();

  if (start && end) {
    // mesmo mês e ano -> "31-01 de Agosto 2025"
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${day(start)}-${day(end)} de ${monthName(start)} ${year(start)}`;
    }
    // meses diferentes mas mesmo ano -> "31 de Julho e 01 de Agosto de 2025"
    if (start.getFullYear() === end.getFullYear()) {
      return `${day(start)} de ${monthName(start)} e ${day(end)} de ${monthName(end)} de ${year(start)}`;
    }
    // anos diferentes
    return `${day(start)} de ${monthName(start)} ${year(start)} - ${day(end)} de ${monthName(end)} ${year(end)}`;
  }
  const d = start || end!;
  return `${day(d)} de ${monthName(d)} ${year(d)}`;
}
