import { TransformedSurveyData, SurveyResponse } from "./csvSchema";

// Função para calcular NPS
export function calculateNPS(scores: (number | null)[]): {
  nps: number;
  promoters: number;
  detractors: number;
  neutros: number;
  total: number;
} {
  const validScores = scores.filter((score): score is number => score !== null);
  const total = validScores.length;
  
  if (total === 0) {
    return { nps: 0, promoters: 0, detractors: 0, neutros: 0, total: 0 };
  }

  const promoters = validScores.filter(score => score >= 9).length;
  const detractors = validScores.filter(score => score <= 6).length;
  const neutros = validScores.filter(score => score >= 7 && score <= 8).length;

  const nps = ((promoters - detractors) / total) * 100;

  return {
    nps: Math.ceil(nps),
    promoters,
    detractors,
    neutros,
    total,
  };
}

// Função para transformar dados brutos em estrutura normalizada
export function transformSurveyData(rawData: any[]): TransformedSurveyData[] {
  return rawData.map((row, index) => {
    // Parse de datas
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      try {
        const cleanDate = String(dateStr).trim();
        // YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
        const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const [, y, m, d] = isoMatch;
          const dt = new Date(Number(y), Number(m) - 1, Number(d));
          return isNaN(dt.getTime()) ? null : dt;
        }
        // DD/MM/YYYY
        const brMatch = cleanDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (brMatch) {
          const [, d, m, y] = brMatch;
          const dt = new Date(Number(y), Number(m) - 1, Number(d));
          return isNaN(dt.getTime()) ? null : dt;
        }
        // DD-MM-YYYY
        const dashMatch = cleanDate.match(/^(\d{2})-(\d{2})-(\d{4})/);
        if (dashMatch) {
          const [, d, m, y] = dashMatch;
          const dt = new Date(Number(y), Number(m) - 1, Number(d));
          return isNaN(dt.getTime()) ? null : dt;
        }
        const dt = new Date(cleanDate);
        return isNaN(dt.getTime()) ? null : dt;
      } catch {
        return null;
      }
    };

    // Parse de números de 0-10
    const parseScore = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      // aceita vírgula decimal "9,5" => 9.5
      const normalized = typeof value === 'string' ? value.replace(',', '.').trim() : value;
      const num = Number(normalized);
      if (isNaN(num)) return null;
      return Math.min(Math.max(num, 0), 10);
    };

    // Helpers para correspondência resiliente de cabeçalhos
    const normalizeHeader = (s: string) =>
      s?.toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s,–—_-]+/g, ' ')
        .replace(/[()]/g, '')
        .trim();

    const getField = (r: any, candidates: string[]) => {
      const keys = Object.keys(r);
      const normMap = new Map(keys.map(k => [normalizeHeader(k), k]));
      for (const c of candidates) {
        const cn = normalizeHeader(c);
        if (normMap.has(cn)) return r[normMap.get(cn)!];
      }
      // tentativa por correspondência parcial
      for (const c of candidates) {
        const cn = normalizeHeader(c);
        for (const [nk, original] of normMap.entries()) {
          if (nk.includes(cn) || cn.includes(nk)) {
            return r[original];
          }
        }
      }
      return undefined;
    };

    const getNumber = (r: any, candidates: string[]) => {
      const v = getField(r, candidates);
      return parseScore(v);
    };

    const getText = (r: any, candidates: string[]) => {
      const v = getField(r, candidates);
      return (v === undefined || v === null || v === '') ? null : String(v);
    };

    const submittedAtRaw = row["Submitted at"] || "";
    let submittedAt: Date;
    try {
      submittedAt = new Date(submittedAtRaw);
      if (isNaN(submittedAt.getTime())) {
        submittedAt = new Date();
      }
    } catch {
      submittedAt = new Date();
    }

    // Aliases adicionais para perguntas do Professor
    const PROF_RELACIONAMENTO = [
      "1. RELACIONAMENTO COM A TURMA",
      "RELACIONAMENTO COM A TURMA",
      "Relacionamento com a Turma",
      "Relacionamento com a turma",
      "Relacionamento (Professor)",
      "Professor - Relacionamento com a Turma"
    ];

    const PROF_DOMINIO = [
      "2. DOMÍNIO DO ASSUNTO - CONHECIMENTO",
      "DOMÍNIO DO ASSUNTO - CONHECIMENTO",
      "Domínio do Assunto",
      "Domínio do Assunto - Conhecimento",
      "Conhecimento do Professor"
    ];

    const PROF_APLICABILIDADE = [
      "3. APLICABILIDADE DOS CONTEÚDOS ABORDADOS EM SALA",
      "APLICABILIDADE DOS CONTEÚDOS ABORDADOS EM SALA",
      "Aplicabilidade dos Conteúdos",
      "Aplicabilidade"
    ];

    const PROF_DIDATICA = [
      "4. DIDÁTICA E COMUNICAÇÃO",
      "DIDÁTICA E COMUNICAÇÃO",
      "Didática e Comunicação",
      "Didática",
      "Comunicação"
    ];

    const PROF_PONTUALIDADE = [
      "5. PONTUALIDADE DO PROFESSOR",
      "PONTUALIDADE DO PROFESSOR",
      "Pontualidade do Professor",
      "Pontualidade"
    ];

    // Aliases adicionais para NPS
    const NPS_CURSO = [
      "2. Em uma escala de 0 a 10, qual é a probabilidade de você recomendar este curso para um colega, amigo ou familiar? (NPS da Imersão)",
      "2. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar este curso para um colega amigo ou familiar? (NPS da Imersão)",
      // Variações sem o sufixo e com/sem vírgulas
      "2. Em uma escala de 0 a 10, qual é a probabilidade de você recomendar este curso para um colega, amigo ou familiar?",
      "2. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar este curso para um colega amigo ou familiar?",
      // Substrings robustas
      "probabilidade de você recomendar este curso",
      "probabilidade de recomendar este curso",
      "recomendar este curso",
      // Short names
      "NPS do Curso",
      "NPS Curso",
      "NPS da Imersão",
      "Probabilidade de recomendar o curso",
    ];

    const NPS_MARCA = [
      "3. Em uma escala de 0 a 10, qual é a probabilidade de você recomendar o Instituto Valente? (NPS da Marca)",
      "3. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar o Instituto Valente? (NPS da Marca)",
      // Variações sem o sufixo e com/sem vírgulas
      "3. Em uma escala de 0 a 10, qual é a probabilidade de você recomendar o Instituto Valente para um colega, amigo ou familiar?",
      "3. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar o Instituto Valente para um colega amigo ou familiar?",
      // Substrings robustas
      "probabilidade de você recomendar o instituto valente",
      "probabilidade de recomendar o instituto valente",
      "recomendar o instituto valente",
      // Short names
      "NPS da Marca",
      "NPS Marca",
      "Probabilidade de recomendar a marca",
      "Probabilidade de recomendar o Instituto Valente"
    ];

    return {
      id: row["Submission ID"] || `response_${index}`,
      respondentId: row["Respondent ID"] || `respondent_${index}`,
      submittedAt,
      turma: row["Selecione a turma que você está estudando."] || "",
      curso: row["Qual curso você deseja avaliar?"] || "",
      professor: row["Selecione o(a) professor(a) responsável pelo curso:"] || "",
      dataInicio: parseDate(row["Data de Início do Curso"]),
      dataTermino: parseDate(row["Data de Término do Curso"]),
      
      autoavaliacao: {
        presencaParticipacao: parseScore(row["1. MINHA PRESENÇA E PARTICIPAÇÃO NO CURSO"]),
        posturaAcademica: parseScore(row["2. MINHA POSTURA ACADÊMICA PERANTE A TURMA"]),
        usoAparelhos: parseScore(row["3. USO DE APARELHOS ELETRÔNICOS"]),
        nivelAprendizado: parseScore(row["4. MEU NÍVEL DE APRENDIZADO E AUTODESENVOLVIMENTO"]),
        feedback: row["5. Escreva seu autofeedback sobre sua participação."] || null,
      },

      avaliacaoProfessor: {
        relacionamento: getNumber(row, PROF_RELACIONAMENTO),
        dominioAssunto: getNumber(row, PROF_DOMINIO),
        aplicabilidade: getNumber(row, PROF_APLICABILIDADE),
        didaticaComunicacao: getNumber(row, PROF_DIDATICA),
        pontualidade: getNumber(row, PROF_PONTUALIDADE),
        feedback: getText(row, ["7. Escreva seu feedback sobre o(a) professor(a)."]),
      },

      metodologia: {
        participacaoAtiva: parseScore(row["1. A metodologia de ensino utilizada no curso estimulou a minha participação ativa e colaborativa nas atividades."]),
        aplicacaoPratica: parseScore(row["2. A metodologia de ensino utilizada no curso facilitou a aplicação prática dos conhecimentos adquiridos em contextos reais ou simulados."]),
        feedback: row["3. Escreva seu feedback sobre a metodologia de ensino."] || null,
      },

      infraestrutura: {
        equipeApoio: parseScore(row["1. EQUIPE DE APOIO"]),
        estruturaSala: parseScore(row["2. ESTRUTURA DA SALA DE AULA"]),
        confortoClimatizacao: parseScore(row["3. CONFORTO E CLIMATIZAÇÃO DO AMBIENTE"]),
      },

      nps: {
        npsCurso: getNumber(row, NPS_CURSO),
        npsMarca: getNumber(row, NPS_MARCA),
        nivelAproveitamento: getText(row, ["1. Qual foi o seu nível de aproveitamento no curso?"]),
        melhorias: getText(row, ["4. Como podemos melhorar?"]),
      },

      email: row["E-mail"] || null,
    };
  });
}

