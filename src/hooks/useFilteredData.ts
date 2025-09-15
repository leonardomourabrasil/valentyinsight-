import { useMemo } from 'react';
import { TransformedSurveyData } from '@/lib/csvSchema';
import { FilterState } from '@/components/FilterPanel';

export function useFilteredData(data: TransformedSurveyData[], filters: FilterState) {
  return useMemo(() => {
    return data.filter(response => {
      // Filtro por turma
      if (filters.turmas.length > 0 && !filters.turmas.includes(response.turma)) {
        return false;
      }

      // Filtro por curso
      if (filters.cursos.length > 0 && !filters.cursos.includes(response.curso)) {
        return false;
      }

      // Filtro por professor
      if (filters.professores.length > 0 && !filters.professores.includes(response.professor)) {
        return false;
      }

      // Filtro por data
      if (filters.dataInicio && response.submittedAt < filters.dataInicio) {
        return false;
      }
      if (filters.dataFim && response.submittedAt > filters.dataFim) {
        return false;
      }

      // Filtro por nível de aproveitamento
      if (filters.nivelAproveitamento.length > 0 && 
          response.nps.nivelAproveitamento &&
          !filters.nivelAproveitamento.includes(response.nps.nivelAproveitamento)) {
        return false;
      }

      // Filtro por faixa de pontuação
      if (filters.scoreMin > 0 || filters.scoreMax < 10) {
        const allScores = [
          response.autoavaliacao.presencaParticipacao,
          response.autoavaliacao.posturaAcademica,
          response.autoavaliacao.usoAparelhos,
          response.autoavaliacao.nivelAprendizado,
          response.avaliacaoProfessor.relacionamento,
          response.avaliacaoProfessor.dominioAssunto,
          response.avaliacaoProfessor.aplicabilidade,
          response.avaliacaoProfessor.didaticaComunicacao,
          response.avaliacaoProfessor.pontualidade,
          response.metodologia.participacaoAtiva,
          response.metodologia.aplicacaoPratica,
          response.infraestrutura.equipeApoio,
          response.infraestrutura.estruturaSala,
          response.infraestrutura.confortoClimatizacao,
          response.nps.npsCurso,
          response.nps.npsMarca,
        ].filter((score): score is number => score !== null);

        const hasScoreInRange = allScores.some(score => 
          score >= filters.scoreMin && score <= filters.scoreMax
        );

        if (!hasScoreInRange) {
          return false;
        }
      }

      // Filtro por blocos específicos
      if (filters.blocos.length > 0) {
        const blocosDisponiveis = {
          autoavaliacao: [
            response.autoavaliacao.presencaParticipacao,
            response.autoavaliacao.posturaAcademica,
            response.autoavaliacao.usoAparelhos,
            response.autoavaliacao.nivelAprendizado,
          ].some(score => score !== null),
          professor: [
            response.avaliacaoProfessor.relacionamento,
            response.avaliacaoProfessor.dominioAssunto,
            response.avaliacaoProfessor.aplicabilidade,
            response.avaliacaoProfessor.didaticaComunicacao,
            response.avaliacaoProfessor.pontualidade,
          ].some(score => score !== null),
          metodologia: [
            response.metodologia.participacaoAtiva,
            response.metodologia.aplicacaoPratica,
          ].some(score => score !== null),
          infraestrutura: [
            response.infraestrutura.equipeApoio,
            response.infraestrutura.estruturaSala,
            response.infraestrutura.confortoClimatizacao,
          ].some(score => score !== null),
        };

        const temBlocoSelecionado = filters.blocos.some(bloco => 
          blocosDisponiveis[bloco as keyof typeof blocosDisponiveis]
        );

        if (!temBlocoSelecionado) {
          return false;
        }
      }

      // Filtro por texto nos feedbacks
      if (filters.buscarTexto.trim()) {
        const textosBusca = [
          response.autoavaliacao.feedback,
          response.avaliacaoProfessor.feedback,
          response.metodologia.feedback,
          response.nps.melhorias,
        ].filter(Boolean).join(' ').toLowerCase();

        const termoBusca = filters.buscarTexto.toLowerCase();
        if (!textosBusca.includes(termoBusca)) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);
}