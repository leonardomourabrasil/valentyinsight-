# Dashboard de Pesquisa de Satisfação — Valenty

Dashboard moderno e responsivo para análise dos resultados da Pesquisa de Satisfação aplicada ao final das capacitações do Instituto Valenty.

## 🚀 Funcionalidades

### ✅ Implementadas nesta versão

- **Upload de CSV**: Interface drag-and-drop para importação de dados
- **Parsing e Validação**: Processamento automático com validação de esquema
- **KPIs Principais**: Métricas de satisfação e NPS em tempo real
- **Visualizações Interativas**:
  - Gráficos de distribuição NPS (Curso e Marca)
  - Radar chart comparando blocos de avaliação
  - Série temporal de evolução das métricas
- **Filtros Avançados**: Por turma, curso, professor, datas, blocos e texto
- **Design Responsivo**: Interface adaptável para desktop e mobile
- **Tema Moderno**: Design system com cores da Valenty
- **Persistência Local**: Dados salvos automaticamente no navegador

### 🔄 Formato CSV Esperado

O dashboard espera um CSV com as seguintes colunas principais:

#### Metadados
- `Submission ID`
- `Respondent ID`
- `Submitted at`
- `Selecione a turma que você está estudando.`
- `Qual curso você deseja avaliar?`
- `Selecione o(a) professor(a) responsável pelo curso:`
- `Data de Início do Curso`
- `Data de Término do Curso`

#### Autoavaliação (0-10)
- `1. MINHA PRESENÇA E PARTICIPAÇÃO NO CURSO`
- `2. MINHA POSTURA ACADÊMICA PERANTE A TURMA`
- `3. USO DE APARELHOS ELETRÔNICOS`
- `4. MEU NÍVEL DE APRENDIZADO E AUTODESENVOLVIMENTO`
- `5. Escreva seu autofeedback sobre sua participação.`

#### Avaliação do Professor (0-10)
- `1. RELACIONAMENTO COM A TURMA`
- `2. DOMÍNIO DO ASSUNTO - CONHECIMENTO`
- `3. APLICABILIDADE DOS CONTEÚDOS ABORDADOS EM SALA`
- `4. DIDÁTICA E COMUNICAÇÃO`
- `5. PONTUALIDADE DO PROFESSOR`
- `7. Escreva seu feedback sobre o(a) professor(a).`

#### Metodologia (0-10)
- Campos sobre participação ativa e aplicação prática

#### Infraestrutura (0-10)
- `1. EQUIPE DE APOIO`
- `2. ESTRUTURA DA SALA DE AULA`
- `3. CONFORTO E CLIMATIZAÇÃO DO AMBIENTE`

#### NPS e Aproveitamento
- `2. Em uma escala de 0 a 10, qual é a probabilidade de você recomendar este curso para um colega, amigo ou familiar? (NPS da Imersão)`
- `3. Em uma escala de 0 a 10, qual é a probabilidade de você recomendar o Instituto Valente? (NPS da Marca)`
- `1. Qual foi o seu nível de aproveitamento no curso?`
- `4. Como podemos melhorar?`

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Design System customizado
- **UI Components**: shadcn/ui + Radix UI
- **Gráficos**: Recharts
- **Validação**: Zod
- **Parsing CSV**: PapaParse
- **Build**: Vite
- **Ícones**: Lucide React

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm, yarn ou pnpm

### Passos

1. **Clone o repositório**
```bash
git clone <URL_DO_REPOSITORIO>
cd valenty-dashboard
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. **Execute o projeto**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

4. **Acesse o dashboard**
```
http://localhost:8080
```

## 🎨 Personalização de Design

### Cores da Marca

O design system está configurado em `src/index.css` com as cores da Valenty:

```css
:root {
  --primary: 217 91% 55%;     /* Azul Valenty */
  --accent: 159 64% 52%;      /* Verde Valenty */
  --success: 142 71% 45%;     /* Verde Sucesso */
  --warning: 45 93% 58%;      /* Amarelo Atenção */
}
```

### Customização

Para ajustar as cores:

1. Edite `src/index.css` (cores HSL)
2. Ajuste `tailwind.config.ts` se necessário
3. Components usam tokens semânticos automaticamente

## 📊 Como Usar

### 1. Upload de Dados
- Acesse o dashboard
- Arraste e solte o arquivo CSV ou clique para selecionar
- Aguarde o processamento e validação
- Confirme os dados válidos

### 2. Aplicar Filtros
- Use o painel de filtros expansível
- Filtre por turma, curso, professor
- Defina faixas de pontuação
- Busque texto nos feedbacks
- Filtros são aplicados em tempo real

### 3. Visualizar Métricas
- **KPIs**: Total de respondentes, média geral, NPS combinado
- **NPS Charts**: Distribuição de promotores, neutros e detratores
- **Radar Chart**: Comparação entre blocos de avaliação
- **Série Temporal**: Evolução das métricas ao longo do tempo

### 4. Exportar Dados
- Clique em "Exportar" no header
- Baixa JSON com dados filtrados e métricas

## 🚀 Deploy na Vercel

### Via GitHub (Recomendado)

1. **Conecte seu repositório GitHub**
2. **Acesse [vercel.com](https://vercel.com)**
3. **Importe o projeto GitHub**
4. **Configure as variáveis (se necessário)**
5. **Deploy automático a cada push**

### Deploy Manual

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel

# Para production
vercel --prod
```

### Configurações de Build

O projeto já está configurado com:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite

## 🔧 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn)
│   ├── charts/         # Gráficos específicos
│   ├── DashboardLayout.tsx
│   ├── CSVUploader.tsx
│   ├── KPICards.tsx
│   └── FilterPanel.tsx
├── lib/                # Utilitários e esquemas
│   ├── csvSchema.ts    # Validação Zod
│   ├── transform.ts    # Transformação de dados
│   └── utils.ts        # Utilitários gerais
├── hooks/              # Custom hooks
│   └── useFilteredData.ts
├── pages/              # Páginas da aplicação
│   └── Index.tsx       # Dashboard principal
└── index.css           # Design system global
```

## 📈 Métricas Calculadas

### NPS (Net Promoter Score)
- **Promotores**: Notas 9-10
- **Neutros**: Notas 7-8  
- **Detratores**: Notas 0-6
- **Fórmula**: (% Promotores - % Detratores)

### Médias por Bloco
- **Autoavaliação**: Média das 4 questões
- **Professor**: Média das 5 questões  
- **Metodologia**: Média das 2 questões
- **Infraestrutura**: Média das 3 questões

### Séries Temporais
- Agrupamento por semana
- Médias calculadas por período
- Evolução de NPS e blocos

## 🔒 Privacidade e LGPD

- **Dados locais**: Processamento no navegador
- **Sem envio para servidor**: CSV processado localmente
- **Campo e-mail opcional**: Pode ser anonimizado
- **Controle do usuário**: Dados podem ser limpos a qualquer momento

## 🐛 Troubleshooting

### CSV não é reconhecido
- Verifique se as colunas têm nomes exatos
- Encoding deve ser UTF-8
- Máximo 20MB por arquivo

### Filtros sem resultado
- Clique no botão de reset (ícone de rotação)
- Verifique se os valores existem nos dados

### Performance lenta
- Arquivos muito grandes podem ser lentos
- Considere filtrar dados antes do upload
- Limite de ~10.000 linhas recomendado

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para questões sobre o dashboard, entre em contato com a equipe de desenvolvimento do Instituto Valenty.

---

Desenvolvido com ❤️ para o Instituto Valenty