// Função para calcular médias por bloco
export function calculateBlockAverages(data: TransformedSurveyData[]) {
  const autoavaliacao = data.map(d => [
    d.autoavaliacao.presencaParticipacao,
    d.autoavaliacao.posturaAcademica,
    d.autoavaliacao.usoAparelhos,
    d.autoavaliacao.nivelAprendizado,
  ].filter(v => v !== null)).flat();

  const professor = data.map(d => [
    d.avaliacaoProfessor.relacionamento,
    d.avaliacaoProfessor.dominioAssunto,
    d.avaliacaoProfessor.aplicabilidade,
    d.avaliacaoProfessor.didaticaComunicacao,
    d.avaliacaoProfessor.pontualidade,
  ].filter(v => v !== null)).flat();

  const metodologia = data.map(d => [
    d.metodologia.participacaoAtiva,
    d.metodologia.aplicacaoPratica,
  ].filter(v => v !== null)).flat();

  const infraestrutura = data.map(d => [
    d.infraestrutura.equipeApoio,
    d.infraestrutura.estruturaSala,
    d.infraestrutura.confortoClimatizacao,
  ].filter(v => v !== null)).flat();

  const calculateAverage = (scores: number[]) => 
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const ceil1 = (x: number) => Math.ceil(x * 10) / 10;

  return {
    autoavaliacao: ceil1(calculateAverage(autoavaliacao)),
    professor: ceil1(calculateAverage(professor)),
    metodologia: ceil1(calculateAverage(metodologia)),
    infraestrutura: ceil1(calculateAverage(infraestrutura)),
  };
}

