# Implementation Plan: Desabafo Anônimo

## Overview

Plano de implementação para a aplicação Desabafo Anônimo — uma SPA React com Vite, Firebase Authentication (Google), Firestore e sistema de moderação. As tarefas seguem uma abordagem incremental: setup do projeto, configuração Firebase (auth + Firestore), identidade visual, componentes core, hooks customizados (incluindo auth, comentários e admin), camada de serviço, sistema de comentários, moderação e testes. Cada etapa constrói sobre a anterior, garantindo que não haja código órfão.

## Tasks

- [x] 1. Setup do projeto e infraestrutura base
  - [x] 1.1 Criar projeto Vite com React e TypeScript
    - Inicializar projeto com `npm create vite@latest` usando template react-ts
    - Instalar dependências: firebase, react, react-dom, react-router-dom
    - Instalar devDependencies: jest, @testing-library/react, @testing-library/jest-dom, fast-check, ts-jest, jest-environment-jsdom
    - Configurar `tsconfig.json` com paths e strict mode
    - Configurar `jest.config.ts` com suporte a TypeScript e JSX
    - Criar estrutura de diretórios: `src/components/`, `src/hooks/`, `src/firebase/`, `src/utils/`, `src/__tests__/properties/`, `src/__tests__/unit/`, `src/__tests__/integration/`
    - _Requirements: 6.1, 8.1_

  - [x] 1.2 Definir tipos e interfaces base
    - Criar `src/types/index.ts` com os tipos: `Sentimento`, `TipoReacao`, `Desabafo`, `DesabafoDoc`, `Comentario`, `ComentarioDoc`, `UsuarioAuth`, `AdminDoc`, `DesabafoAdmin`, `ComentarioAdmin`
    - Criar interfaces de props: `InputBoxProps`, `FeedProps`, `DesabafoCardProps`, `FeedControlsProps`, `ConfirmDialogProps`, `LoginButtonProps`, `ComentarioSectionProps`, `PaginaModeracaoProps`
    - _Requirements: 1.2, 1.3, 4.1, 10.1, 11.1_

- [x] 2. Configuração Firebase e camada de serviço base
  - [x] 2.1 Configurar Firebase SDK
    - Criar `src/firebase/config.ts` com inicialização do Firebase App, instância do Firestore e instância do Auth
    - Utilizar Firebase SDK v9+ (imports modulares)
    - Adicionar variáveis de ambiente para credenciais do projeto (`.env` com prefixo `VITE_`)
    - Exportar instâncias `db` e `auth`
    - _Requirements: 6.1, 10.1_

  - [x] 2.2 Implementar serviço de desabafos
    - Criar `src/firebase/desabafos.ts` com as funções:
      - `criarDesabafo(texto, sentimento, uid)`: usa `addDoc` com `serverTimestamp()` e uid do autor
      - `buscarDesabafos(filtro, limite, cursor?)`: usa `query`, `orderBy`, `limit`, `startAfter`, `where` — projeta sem uid
      - `incrementarReacao(desabafoId, tipo)`: usa `updateDoc` com `increment(1)`
      - `removerDesabafo(desabafoId)`: deleta documento (admin)
      - `apagarTodosDesabafos()`: busca todos os docs e usa `writeBatch` para deletar
    - Implementar wrapper `operacaoSegura` com timeout de 10 segundos
    - _Requirements: 1.4, 2.5, 4.4, 5.1, 6.1, 6.2, 6.5, 7.6_

  - [x] 2.3 Criar regras de segurança do Firestore
    - Criar arquivo `firestore.rules` com:
      - Função `isAdmin()` e `isAuthenticated()`
      - Validação de criação de desabafo (texto 1-2000 chars, sentimento válido, reações zeradas, uid == auth.uid)
      - Leitura pública, atualização apenas de reações/totalComentarios, exclusão apenas admin
      - Subcoleção comentários: leitura pública, criação autenticada (uid == auth.uid, texto 1-500 chars), exclusão admin
      - Coleção admins: leitura apenas do próprio admin, escrita bloqueada
    - _Requirements: 5.3, 5.5, 6.1, 7.1, 10.1, 11.3_

