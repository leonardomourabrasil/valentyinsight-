import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Eye } from 'lucide-react';
import { FlexibleSurveySchema } from '@/lib/csvSchema';
import { transformSurveyData } from '@/lib/transform';
import { TransformedSurveyData } from '@/lib/csvSchema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

interface CSVUploaderProps {
  onDataLoaded: (data: TransformedSurveyData[]) => void;
}

interface ParseResult {
  valid: any[];
  invalid: any[];
  errors: string[];
  preview: any[];
  headers: string[];
  totalRows: number;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const processCSVText = useCallback((text: string) => {
    setIsProcessing(true);
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const { data, errors: parseErrors } = results as any;
          const headers = (results as any).meta?.fields || [];

          const valid: any[] = [];
          const invalid: any[] = [];
          const errors: string[] = [];

          if (parseErrors && parseErrors.length > 0) {
            errors.push(...parseErrors.map((e: any) => `Linha ${e.row}: ${e.message}`));
          }

          (data as any[]).forEach((row: any, index: number) => {
            try {
              const validated = FlexibleSurveySchema.parse(row);
              valid.push(validated);
            } catch (error) {
              invalid.push({ ...row, _rowIndex: index + 1 });
              errors.push(`Linha ${index + 1}: Dados inválidos ou incompletos`);
            }
          });

          const result: ParseResult = {
            valid,
            invalid,
            errors,
            preview: (data as any[]).slice(0, 5),
            headers,
            totalRows: (data as any[]).length,
          };

          setParseResult(result);
        } catch (error) {
          setParseResult({
            valid: [],
            invalid: [],
            errors: ['Erro ao processar conteúdo CSV: ' + (error instanceof Error ? error.message : 'Erro desconhecido')],
            preview: [],
            headers: [],
            totalRows: 0,
          });
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setParseResult({
          valid: [],
          invalid: [],
          errors: ['Erro ao ler conteúdo CSV: ' + error.message],
          preview: [],
          headers: [],
          totalRows: 0,
        });
        setIsProcessing(false);
      }
    });
  }, []);

  const processCSV = useCallback((file: File) => {
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const { data, errors: parseErrors } = results;
          const headers = results.meta.fields || [];
          
          // Validação e separação de dados válidos/inválidos
          const valid: any[] = [];
          const invalid: any[] = [];
          const errors: string[] = [];

          if (parseErrors.length > 0) {
            errors.push(...parseErrors.map(e => `Linha ${e.row}: ${e.message}`));
          }

          data.forEach((row: any, index) => {
            try {
              // Validação flexível - aceita dados mesmo com campos faltando
              const validated = FlexibleSurveySchema.parse(row);
              valid.push(validated);
            } catch (error) {
              invalid.push({ ...row, _rowIndex: index + 1 });
              errors.push(`Linha ${index + 1}: Dados inválidos ou incompletos`);
            }
          });

          const result: ParseResult = {
            valid,
            invalid,
            errors,
            preview: data.slice(0, 5), // Primeiras 5 linhas para preview
            headers,
            totalRows: data.length,
          };

          setParseResult(result);
        } catch (error) {
          setParseResult({
            valid: [],
            invalid: [],
            errors: ['Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido')],
            preview: [],
            headers: [],
            totalRows: 0,
          });
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setParseResult({
          valid: [],
          invalid: [],
          errors: ['Erro ao ler arquivo: ' + error.message],
          preview: [],
          headers: [],
          totalRows: 0,
        });
        setIsProcessing(false);
      }
    });
  }, []);

  const processXLSX = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Converte a planilha para CSV, preservando cabeçalhos
      const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });
      processCSVText(csv);
    } catch (e: any) {
      setParseResult({
        valid: [],
        invalid: [],
        errors: [
          'Não foi possível ler o arquivo .xlsx. Verifique se ele está válido e tente novamente.',
          e?.message ? `Detalhe: ${e.message}` : ''
        ].filter(Boolean),
        preview: [],
        headers: [],
        totalRows: 0,
      });
      setIsProcessing(false);
    }
  }, [processCSVText]);

  const handleLoadFromPublic = useCallback(async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/external-data.csv', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      processCSVText(text);
    } catch (e: any) {
      setParseResult({
        valid: [],
        invalid: [],
        errors: [
          'Não foi possível carregar /external-data.csv do diretório public. Certifique-se de que o arquivo existe e recarregue a página.',
          e?.message ? `Detalhe: ${e.message}` : ''
        ].filter(Boolean),
        preview: [],
        headers: [],
        totalRows: 0,
      });
      setIsProcessing(false);
    }
  }, [processCSVText]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
        processXLSX(file);
      } else {
        processCSV(file);
      }
    }
  }, [processCSV, processXLSX]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.csv']
    },
    maxFiles: 1,
  });

  const handleConfirmData = () => {
    if (parseResult && parseResult.valid.length > 0) {
      try {
        const transformedData = transformSurveyData(parseResult.valid);
        onDataLoaded(transformedData);
        
        // Salva no localStorage para persistência
        localStorage.setItem('valenty_survey_data', JSON.stringify(transformedData));
      } catch (error) {
        console.error('Erro ao transformar dados:', error);
      }
    }
  };

  const clearData = () => {
    setParseResult(null);
    setShowPreview(false);
    localStorage.removeItem('valenty_survey_data');
  };

  // Normalização para comparação resiliente de cabeçalhos
  const normalize = (s: string) =>
    s?.toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s,–—_-]+/g, ' ')
      .replace(/[()]/g, '')
      .trim();

  // Definição de colunas esperadas com aliases/candidatos
  const expectedColumns = [
    { label: 'Turma', candidates: ['selecione a turma que voce esta estudando'] },
    { label: 'Curso', candidates: ['qual curso voce deseja avaliar'] },
    { label: 'Professor', candidates: ['selecione o(a) professor(a) responsavel pelo curso', 'selecione o professor responsavel'] },

    // Bloco Professor
    { label: 'Professor - Relacionamento', candidates: ['relacionamento com a turma'] },
    { label: 'Professor - Dominio do Assunto', candidates: ['dominio do assunto', 'conhecimento do professor'] },
    { label: 'Professor - Aplicabilidade', candidates: ['aplicabilidade dos conteudos', 'aplicabilidade'] },
    { label: 'Professor - Didatica e Comunicacao', candidates: ['didatica e comunicacao', 'didatica', 'comunicacao'] },
    { label: 'Professor - Pontualidade', candidates: ['pontualidade do professor', 'pontualidade'] },

    // NPS
    { label: 'NPS do Curso', candidates: ['nps do curso', 'nps da imersao', 'probabilidade de recomendar este curso', 'probabilidade de voce recomendar este curso'] },
    { label: 'NPS da Marca', candidates: ['nps da marca', 'probabilidade de recomendar o instituto valente', 'probabilidade de voce recomendar o instituto valente'] },
  ];

  const getColumnStatus = (headers: string[]) => {
    const normHeaders = headers.map(normalize);

    const isCandidateFound = (candidates: string[]) => {
      return candidates.some(c => {
        const cn = normalize(c);
        return normHeaders.some(h => h.includes(cn) || cn.includes(h));
      });
    };

    const foundEntries = expectedColumns.filter(ec => isCandidateFound(ec.candidates));
    const missing = expectedColumns
      .filter(ec => !foundEntries.includes(ec))
      .map(ec => ec.label);

    return { found: foundEntries.length, total: expectedColumns.length, missing };
  };

  if (!parseResult) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload da Pesquisa de Satisfação</span>
          </CardTitle>
          <CardDescription>
            Faça upload do arquivo CSV com os dados da pesquisa para gerar o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-border hover:border-primary/50 hover:bg-accent-light/50'
              }
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              {isDragActive ? (
                <p className="text-lg font-medium text-primary">
                  Solte o arquivo aqui...
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    {isProcessing ? 'Processando arquivo...' : 'Arraste o arquivo CSV ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                  Aceita arquivos .csv e .xlsx (máximo 20MB)
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-accent-light/30 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">Formato esperado:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Dados da pesquisa de satisfação Valenty</li>
              <li>• Colunas: Turma, Curso, Professor, Notas (0-10), NPS, Feedbacks</li>
              <li>• Encoding UTF-8 recomendado</li>
            </ul>
            <div>
              <Button variant="outline" onClick={handleLoadFromPublic} disabled={isProcessing}>
                Carregar do Link Público (public/external-data.csv)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const columnStatus = getColumnStatus(parseResult.headers);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status do Parse */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <CardTitle>Resultado do Parse</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={clearData}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{parseResult.valid.length}</div>
              <div className="text-sm text-muted-foreground">Registros Válidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{parseResult.invalid.length}</div>
              <div className="text-sm text-muted-foreground">Registros Inválidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{parseResult.headers.length}</div>
              <div className="text-sm text-muted-foreground">Colunas Detectadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{parseResult.totalRows}</div>
              <div className="text-sm text-muted-foreground">Total de Linhas</div>
            </div>
          </div>

          {/* Status das colunas esperadas */}
          <div className="p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Colunas Esperadas</span>
              <Badge variant={columnStatus.found === columnStatus.total ? "default" : "secondary"}>
                {columnStatus.found}/{columnStatus.total}
              </Badge>
            </div>
            {columnStatus.missing.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Colunas não encontradas: {columnStatus.missing.slice(0, 2).join(', ')}
                  {columnStatus.missing.length > 2 && ` e mais ${columnStatus.missing.length - 2}`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Erros */}
          {parseResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <details className="cursor-pointer">
                  <summary>
                    {parseResult.errors.length} erro(s) encontrado(s) - clique para ver detalhes
                  </summary>
                  <ul className="mt-2 text-xs space-y-1 ml-4">
                    {parseResult.errors.slice(0, 10).map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                    {parseResult.errors.length > 10 && (
                      <li>• ... e mais {parseResult.errors.length - 10} erros</li>
                    )}
                  </ul>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              disabled={parseResult.preview.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
            </Button>

            <div className="space-x-2">
              <Button variant="outline" onClick={clearData}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={handleLoadFromPublic} disabled={isProcessing}>
                Carregar do Link Público
              </Button>
              <Button
                onClick={handleConfirmData}
                disabled={parseResult.valid.length === 0}
                className="bg-gradient-primary hover:opacity-90"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar Dados ({parseResult.valid.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview dos Dados */}
      {showPreview && parseResult.preview.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Preview dos Dados (5 primeiras linhas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {parseResult.headers.slice(0, 6).map((header, i) => (
                      <th key={i} className="text-left p-2 font-medium">
                        {header.length > 30 ? `${header.substring(0, 30)}...` : header}
                      </th>
                    ))}
                    {parseResult.headers.length > 6 && (
                      <th className="text-left p-2 font-medium">...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parseResult.preview.map((row, i) => (
                    <tr key={i} className="border-b">
                      {parseResult.headers.slice(0, 6).map((header, j) => (
                        <td key={j} className="p-2 max-w-32 truncate">
                          {row[header]?.toString() || '—'}
                        </td>
                      ))}
                      {parseResult.headers.length > 6 && (
                        <td className="p-2 text-muted-foreground">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}