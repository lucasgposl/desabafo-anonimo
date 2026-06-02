# Design Document

## Overview

Refatoração da `PaginaModeracao` para: (1) remover a seção plana de comentários e substituí-la por linhas expansíveis com carregamento lazy; (2) adicionar paginação de 25 desabafos por vez com cursor; (3) adicionar campo de busca por número incremental. Nenhum serviço novo é criado para os itens 1 e 2 — o item 3 requer uma nova query por `numero`.

## Architecture

| Camada | Mudança |
|--------|---------|
| Firestore | Index em `numero` (ASC) na coleção `desabafos` — compartilhado com `feature-003` |
| Serviço (`firebase/admin.ts`) | `buscarTodosDesabafosAdmin` passa a aceitar `limite` e `cursor` para paginação; nova função `buscarDesabafoAdminPorNumero(numero)` |
| Serviço (`firebase/comentarios.ts`) | Reutiliza `buscarComentarios` existente |
| Componente (`PaginaModeracao.tsx`) | Remoção do fetch de comentários, adição de paginação, campo de busca, linhas expansíveis |
| CSS (`PaginaModeracao.css`) | Novos estilos para toggle, badge, comentários inline, barra de busca e paginação |

## State Changes

Estado removido do componente:

```typescript
// REMOVIDO
const [comentarios, setComentarios] = useState<Comentario[]>([]);
```

Estado adicionado ao componente:

```typescript
// IDs dos desabafos atualmente expandidos
const [expandedDesabafoIds, setExpandedDesabafoIds] = useState<Set<string>>(new Set());

// Comentários já carregados, indexados por desabafoId
const [comentariosPorDesabafo, setComentariosPorDesabafo] = useState<
  Record<string, Comentario[]>
>({});

// Estado de carregamento por desabafo
const [loadingComentarios, setLoadingComentarios] = useState<
  Record<string, boolean>
>({});

// Erros de carregamento por desabafo
const [erroComentarios, setErroComentarios] = useState<
  Record<string, string>
>({});
```

## Loading Logic

### Carregamento inicial

```typescript
// ANTES: buscava desabafos + todos os comentários
const [desabafosData, comentariosData] = await Promise.all([
  buscarTodosDesabafos(),
  buscarTodosComentarios(), // REMOVIDO
]);

// DEPOIS: busca apenas desabafos
const desabafosData = await buscarTodosDesabafos();
```

### Carregamento lazy por desabafo

```typescript
async function toggleDesabafo(id: string) {
  if (expandedDesabafoIds.has(id)) {
    // Recolhe — sem fetch
    setExpandedDesabafoIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    return;
  }

  // Expande
  setExpandedDesabafoIds(prev => new Set(prev).add(id));

  // Já carregado anteriormente — reutiliza cache
  if (comentariosPorDesabafo[id]) return;

  // Primeira vez — busca do Firestore
  setLoadingComentarios(prev => ({ ...prev, [id]: true }));
  try {
    const dados = await buscarComentarios(id);
    setComentariosPorDesabafo(prev => ({ ...prev, [id]: dados }));
  } catch {
    setErroComentarios(prev => ({ ...prev, [id]: 'Erro ao carregar comentários.' }));
  } finally {
    setLoadingComentarios(prev => ({ ...prev, [id]: false }));
  }
}
```

## Pagination State

```typescript
const LIMITE_MODERACAO = 25;

const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
const [hasMore, setHasMore] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);
```

`buscarTodosDesabafosAdmin` é atualizada para aceitar paginação:

```typescript
// firebase/admin.ts
async function buscarTodosDesabafosAdmin(
  limite: number = 25,
  cursor?: DocumentSnapshot
): Promise<{ desabafos: DesabafoAdmin[]; ultimoDoc: DocumentSnapshot | null }> {
  const constraints = [orderBy('criadoEm', 'desc'), limit(limite)];
  if (cursor) constraints.push(startAfter(cursor));
  const q = query(collection(db, 'desabafos'), ...constraints);
  const snap = await getDocs(q);
  return {
    desabafos: snap.docs.map(mapDesabafoAdmin),
    ultimoDoc: snap.docs.at(-1) ?? null,
  };
}
```

## Search State

```typescript
const [buscaNumero, setBuscaNumero] = useState('');
const [modosBusca, setModoBusca] = useState(false); // true quando busca ativa

// Nova função no serviço
async function buscarDesabafoAdminPorNumero(numero: number): Promise<DesabafoAdmin | null>
// usa where('numero', '==', numero) — requer index em 'numero' (compartilhado com feature-003)
```

Quando busca está ativa (`modoBusca === true`), a lista exibe apenas o resultado da busca e o botão "Carregar mais" fica oculto. Limpar o campo restaura a lista paginada.

## UI Layout

### Barra de busca e paginação

```
┌─────────────────────────────────────────────────────────────────┐
│  Desabafos (320)                                                │
│  [Buscar por número: ___________] [Buscar] [Limpar]            │
├─────────────────────────────────────────────────────────────────┤
│  [Tristeza] #42  "Estou me sentindo..."  14/07/25               │
│                           [▼ 3 comentários]  [Remover]          │
│  ...                                                            │
├─────────────────────────────────────────────────────────────────┤
│              [ Carregar mais 25 ]                               │
└─────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  [Tristeza]  "Estou me sentindo muito sobrecarrega..."  14/07/25 │
│                                              [▼ 3 comentários]  [Remover] │
├──────────────────────────────────────────────────────────────────┤
│  ↳ "Força, vai passar!" — agora               [Remover]         │
│  ↳ "Eu entendo você..."  — 2min atrás         [Remover]         │
│  ↳ "Cuida-se!"           — 1h atrás           [Remover]         │
└──────────────────────────────────────────────────────────────────┘
```

### Estados visuais do toggle

| Estado | Rótulo | Ícone |
|--------|--------|-------|
| Recolhido, 0 comentários | "0 comentários" | — (toggle desabilitado) |
| Recolhido, N > 0 | "N comentários" | ▶ |
| Expandido | "N comentários" | ▼ |
| Carregando | "carregando..." | spinner |

## CSS

Novas classes a adicionar em `PaginaModeracao.css`:

```css
.pagina-moderacao__desabafo-toggle { /* botão de expandir/recolher */ }
.pagina-moderacao__badge-comentarios { /* badge numérico */ }
.pagina-moderacao__badge-comentarios--vazio { /* estilo neutro quando 0 */ }
.pagina-moderacao__comentarios-inline { /* container dos comentários inline */ }
.pagina-moderacao__comentario-inline-item { /* linha de cada comentário */ }
```

## Correctness Properties

### Property 1: Nenhum comentário é carregado antes de expandir
Para qualquer estado inicial da Página_Moderação, o estado `comentariosPorDesabafo` deve estar vazio e nenhuma chamada a `buscarComentarios` deve ter ocorrido antes de qualquer toggle ser acionado.

### Property 2: Cache evita requisições duplicadas
Para qualquer desabafo que já foi expandido e teve seus comentários carregados, expandir novamente não deve disparar nova chamada a `buscarComentarios`.