- [x] 3. Serviço de autenticação Firebase
  - [x] 3.1 Implementar serviço de autenticação
    - Criar `src/firebase/auth.ts` com as funções:
      - `loginComGoogle()`: usa `signInWithPopup` com `GoogleAuthProvider`
      - `logout()`: usa `signOut`
      - `onAuthChange(callback)`: usa `onAuthStateChanged` para observar mudanças de sessão
    - Exportar instância do `GoogleAuthProvider`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.2 Implementar serviço de administração
    - Criar `src/firebase/admin.ts` com as funções:
      - `verificarAdmin(uid)`: consulta documento na coleção `admins` com o uid
      - `buscarTodosDesabafosAdmin()`: busca todos desabafos COM uid (para moderação)
      - `buscarTodosComentariosAdmin()`: busca todos comentários COM uid (para moderação)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 3.3 Implementar serviço de comentários
    - Criar `src/firebase/comentarios.ts` com as funções:
      - `criarComentario(desabafoId, texto, uid)`: usa `addDoc` na subcoleção `comentarios`
      - `buscarComentarios(desabafoId, limite)`: busca comentários ordenados por data ASC, projeta sem uid
      - `removerComentario(desabafoId, comentarioId)`: deleta documento (admin)
      - `removerComentariosDoDesabafo(desabafoId)`: deleta todos comentários da subcoleção (admin)
    - Incrementar/decrementar `totalComentarios` no documento pai ao criar/remover
    - _Requirements: 11.3, 11.4, 7.6, 7.8, 5.2_

- [x] 4. Identidade visual e estilos globais
  - [x] 4.1 Implementar variáveis CSS e tema escuro
    - Criar `src/styles/variables.css` com todas as CSS custom properties definidas no design (cores, tipografia, espaçamento)
    - Criar `src/styles/global.css` com reset básico, fonte Inter (Google Fonts), e estilos base do body
    - Definir cores por sentimento: `--cor-tristeza: #4a90d9`, `--cor-raiva: #d94a4a`, `--cor-alivio: #4ad9a0`
    - Implementar transições e efeitos (hover, scale, fade-in/fade-out)
    - _Requirements: 8.2, 8.4, 8.5_

  - [x] 4.2 Implementar estilos responsivos
    - Criar `src/styles/responsive.css` com media queries para viewport < 720px
    - Container principal ocupa largura total com padding interno em telas pequenas
    - Garantir legibilidade sem scroll horizontal a partir de 320px
    - _Requirements: 8.4, 8.5_

- [x] 5. Checkpoint - Verificar setup base e serviços
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Componentes de apresentação (Parte 1 - Header e Auth)
  - [x] 6.1 Implementar componente Header
    - Criar `src/components/Header.tsx` e `src/components/Header.css`
    - Renderizar título "Desabafo Anônimo" e aviso sobre ajuda profissional
    - Incluir slot para LoginButton e link de moderação (condicional para admins)
    - _Requirements: 8.1, 7.2_

  - [x] 6.2 Implementar componente LoginButton
    - Criar `src/components/LoginButton.tsx` e `src/components/LoginButton.css`
    - Estado visitante: exibir botão "Entrar com Google"
    - Estado autenticado: exibir botão "Sair"
    - Estado loading: exibir indicador de carregamento durante fluxo de auth
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 6.3 Implementar componente MensagemLogin
    - Criar `src/components/MensagemLogin.tsx` e `src/components/MensagemLogin.css`
    - Exibir mensagem convidando visitante a fazer login para publicar
    - Visível apenas quando usuário não está autenticado
    - _Requirements: 10.8, 1.10_

