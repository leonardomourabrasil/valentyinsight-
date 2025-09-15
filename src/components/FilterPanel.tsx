import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  X, 
  ChevronDown, 
  RotateCcw,
  Calendar,
  GraduationCap,
  Users,
  BookOpen,
  Search
} from 'lucide-react';
import { TransformedSurveyData } from '@/lib/csvSchema';

export interface FilterState {
  turmas: string[];
  cursos: string[];
  professores: string[];
  dataInicio?: Date;
  dataFim?: Date;
  blocos: string[];
  scoreMin: number;
  scoreMax: number;
  nivelAproveitamento: string[];
  buscarTexto: string;
}

interface FilterPanelProps {
  data: TransformedSurveyData[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export function FilterPanel({ data, filters, onFiltersChange, className }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Extrair valores únicos dos dados
  const turmasUnicas = [...new Set(data.map(d => d.turma).filter(Boolean))].sort();
  const cursosUnicos = [...new Set(data.map(d => d.curso).filter(Boolean))].sort();
  const professoresUnicos = [...new Set(data.map(d => d.professor).filter(Boolean))].sort();
  const niveisAproveitamento = [...new Set(data.map(d => d.nps.nivelAproveitamento).filter(Boolean))].sort();

  const blocosDisponiveis = [
    { id: 'autoavaliacao', label: 'Autoavaliação', icon: GraduationCap },
    { id: 'professor', label: 'Professor', icon: Users },
    { id: 'metodologia', label: 'Metodologia', icon: BookOpen },
    { id: 'infraestrutura', label: 'Infraestrutura', icon: Calendar },
  ];

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      turmas: [],
      cursos: [],
      professores: [],
      blocos: [],
      scoreMin: 0,
      scoreMax: 10,
      nivelAproveitamento: [],
      buscarTexto: '',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.turmas.length > 0) count++;
    if (filters.cursos.length > 0) count++;
    if (filters.professores.length > 0) count++;
    if (filters.dataInicio || filters.dataFim) count++;
    if (filters.blocos.length > 0) count++;
    if (filters.scoreMin > 0 || filters.scoreMax < 10) count++;
    if (filters.nivelAproveitamento.length > 0) count++;
    if (filters.buscarTexto.trim()) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <CardTitle className="text-lg">Filtros</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllFilters();
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Busca por Texto */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Buscar nos Feedbacks</span>
              </Label>
              <Input
                placeholder="Digite para buscar em comentários e feedbacks..."
                value={filters.buscarTexto}
                onChange={(e) => updateFilter('buscarTexto', e.target.value)}
              />
            </div>

            {/* Filtros por Categorias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Turmas */}
              <div className="space-y-2">
                <Label>Turmas ({turmasUnicas.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {turmasUnicas.map(turma => (
                    <div key={turma} className="flex items-center space-x-2">
                      <Checkbox
                        id={`turma-${turma}`}
                        checked={filters.turmas.includes(turma)}
                        onCheckedChange={() => toggleArrayFilter('turmas', turma)}
                      />
                      <Label 
                        htmlFor={`turma-${turma}`} 
                        className="text-sm cursor-pointer truncate"
                        title={turma}
                      >
                        {turma.length > 30 ? `${turma.substring(0, 30)}...` : turma}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cursos */}
              <div className="space-y-2">
                <Label>Cursos ({cursosUnicos.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {cursosUnicos.map(curso => (
                    <div key={curso} className="flex items-center space-x-2">
                      <Checkbox
                        id={`curso-${curso}`}
                        checked={filters.cursos.includes(curso)}
                        onCheckedChange={() => toggleArrayFilter('cursos', curso)}
                      />
                      <Label 
                        htmlFor={`curso-${curso}`} 
                        className="text-sm cursor-pointer truncate"
                        title={curso}
                      >
                        {curso.length > 30 ? `${curso.substring(0, 30)}...` : curso}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professores */}
              <div className="space-y-2">
                <Label>Professores ({professoresUnicos.length})</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {professoresUnicos.map(professor => (
                    <div key={professor} className="flex items-center space-x-2">
                      <Checkbox
                        id={`professor-${professor}`}
                        checked={filters.professores.includes(professor)}
                        onCheckedChange={() => toggleArrayFilter('professores', professor)}
                      />
                      <Label 
                        htmlFor={`professor-${professor}`} 
                        className="text-sm cursor-pointer"
                      >
                        {professor}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Blocos de Avaliação */}
            <div className="space-y-2">
              <Label>Blocos de Avaliação</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {blocosDisponiveis.map(bloco => {
                  const Icon = bloco.icon;
                  return (
                    <div key={bloco.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bloco-${bloco.id}`}
                        checked={filters.blocos.includes(bloco.id)}
                        onCheckedChange={() => toggleArrayFilter('blocos', bloco.id)}
                      />
                      <Label 
                        htmlFor={`bloco-${bloco.id}`} 
                        className="text-sm cursor-pointer flex items-center space-x-1"
                      >
                        <Icon className="w-3 h-3" />
                        <span>{bloco.label}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Range de Pontuação */}
            <div className="space-y-2">
              <Label>Faixa de Pontuação (0-10)</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="score-min" className="text-xs">Min:</Label>
                  <Input
                    id="score-min"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.scoreMin}
                    onChange={(e) => updateFilter('scoreMin', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="score-max" className="text-xs">Max:</Label>
                  <Input
                    id="score-max"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.scoreMax}
                    onChange={(e) => updateFilter('scoreMax', parseFloat(e.target.value) || 10)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Nível de Aproveitamento */}
            {niveisAproveitamento.length > 0 && (
              <div className="space-y-2">
                <Label>Nível de Aproveitamento</Label>
                <div className="space-y-2">
                  {niveisAproveitamento.map(nivel => (
                    <div key={nivel} className="flex items-center space-x-2">
                      <Checkbox
                        id={`nivel-${nivel}`}
                        checked={filters.nivelAproveitamento.includes(nivel)}
                        onCheckedChange={() => toggleArrayFilter('nivelAproveitamento', nivel)}
                      />
                      <Label 
                        htmlFor={`nivel-${nivel}`} 
                        className="text-sm cursor-pointer"
                      >
                        {nivel}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}