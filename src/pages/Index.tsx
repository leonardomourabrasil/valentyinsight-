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
// NOVO: libs para exportar PDF a partir do DOM
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

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

  // Estado para sinalizar exportação (usado para ajustar o que vai para o PDF)
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    // Armazena estilos originais para restaurar no final
    const previousStyles = new Map<Element, { maxHeight: string; overflow: string; height: string }>();

    try {
      // Ativa modo de exportação para renderizar apenas o conteúdo desejado no PDF
      setIsExporting(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const root = document.getElementById('print-root');
      if (!root) {
        toast({
          title: 'Exportação indisponível',
          description: 'Não foi possível localizar o conteúdo para exportação.',
          variant: 'destructive',
        });
        return;
      }

      // Expandir áreas roláveis somente para a captura (ex.: listas de feedbacks)
      const expandable = Array.from(root.querySelectorAll('[data-print-expand]')) as HTMLElement[];
      expandable.forEach((el) => {
        previousStyles.set(el, {
          maxHeight: el.style.maxHeight,
          overflow: el.style.overflow,
          height: el.style.height,
        });
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
        el.style.height = 'auto';
      });

      // Forçar layout estável antes do snapshot
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 50));

      // Criar PDF A4 em milímetros
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const sectionSpacing = 6; // mm entre seções

      let yPos = margin;

      // Capturar cada seção individualmente na ordem de exibição
      const sections = Array.from(root.querySelectorAll('[data-print-section]')) as HTMLElement[];

      for (const section of sections) {
        // Ignora seções não visíveis
        if (section.offsetParent === null) continue;

        const dataUrl = await htmlToImage.toPng(section, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          style: { transform: 'none', animation: 'none' },
        });

        const img = new Image();
        const imgLoaded = new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Falha ao carregar imagem gerada para seção'));
        });
        img.src = dataUrl;
        await imgLoaded;

        const scale = contentWidth / img.naturalWidth; // mm por px
        const scaledHeight = img.naturalHeight * scale;

        if (scaledHeight <= contentHeight) {
          // Se não couber no espaço restante da página atual, pula para a próxima página
          if (yPos + scaledHeight > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.addImage(dataUrl, 'PNG', margin, yPos, contentWidth, scaledHeight);
          yPos += scaledHeight + sectionSpacing;
        } else {
          // Seção maior que uma página: fatiar mantendo início da seção no topo de uma página
          const pixelsPerPage = Math.floor(contentHeight / scale);
          const sliceCanvas = document.createElement('canvas');
          const sliceCtx = sliceCanvas.getContext('2d');
          sliceCanvas.width = img.naturalWidth;

          let y = 0;
          let isFirstSlice = true;
          while (y < img.naturalHeight) {
            const sliceHeight = Math.min(pixelsPerPage, img.naturalHeight - y);
            sliceCanvas.height = sliceHeight;
            sliceCtx!.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            sliceCtx!.drawImage(
              img,
              0,
              y,
              sliceCanvas.width,
              sliceHeight,
              0,
              0,
              sliceCanvas.width,
              sliceHeight,
            );
            const sliceDataUrl = sliceCanvas.toDataURL('image/png', 1.0);

            // Garante que a primeira parte começa no topo da página
            if (isFirstSlice || yPos + sliceHeight * scale > pageHeight - margin) {
              if (!isFirstSlice || yPos !== margin) {
                pdf.addPage();
              }
              yPos = margin;
            }

            const sliceHeightMM = sliceHeight * scale;
            pdf.addImage(sliceDataUrl, 'PNG', margin, yPos, contentWidth, sliceHeightMM);
            yPos += sliceHeightMM + sectionSpacing;

            y += sliceHeight;
            isFirstSlice = false;
          }
        }
      }

      // Nome do arquivo com data
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`valenty-dashboard-${dateStr}.pdf`);

      toast({
        title: 'Exportação concluída',
        description: 'PDF gerado com as seções visíveis, com quebras de página inteligentes.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      // Restaurar estilos originais das áreas expandidas
      try {
        previousStyles.forEach((styles, el) => {
          const elem = el as HTMLElement;
          elem.style.maxHeight = styles.maxHeight;
          elem.style.overflow = styles.overflow;
          elem.style.height = styles.height;
        });
      } catch {}
      // Desativa modo de exportação
      setIsExporting(false);
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
    const npsCurso = calculateNPS(filteredData.map((d) => d.nps.npsCurso));
    const npsMarca = calculateNPS(filteredData.map((d) => d.nps.npsMarca));
    const mediaGeral = (
      blockAverages.autoavaliacao +
      blockAverages.professor +
      blockAverages.metodologia +
      blockAverages.infraestrutura
    ) / 4;
    const npsTotal = Math.ceil((npsCurso.nps + npsMarca.nps) / 2);
    const blocos = [
      { nome: 'Autoavaliação', valor: blockAverages.autoavaliacao },
      { nome: 'Professor', valor: blockAverages.professor },
      { nome: 'Metodologia', valor: blockAverages.metodologia },
      { nome: 'Infraestrutura', valor: blockAverages.infraestrutura },
    ];
    const blocoMelhor = blocos.reduce((max, b) => (b.valor > max.valor ? b : max)).nome;
    return {
      totalRespondentes: filteredData.length,
      mediaGeral,
      npsTotal,
      blocoMelhor,
      avaliacaoMedia: blockAverages,
    };
  }, [filteredData]);

  // NPS por curso e marca + combinado
  const npsData = React.useMemo(() => {
    const cursoScores = filteredData.map((d) => d.nps.npsCurso);
    const marcaScores = filteredData.map((d) => d.nps.npsMarca);
    const npsCurso = calculateNPS(cursoScores);
    const npsMarca = calculateNPS(marcaScores);
    const npsCombined = calculateNPS([...cursoScores, ...marcaScores]);
    return { npsCurso, npsMarca, npsCombined };
  }, [filteredData]);

  // Gauge NPS agregado
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

  // Métricas de avaliação do professor
  const professorMetrics = React.useMemo(() => {
    const avg = (values: Array<number | null>) => {
      const valid = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (valid.length === 0) return null;
      return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1));
    };

    const relacionamento = avg(filteredData.map((d) => d.avaliacaoProfessor.relacionamento));
    const dominioAssunto = avg(filteredData.map((d) => d.avaliacaoProfessor.dominioAssunto));
    const aplicabilidade = avg(filteredData.map((d) => d.avaliacaoProfessor.aplicabilidade));
    const didatica = avg(filteredData.map((d) => d.avaliacaoProfessor.didaticaComunicacao));
    const pontualidade = avg(filteredData.map((d) => d.avaliacaoProfessor.pontualidade));

    let professorNome = '';
    if (filters.professores.length === 1) {
      professorNome = filters.professores[0];
    } else {
      const uniq = Array.from(new Set(filteredData.map((d) => d.professor).filter(Boolean)));
      if (uniq.length === 1) professorNome = uniq[0] as string;
    }

    return { relacionamento, dominioAssunto, aplicabilidade, didatica, pontualidade, professorNome };
  }, [filteredData, filters.professores]);

  // Comparativo entre turmas (simplificado: desativado se faltar lógica avançada)
  const turmasComparativo = React.useMemo(() => {
    return [] as Array<{
      title: string;
      subtitle: string;
      participantes: number;
      mediaGeral: number;
      npsTotal: number;
      focoTotal: number | null;
    }>;
  }, [filteredData]);

  // Feedbacks textuais (lista simples)
  const feedbackItems = React.useMemo(() => {
    const items: { text: string; turma: string; curso: string; isPromoter: boolean; isImprovement: boolean }[] = [];
    const push = (r: TransformedSurveyData, t?: string | null, opts?: { improvement?: boolean }) => {
      if (t && t.trim().length > 0) {
        const isPromoter = (r.nps.npsCurso ?? 0) >= 9 || (r.nps.npsMarca ?? 0) >= 9;
        items.push({ text: t.trim(), turma: r.turma, curso: r.curso, isPromoter, isImprovement: !!opts?.improvement });
      }
    };
    filteredData.forEach((r) => {
      push(r, r.autoavaliacao.feedback);
      push(r, r.avaliacaoProfessor.feedback);
      push(r, r.metodologia.feedback);
      // Campo de melhorias entra marcado como tal
      push(r, r.nps.melhorias, { improvement: true });
    });
    return items;
  }, [filteredData]);

  // Informações agregadas do(s) curso(s)
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
    if (filteredData.length === 0) return empty;

    const cursos = Array.from(new Set(filteredData.map((d) => (d.curso || '').trim()).filter(Boolean)));
    const courseLabel = cursos.length === 1 ? cursos[0] : `${cursos.length} cursos`;
    const turmas = Array.from(new Set(filteredData.map((d) => (d.turma || '').trim()).filter(Boolean)));

    // Períodos por turma
    const byTurma = new Map<string, TransformedSurveyData[]>();
    filteredData.forEach((r) => {
      const key = (r.turma || '').trim();
      if (!key) return;
      if (!byTurma.has(key)) byTurma.set(key, []);
      byTurma.get(key)!.push(r);
    });
    const ranges: string[] = Array.from(byTurma.entries())
      .map(([_, rows]) => {
        const { start, end } = deriveTrainingRange(rows);
        return formatDateRange(start, end);
      })
      .filter(Boolean) as string[];
    let periodosLabel = ranges.join(' • ');
    if (ranges.length > 2) periodosLabel = `${ranges.slice(0, 2).join(' e ')} +${ranges.length - 2}`;

    // NPS combinado e zona
    const cursoScores = filteredData.map((d) => d.nps.npsCurso);
    const marcaScores = filteredData.map((d) => d.nps.npsMarca);
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

    const mediaGeral = Number(kpiData.mediaGeral.toFixed(1));

    // Taxa de recomendação da marca (promoters / total)
    const npsMarca = calculateNPS(marcaScores);
    const recomendacaoMarcaPct = npsMarca.total > 0 ? Math.ceil((npsMarca.promoters / npsMarca.total) * 100) : 0;

    // Aproveitamento máximo (>=90%)
    const percents = filteredData
      .map((r) => r.nps.nivelAproveitamento || '')
      .map((txt) => {
        const m = txt.match(/(\d{1,3})\s*%/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((v): v is number => v !== null);
    const maxCount = percents.filter((v) => v >= 90).length;
    const aproveitamentoMaxPct = filteredData.length > 0 ? Math.ceil((maxCount / filteredData.length) * 100) : 0;

    // Extrair carga horária do nome do curso (ex.: "16 horas", "16h")
    const parseHours = (s: string) => {
      const m = s.match(/(\d{1,3})\s*(?:h(?:oras?)?|horas?)/i);
      return m ? parseInt(m[1], 10) : null;
    };

    let cargaHorariaLabel = '—';
    let totalHorasLabel = '—';

    if (cursos.length === 1) {
      const h = parseHours(cursos[0]);
      if (h && h > 0) {
        cargaHorariaLabel = `${h} horas`;
        const turmasCount = turmas.length || 1;
        totalHorasLabel = `${h * turmasCount} horas`;
      }
    } else if (cursos.length > 1) {
      const hs = cursos.map(parseHours).filter((x): x is number => x !== null);
      if (hs.length > 0) {
        const total = hs.reduce((a, b) => a + b, 0);
        totalHorasLabel = `${total} horas`;
      }
    }

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

  // Pontos de Atenção e Melhorias
  const improvementBlocks = React.useMemo(() => {
    const blocks: { title: string; label: 'Problema identificado' | 'Feedback'; feedback: string; suggestion: string }[] = [];
    if (filteredData.length === 0) return blocks;

    // 1) Menores médias por bloco
    const av = kpiData.avaliacaoMedia;
    const entries = [
      { key: 'autoavaliacao', label: 'Autoavaliação', value: av.autoavaliacao },
      { key: 'professor', label: 'Professor', value: av.professor },
      { key: 'metodologia', label: 'Metodologia', value: av.metodologia },
      { key: 'infraestrutura', label: 'Infraestrutura', value: av.infraestrutura },
    ].filter((e) => typeof e.value === 'number' && !isNaN(e.value as number)) as Array<{ key: string; label: string; value: number }>;
    const low = entries.filter((e) => e.value > 0 && e.value < 8.5).sort((a, b) => a.value - b.value).slice(0, 2);
    low.forEach((e) => {
      let suggestion = 'Elabore um plano de ação focado neste item para elevar a satisfação.';
      if (e.key === 'metodologia') suggestion = 'Revisar didática e dinâmica das atividades, incluindo mais prática, cases e materiais de apoio.';
      if (e.key === 'infraestrutura') suggestion = 'Checar salas, recursos multimídia e logística; garantir conforto e disponibilidade de equipamentos.';
      if (e.key === 'autoavaliacao') suggestion = 'Alinhar expectativas, reforçar pré-requisitos e oferecer trilhas complementares para nivelamento.';
      if (e.key === 'professor') {
        // Subdimensões do professor – destacar a mais baixa
        const subs: Array<{ k: string; v: number | null; label: string; tip: string }> = [
          { k: 'didatica', v: professorMetrics.didatica, label: 'Didática e Comunicação', tip: 'Promover variação de métodos, clareza nos objetivos e feedbacks.' },
          { k: 'aplicabilidade', v: professorMetrics.aplicabilidade, label: 'Aplicabilidade', tip: 'Conectar teoria à prática com exemplos e exercícios do contexto do público.' },
          { k: 'relacionamento', v: professorMetrics.relacionamento, label: 'Relacionamento', tip: 'Ampliar interação, acolhimento e espaço para dúvidas.' },
          { k: 'dominioAssunto', v: professorMetrics.dominioAssunto, label: 'Domínio do Assunto', tip: 'Reforçar materiais e preparar exemplos mais profundos.' },
          { k: 'pontualidade', v: professorMetrics.pontualidade, label: 'Pontualidade', tip: 'Revisar cronograma e checkpoints de tempo em sala.' },
        ];
        const valid = subs.filter((s) => typeof s.v === 'number');
        if (valid.length > 0) {
          const minSub = valid.reduce((m, c) => (c.v! < (m.v ?? Infinity) ? c : m));
          suggestion = `${minSub.label} abaixo do ideal. ${minSub.tip}`;
        } else {
          suggestion = 'Aprimorar didática, clareza e interação ao longo do curso.';
        }
      }
      blocks.push({
        title: `${e.label} com média de ${e.value.toFixed(1)}`,
        label: 'Problema identificado',
        feedback: `Média de ${e.label.toLowerCase()} (${e.value.toFixed(1)}) ficou abaixo da meta (8,5).`,
        suggestion,
      });
    });

    // 2) NPS abaixo de referência
    if (npsGauge.percent < 70) {
      blocks.push({
        title: 'NPS abaixo da zona de excelência',
        label: 'Problema identificado',
        feedback: `NPS combinado em ${npsGauge.percent}% (meta: 70%+).`,
        suggestion: 'Realizar ações de encantamento (pós-curso, comunicação personalizada, facilitação de depoimentos) e investigação de detratores.',
      });
    }

    // 3) Feedbacks de melhorias textuais (até 3)
    const improvements = Array.from(new Set(
      filteredData
        .map((r) => (r.nps.melhorias || '').trim())
        .filter((s) => s && s.length > 0)
    )).slice(0, 3);
    improvements.forEach((txt, i) => {
      blocks.push({
        title: `Melhoria sugerida #${i + 1}`,
        label: 'Feedback',
        feedback: txt,
        suggestion: 'Incorporar ao plano de ação e acompanhar a execução com responsáveis e prazos.',
      });
    });

    return blocks;
  }, [filteredData, kpiData, npsGauge, professorMetrics]);

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
      <div id="print-root" className="space-y-6">
        {/* Status dos dados e filtros */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between" data-print-section>
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

        {/* Painel de Filtros - mantido visível, também exportado */}
        <div data-print-section>
          <FilterPanel
            data={surveyData}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {filteredData.length > 0 ? (
          <>
            {/* KPIs */}
            <div data-print-section>
              <KPICards data={kpiData} />
            </div>

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-print-section>
              <NPSChart 
                npsCurso={npsData.npsCurso} 
                npsMarca={npsData.npsMarca} 
              />
              <RadarChart data={kpiData.avaliacaoMedia} />
            </div>

            {/* Comparativo entre Turmas */}
            {turmasComparativo.length >= 1 && (
              <Card className="border-primary/20 shadow-sm" data-print-section>
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
             <Card className="border-primary/20 shadow-sm" data-print-section>
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
            <Card className="border-primary/20 shadow-sm mt-6" data-print-section>
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
            <Card className="border-primary/20 shadow-sm mt-6" data-print-section>
              <div className="px-6 pt-6 pb-4 border-b">
                <h2 className="text-2xl font-semibold leading-none tracking-tight">Destaques dos Feedbacks</h2>
              </div>
              <CardContent className="pt-6">
                {feedbackItems.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto pr-1" data-print-expand>
                    <ul className="space-y-3">
                      {(isExporting ? feedbackItems.filter((f) => f.isPromoter && !f.isImprovement).slice(0, 5) : feedbackItems).map((item, idx) => (
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
            <Card className="border-primary/20 shadow-sm mt-6" data-print-section>
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
                            <div className="text-sm font-medium text-foreground">Ação sugerida:</div>
                            <div className="mt-1 text-sm text-foreground/90 bg-background/70 rounded-md px-3 py-2">{blk.suggestion}</div>
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
            <Card className="border-primary/20 shadow-sm mt-6" data-print-section>
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
                  Nenhum resultado encontrado para os filtros aplicados.
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
