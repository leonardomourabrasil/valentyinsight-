import { z } from "zod";

// Schema para validação dos dados do CSV da pesquisa de satisfação Valenty
export const SurveyResponseSchema = z.object({
  // Identificação e metadados
  "Submission ID": z.string(),
  "Respondent ID": z.string(),
  "Submitted at": z.string(),
  "Selecione a turma que você está estudando.": z.string(),
  "Qual curso você deseja avaliar?": z.string(),
  "Selecione o(a) professor(a) responsável pelo curso:": z.string(),
  "Data de Início do Curso": z.string(),
  "Data de Término do Curso": z.string(),

  // Autoavaliação do Aluno (0-10)
  "1. MINHA PRESENÇA E PARTICIPAÇÃO NO CURSO": z.coerce.number().min(0).max(10).optional(),
  "2. MINHA POSTURA ACADÊMICA PERANTE A TURMA": z.coerce.number().min(0).max(10).optional(),
  "3. USO DE APARELHOS ELETRÔNICOS": z.coerce.number().min(0).max(10).optional(),
  "4. MEU NÍVEL DE APRENDIZADO E AUTODESENVOLVIMENTO": z.coerce.number().min(0).max(10).optional(),
  "5. Escreva seu autofeedback sobre sua participação.": z.string().optional(),

  // Avaliação do Professor (0-10)
  "1. RELACIONAMENTO COM A TURMA": z.coerce.number().min(0).max(10).optional(),
  "2. DOMÍNIO DO ASSUNTO - CONHECIMENTO": z.coerce.number().min(0).max(10).optional(),
  "3. APLICABILIDADE DOS CONTEÚDOS ABORDADOS EM SALA": z.coerce.number().min(0).max(10).optional(),
  "4. DIDÁTICA E COMUNICAÇÃO": z.coerce.number().min(0).max(10).optional(),
  "5. PONTUALIDADE DO PROFESSOR": z.coerce.number().min(0).max(10).optional(),
  "7. Escreva seu feedback sobre o(a) professor(a).": z.string().optional(),

  // Metodologia (0-10)
  "1. A metodologia de ensino utilizada no curso estimulou a minha participação ativa e colaborativa nas atividades.": z.coerce.number().min(0).max(10).optional(),
  "2. A metodologia de ensino utilizada no curso facilitou a aplicação prática dos conhecimentos adquiridos em contextos reais ou simulados.": z.coerce.number().min(0).max(10).optional(),
  "3. Escreva seu feedback sobre a metodologia de ensino.": z.string().optional(),

  // Estrutura/Infraestrutura (0-10)
  "1. EQUIPE DE APOIO": z.coerce.number().min(0).max(10).optional(),
  "2. ESTRUTURA DA SALA DE AULA": z.coerce.number().min(0).max(10).optional(),
  "3. CONFORTO E CLIMATIZAÇÃO DO AMBIENTE": z.coerce.number().min(0).max(10).optional(),

  // NPS e Aproveitamento
  "1. Qual foi o seu nível de aproveitamento no curso?": z.string().optional(),
  "2. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar este curso para um colega amigo ou familiar? (NPS da Imersão)": z.coerce.number().min(0).max(10).optional(),
  "3. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar o Instituto Valente? (NPS da Marca)": z.coerce.number().min(0).max(10).optional(),
  "4. Como podemos melhorar?": z.string().optional(),
  "E-mail": z.string().email().optional().or(z.literal("")),
});

export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;

// Schema mais flexível para parsing inicial
export const FlexibleSurveySchema = z.record(z.string(), z.any());

// Tipos para dados transformados
export interface TransformedSurveyData {
  id: string;
  respondentId: string;
  submittedAt: Date;
  turma: string;
  curso: string;
  professor: string;
  dataInicio: Date | null;
  dataTermino: Date | null;
  autoavaliacao: {
    presencaParticipacao: number | null;
    posturaAcademica: number | null;
    usoAparelhos: number | null;
    nivelAprendizado: number | null;
    feedback: string | null;
  };
  avaliacaoProfessor: {
    relacionamento: number | null;
    dominioAssunto: number | null;
    aplicabilidade: number | null;
    didaticaComunicacao: number | null;
    pontualidade: number | null;
    feedback: string | null;
  };
  metodologia: {
    participacaoAtiva: number | null;
    aplicacaoPratica: number | null;
    feedback: string | null;
  };
  infraestrutura: {
    equipeApoio: number | null;
    estruturaSala: number | null;
    confortoClimatizacao: number | null;
  };
  nps: {
    npsCurso: number | null;
    npsMarca: number | null;
    nivelAproveitamento: string | null;
    melhorias: string | null;
  };
  email: string | null;
}

// Aliases para cabeçalhos similares
export const COLUMN_ALIASES: Record<string, string> = {
  "turma": "Selecione a turma que você está estudando.",
  "curso": "Qual curso você deseja avaliar?",
  "professor": "Selecione o(a) professor(a) responsável pelo curso:",
  "data_inicio": "Data de Início do Curso",
  "data_termino": "Data de Término do Curso",
  "nps_curso": "2. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar este curso para um colega amigo ou familiar? (NPS da Imersão)",
  "nps_marca": "3. Em uma escala de 0 a 10 qual é a probabilidade de você recomendar o Instituto Valente? (NPS da Marca)",
  "aproveitamento": "1. Qual foi o seu nível de aproveitamento no curso?",
  "melhorias": "4. Como podemos melhorar?",
};