- [x] 7. Componentes de apresentação (Parte 2 - Feed e Interação)
  - [x] 7.1 Implementar componente InputBox
    - Criar `src/components/InputBox.tsx` e `src/components/InputBox.css`
    - Textarea com placeholder acolhedor
    - Select de sentimento com opções Tristeza, Raiva, Alívio (padrão: Tristeza)
    - Botão "Publicar" com estado de loading
    - Validação: texto não vazio, não apenas espaços, máximo 2000 caracteres
    - Exibir mensagem de feedback (acolhimento por 3s ou erro)
    - Limpar campo e restaurar sentimento padrão após sucesso
    - Visível apenas para usuários autenticados
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [x] 7.2 Implementar componente DesabafoCard
    - Criar `src/components/DesabafoCard.tsx` e `src/components/DesabafoCard.css`
    - Renderizar texto do desabafo, tempo relativo, borda lateral colorida por sentimento
    - Três botões de reação com contadores: "Eu me identifiquei", "Força", "Eu acho é pouco"
    - Botão para expandir seção de comentários com contador de comentários
    - _Requirements: 2.2, 4.1, 4.2, 8.2, 8.3, 11.1, 11.6_

  - [x] 7.3 Implementar componente Feed
    - Criar `src/components/Feed.tsx` e `src/components/Feed.css`
    - Renderizar lista de DesabafoCards
    - Exibir LoadingIndicator durante carregamento
    - Exibir EmptyState quando não há desabafos
    - Botão "Carregar mais" quando `hasMore` é true
    - Não exibir informações identificáveis do autor
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 2.7, 6.3_

  - [x] 7.4 Implementar componente FeedControls
    - Criar `src/components/FeedControls.tsx` e `src/components/FeedControls.css`
    - Select de filtro: "Todos", "Tristeza", "Raiva", "Alívio" (padrão: Todos)
    - Contador de desabafos no formato "{número} desabafos"
    - _Requirements: 2.4, 3.1, 3.4, 3.5_

  - [x] 7.5 Implementar componente ConfirmDialog
    - Criar `src/components/ConfirmDialog.tsx` e `src/components/ConfirmDialog.css`
    - Dialog de confirmação com mensagem, botão confirmar e botão cancelar
    - Reutilizável para remoção de desabafos, comentários e apagar tudo
    - _Requirements: 7.5, 7.7, 7.11_

- [x] 8. Componente de Comentários
  - [x] 8.1 Implementar componente ComentarioSection
    - Criar `src/components/ComentarioSection.tsx` e `src/components/ComentarioSection.css`
    - Botão para expandir/colapsar seção de comentários
    - Lista de comentários ordenados do mais antigo para o mais recente (máximo 50)
    - Cada comentário exibe texto e tempo relativo, sem informações identificáveis
    - Campo de submissão de comentário (visível apenas para autenticados)
    - Validação: texto não vazio, não apenas espaços, máximo 500 caracteres com contador
    - MensagemLoginComentario para visitantes (convidar a fazer login)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11_

- [x] 9. Custom Hooks e lógica de estado
  - [x] 9.1 Implementar hook useAuth
    - Criar `src/hooks/useAuth.ts`
    - Observar estado de autenticação via `onAuthStateChanged`
    - Gerenciar estado: `usuario` (UsuarioAuth | null), `isLoading`, `isAutenticado`
    - Implementar `login()` com `signInWithPopup` e tratamento de cancelamento
    - Implementar `logout()` com `signOut`
    - Restaurar sessão automaticamente ao carregar página
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 9.2 Implementar hook useAdmin
    - Criar `src/hooks/useAdmin.ts`
    - Receber uid como parâmetro
    - Consultar coleção `admins` no Firestore para verificar se uid é admin
    - Retornar `{ isAdmin, isLoading }`
    - _Requirements: 7.1, 7.2_

  - [x] 9.3 Implementar hook useDesabafos
    - Criar `src/hooks/useDesabafos.ts`
    - Gerenciar estado do feed: desabafos, isLoading, error, hasMore, lastDoc, total
    - Buscar desabafos do Firestore na montagem e quando filtro muda
    - Implementar `loadMore` com paginação por cursor (`startAfter`)
    - Reiniciar paginação quando filtro é alterado
    - Limitar a 20 desabafos por carregamento
    - _Requirements: 2.1, 2.5, 3.2, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 9.4 Implementar hook usePublicar
    - Criar `src/hooks/usePublicar.ts`
    - Receber uid como parâmetro (requer autenticação)
    - Validar texto antes de enviar (não vazio, não whitespace, ≤2000 chars)
    - Chamar `criarDesabafo` do serviço Firebase com uid
    - Retornar o desabafo criado para inserção no topo do feed
    - Gerenciar estado `isPublicando` e `error`
    - _Requirements: 1.3, 1.4, 1.7, 1.8, 1.9, 1.11_

  - [x] 9.5 Implementar hook useReacoes
    - Criar `src/hooks/useReacoes.ts`
    - Implementar optimistic update: incrementar localmente antes da confirmação
    - Chamar `incrementarReacao` do serviço Firebase
    - Reverter incremento em caso de falha (rollback)
    - Não requer autenticação
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 9.6 Implementar hook useComentarios
    - Criar `src/hooks/useComentarios.ts`
    - Receber `desabafoId` como parâmetro
    - Buscar comentários da subcoleção (máximo 50, ordenados por data ASC)
    - Implementar `publicarComentario(texto, uid)` com validação
    - Gerenciar estado: comentarios, isLoading, totalComentarios
    - Inserir novo comentário na lista local após sucesso
    - _Requirements: 11.2, 11.3, 11.4, 11.6, 11.7, 11.8, 11.9_

  - [x] 9.7 Implementar hook useTempoRelativo
    - Criar `src/hooks/useTempoRelativo.ts`
    - Calcular tempo relativo: "agora" (<60s), "X min atrás" (60s-60min), "X h atrás" (60min-24h), "dd/MM/yyyy" (≥24h)
    - Auto-refresh a cada 60 segundos via `setInterval`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 9.8 Implementar funções utilitárias de validação
    - Criar `src/utils/validacao.ts` com:
      - `validarTextoDesabafo(texto: string): { valido: boolean, erro?: string }` (limite 2000)
      - `validarTextoComentario(texto: string): { valido: boolean, erro?: string }` (limite 500)
    - Criar `src/utils/tempoRelativo.ts` com função pura `formatarTempoRelativo(data: Date, agora: Date): string`
    - _Requirements: 1.7, 1.8, 9.1, 9.2, 9.3, 9.4, 11.7, 11.8_