// Função para extrair texto para análise de sentimento
export function extractFeedbackText(data: TransformedSurveyData[]): string[] {
  const allFeedback: string[] = [];
  
  data.forEach(response => {
    if (response.autoavaliacao.feedback) {
      allFeedback.push(response.autoavaliacao.feedback);
    }
    if (response.avaliacaoProfessor.feedback) {
      allFeedback.push(response.avaliacaoProfessor.feedback);
    }
    if (response.metodologia.feedback) {
      allFeedback.push(response.metodologia.feedback);
    }
    if (response.nps.melhorias) {
      allFeedback.push(response.nps.melhorias);
    }
  });

  return allFeedback.filter(text => text && text.trim().length > 0);
}

// Função para gerar dados de série temporal (por semana)
export function generateTimeSeriesData(data: TransformedSurveyData[]) {
  // Agrupa por semana
  const weeklyData = new Map<string, TransformedSurveyData[]>();
  
  data.forEach(response => {
    const weekStart = getWeekStart(response.submittedAt);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, []);
    }
    weeklyData.get(weekKey)!.push(response);
  });

  // Converte para array ordenado
  return Array.from(weeklyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, responses]) => {
      const blockAverages = calculateBlockAverages(responses);
      const npsCurso = calculateNPS(responses.map(r => r.nps.npsCurso));
      const npsMarca = calculateNPS(responses.map(r => r.nps.npsMarca));
      
      return {
        date,
        semana: formatWeekLabel(new Date(date)),
        respondentes: responses.length,
        ...blockAverages,
        npsCurso: npsCurso.nps,
        npsMarca: npsMarca.nps,
      };
    });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  return new Date(d.setDate(diff));
}

function formatWeekLabel(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'America/Sao_Paulo'
  };
  return date.toLocaleDateString('pt-BR', options);
}