- [x] 10. Checkpoint - Verificar componentes e hooks
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Página de Moderação
  - [x] 11.1 Implementar componente PaginaModeracao
    - Criar `src/components/PaginaModeracao.tsx` e `src/components/PaginaModeracao.css`
    - Exibir lista de todos os desabafos (trecho até 100 chars, sentimento, data, botão remover)
    - Exibir lista de todos os comentários (trecho até 100 chars, data, botão remover)
    - Botão "Apagar tudo" com ConfirmDialog
    - Diálogo de confirmação para remoção individual
    - Atualizar listas após remoção sem recarregar página
    - Exibir mensagem de erro em caso de falha na remoção
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.11, 7.12, 7.13_

  - [x] 11.2 Implementar componente RotaProtegidaAdmin
    - Criar `src/components/RotaProtegidaAdmin.tsx`
    - Verificar autenticação e status de admin
    - Redirecionar visitantes para feed com mensagem "Faça login para acessar"
    - Redirecionar não-admins para feed com mensagem "Acesso negado"
    - Exibir loading enquanto verifica status
    - _Requirements: 7.9, 7.10_

- [x] 12. Integração e wiring do App
  - [x] 12.1 Montar componente App principal com roteamento
    - Atualizar `src/App.tsx` integrando todos os componentes e hooks
    - Configurar react-router-dom com rotas: `/` (feed) e `/moderacao` (PaginaModeracao protegida)
    - Conectar `useAuth` com `LoginButton` e controle de visibilidade
    - Conectar `useAdmin` com link de moderação no Header e RotaProtegidaAdmin
    - Conectar `useDesabafos` com `Feed` e `FeedControls`
    - Conectar `usePublicar` com `InputBox` (passando uid)
    - Conectar `useReacoes` com `DesabafoCard` via `Feed`
    - Exibir `MensagemLogin` quando visitante, `InputBox` quando autenticado
    - Implementar inserção de novo desabafo no topo do feed local após publicação
    - Atualizar contador ao mudar filtro ou publicar
    - _Requirements: 1.5, 1.10, 2.3, 2.4, 3.2, 3.3, 3.4, 7.2, 10.3, 10.4, 10.8, 10.9_

  - [x] 12.2 Configurar ponto de entrada da aplicação
    - Atualizar `src/main.tsx` com imports de estilos globais e BrowserRouter
    - Atualizar `index.html` com meta tags, título e link para fonte Inter
    - _Requirements: 8.1, 8.4_

- [x] 13. Checkpoint - Verificar integração completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Testes baseados em propriedades (Property-Based Tests)
  - [ ]* 14.1 Escrever property test para criação de desabafo
    - **Property 1: Criação de desabafo preserva dados de entrada (com uid)**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 14.2 Escrever property test para validação de texto
    - **Property 2: Validação rejeita texto inválido para desabafos e comentários**
    - **Validates: Requirements 1.7, 1.8, 11.7, 11.8**

  - [ ]* 14.3 Escrever property test para ordenação do feed
    - **Property 3: Feed é sempre ordenado por data decrescente**
    - **Validates: Requirements 2.1**

  - [ ]* 14.4 Escrever property test para contador
    - **Property 4: Contador reflete quantidade de itens visíveis**
    - **Validates: Requirements 2.4, 3.4**

  - [ ]* 14.5 Escrever property test para filtro por sentimento
    - **Property 5: Filtro retorna apenas desabafos com sentimento correspondente**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 14.6 Escrever property test para paginação
    - **Property 6: Paginação limita a 20 itens por página**
    - **Validates: Requirements 2.5**

  - [ ]* 14.7 Escrever property test para reação
    - **Property 7: Reação incrementa exatamente um contador em 1**
    - **Validates: Requirements 4.3**

  - [ ]* 14.8 Escrever property test para rollback de reação
    - **Property 8: Falha na reação reverte ao valor original**
    - **Validates: Requirements 4.6**

  - [ ]* 14.9 Escrever property test para anonimato
    - **Property 9: Dados exibidos no feed não contêm informações identificáveis**
    - **Validates: Requirements 5.1, 5.2, 2.7, 11.5**

  - [ ]* 14.10 Escrever property test para remoção cascata
    - **Property 10: Remoção de desabafo remove comentários associados**
    - **Validates: Requirements 7.6**

  - [ ]* 14.11 Escrever property test para tempo relativo
    - **Property 11: Tempo relativo formata corretamente para todas as faixas**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 14.12 Escrever property test para criação de comentário
    - **Property 12: Criação de comentário preserva dados de entrada**
    - **Validates: Requirements 11.3**

- [ ] 15. Testes unitários dos componentes
  - [ ]* 15.1 Escrever testes unitários para Header e LoginButton
    - Verificar renderização do título, aviso, botão login/logout, link moderação (condicional)
    - _Requirements: 8.1, 10.1, 10.3, 7.2_

  - [ ]* 15.2 Escrever testes unitários para InputBox e MensagemLogin
    - Testar placeholder, opções de sentimento, valor padrão, feedback de erro, limpeza após sucesso
    - Testar visibilidade condicional (autenticado vs visitante)
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8, 10.8_

  - [ ]* 15.3 Escrever testes unitários para DesabafoCard e ComentarioSection
    - Testar renderização de texto, tempo relativo, borda por sentimento, botões de reação
    - Testar expandir/colapsar comentários, campo de submissão condicional
    - _Requirements: 2.2, 4.1, 4.2, 8.2, 11.1, 11.5, 11.10_

  - [ ]* 15.4 Escrever testes unitários para Feed e FeedControls
    - Testar loading state, empty state, renderização de cards, filtro, contador
    - _Requirements: 2.1, 2.4, 2.6, 3.1, 6.3_

  - [ ]* 15.5 Escrever testes unitários para PaginaModeracao e RotaProtegidaAdmin
    - Testar lista de desabafos e comentários, botões de remoção, diálogos
    - Testar redirecionamento para não-admins e visitantes
    - _Requirements: 7.3, 7.4, 7.5, 7.9, 7.10_

  - [ ]* 15.6 Escrever testes unitários para ConfirmDialog
    - Testar abertura, confirmação, cancelamento
    - _Requirements: 7.5, 7.7, 7.11_

- [ ] 16. Checkpoint final - Verificar integração completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude
- Testes unitários validam exemplos específicos e edge cases
- A aplicação usa Firebase SDK v9+ com imports modulares para tree-shaking
- Firebase Authentication com Google é obrigatório para publicar desabafos e comentários
- Visitantes podem visualizar o feed e reagir sem autenticação
- Administradores são gerenciados via coleção `admins` no Firestore (cadastro manual no console)
- Comentários são armazenados como subcoleção de cada desabafo
- O campo `uid` nunca é exposto no feed — projeção no código cliente e regras de segurança garantem anonimato

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 1, "tasks": ["4.1", "4.2"] },
    { "id": 2, "tasks": ["6.1", "6.2", "6.3", "9.8"] },
    { "id": 3, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "9.7"] },
    { "id": 4, "tasks": ["8.1", "9.1", "9.2"] },
    { "id": 5, "tasks": ["9.3", "9.4", "9.5", "9.6"] },
    { "id": 6, "tasks": ["11.1", "11.2"] },
    { "id": 7, "tasks": ["12.1", "12.2"] },
    { "id": 8, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9", "14.10", "14.11", "14.12"] },
    { "id": 9, "tasks": ["15.1", "15.2", "15.3", "15.4", "15.5", "15.6"] }
  ]
}
```
