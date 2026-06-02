# Design Document

## Overview

Este documento descreve a arquitetura e o design das mudanças necessárias para tornar os comentários sempre visíveis no feed (com limite de 5), adicionar o link "ver mais" quando há mais comentários, e restringir o formulário de comentário exclusivamente à `PaginaDesabafo`. As alterações focam em refatorar o `ComentarioSection` para ser parametrizável e modificar o `DesabafoCard` para remover o toggle e adotar o modo preview.

## Architecture

A mudança segue a arquitetura existente (React + Firebase/Firestore), afetando a camada de apresentação (componentes) e minimamente a camada de dados (uso do parâmetro `limite` já existente em `buscarComentarios`).

```
┌─────────────────────────────────────────────────────────────┐
│                         App (Router)                         │
├────────────────────────┬────────────────────────────────────┤
│   PaginaFeed (/)       │      PaginaDesabafo (/desabafo/:n) │
│                        │                                    │
│   DesabafoCard         │      DesabafoCard (completo)       │
│     └─ ComentarioSection(limite=5, mostrarFormulario=false) │
│     └─ LinkVerMais (condicional)                            │
│                        │      ComentarioSection(sem limite,  │
│                        │        mostrarFormulario=true)      │
└────────────────────────┴────────────────────────────────────┘
```

## Components and Interfaces

### 1. ComentarioSection (Refatorado)

**Responsabilidade:** Renderizar a lista de comentários e, opcionalmente, o formulário de envio. Agora parametrizado para atender tanto o feed (preview) quanto a página completa.

**Mudanças:**
- Adicionar prop `limite` (opcional, default sem limite) para controlar quantos comentários buscar
- Adicionar prop `mostrarFormulario` (boolean, default `true`) para controlar exibição do formulário
- Quando `mostrarFormulario=false`, não renderizar o textarea nem o botão "Comentar"
- Quando `mostrarFormulario=true` e `usuarioAutenticado=false`, exibir mensagem de login

```typescript
export interface ComentarioSectionProps {
  desabafoId: string;
  usuarioAutenticado: boolean;
  uid?: string | null;
  limite?: number;              // novo: limita busca de comentários
  mostrarFormulario?: boolean;  // novo: controla exibição do formulário
}
```

### 2. DesabafoCard (Modificado)

**Responsabilidade:** Exibir card de desabafo no feed com comentários visíveis por padrão.

**Mudanças:**
- Remover estado `comentariosExpandidos` e o handler `toggleComentarios`
- Remover o bloco `desabafo-card__comentarios-toggle` com o botão 💬
- Renderizar `ComentarioSection` diretamente (sem condicional) com `limite=5` e `mostrarFormulario=false`
- Adicionar `LinkVerMais` condicional quando `desabafo.totalComentarios > 5`
- Não renderizar ComentarioSection quando `desabafo.totalComentarios === 0`

```typescript
export function DesabafoCard({ desabafo, onReagir, usuarioAutenticado, reacaoAtiva, uid }: DesabafoCardProps) {
  return (
    <article className="desabafo-card" style={...}>
      {/* texto, tempo, reações — sem mudança */}

      {desabafo.totalComentarios > 0 && (
        <div className="desabafo-card__comentarios-section">
          <ComentarioSection
            desabafoId={desabafo.id}
            usuarioAutenticado={usuarioAutenticado}
            uid={uid}
            limite={5}
            mostrarFormulario={false}
          />
          {desabafo.totalComentarios > 5 && (
            <LinkVerMais numero={desabafo.numero} />
          )}
        </div>
      )}
    </article>
  );
}
```

### 3. LinkVerMais (Novo)

**Responsabilidade:** Renderizar link textual "ver mais" que navega para `/desabafo/:numero`.

```typescript
import { Link } from 'react-router-dom';

export interface LinkVerMaisProps {
  numero: number;
}

export function LinkVerMais({ numero }: LinkVerMaisProps) {
  return (
    <Link
      to={`/desabafo/${numero}`}
      className="link-ver-mais"
      aria-label="Ver todos os comentários"
    >
      ver mais
    </Link>
  );
}
```

### 4. PaginaDesabafo (Uso Existente)

**Responsabilidade:** Exibir desabafo completo com todos os comentários e formulário.

**Uso do ComentarioSection:**
```typescript
<ComentarioSection
  desabafoId={desabafo.id}
  usuarioAutenticado={isAutenticado}
  uid={usuario?.uid ?? null}
  mostrarFormulario={true}
  // sem prop limite — busca todos
/>
```

Quando `mostrarFormulario=true` (default), mantém o comportamento atual: formulário para autenticados, mensagem de login para visitantes.

## Interfaces

### Props Atualizadas

```typescript
// ComentarioSectionProps (atualizado)
export interface ComentarioSectionProps {
  desabafoId: string;
  usuarioAutenticado: boolean;
  uid?: string | null;
  limite?: number;              // Quantidade de comentários a buscar (undefined = todos)
  mostrarFormulario?: boolean;  // Exibe formulário? (default: true)
}

// LinkVerMaisProps (novo)
export interface LinkVerMaisProps {
  numero: number;
}

// Desabafo (atualizado — já contém totalComentarios)
// Precisa do campo numero para LinkVerMais
export interface Desabafo {
  id: string;
  texto: string;
  sentimento: Sentimento;
  criadoEm: Date;
  reacoes: { apoio: number; forca: number; pouco: number };
  totalComentarios: number;
  numero?: number;  // novo: necessário para navegação via LinkVerMais
}
```

## Data Models

Nenhuma alteração no Firestore. O campo `totalComentarios` já existe nos documentos de desabafo e o campo `numero` já está previsto na interface `DesabafoAdmin`. A mudança é trazer `numero` para a interface `Desabafo` base.

### Mapeamento de Dados

| Origem (Firestore) | Destino (React) | Uso |
|---------------------|-----------------|-----|
| `desabafos/{id}.totalComentarios` | `Desabafo.totalComentarios` | Decidir se renderiza preview e linkVerMais |
| `desabafos/{id}.numero` | `Desabafo.numero` | Construir URL do LinkVerMais |
| `desabafos/{id}/comentarios` (limit 5) | `Comentario[]` | Preview no feed |
| `desabafos/{id}/comentarios` (sem limit) | `Comentario[]` | Lista completa na PaginaDesabafo |

## Error Handling

| Cenário | Comportamento |
|---------|---------------|
| `buscarComentarios` falha no feed | Silenciar erro, não exibir seção de comentários (comportamento existente) |
| `desabafo.numero` indefinido (desabafo legado) | Não renderizar LinkVerMais (evitar link quebrado) |
| `totalComentarios` é 0 | Não renderizar ComentarioSection no feed |
| Navegação para `/desabafo/:numero` com número inexistente | Tratado pela PaginaDesabafo existente (404) |

## Testing Strategy

### Testes Unitários (Exemplos)
- Verificar que `DesabafoCard` não renderiza botão de toggle
- Verificar que `DesabafoCard` renderiza comentários diretamente sem interação
- Verificar que `ComentarioSection` com `mostrarFormulario=false` não exibe textarea
- Verificar que `LinkVerMais` navega para `/desabafo/:numero` correto
- Verificar que `buscarComentarios` é chamado com `limite=5` no feed
- Verificar que desabafo com 0 comentários não renderiza seção de preview

### Testes de Propriedade (PBT)
- Limite do preview: gerar listas de 0 a N comentários, verificar que renderiza min(N, 5)
- Visibilidade do LinkVerMais: gerar totalComentarios aleatório, verificar presença/ausência
- Ordenação: gerar listas de comentários com datas aleatórias, verificar ordem ASC
- Controle do formulário: gerar combinações (mostrarFormulario, usuarioAutenticado), verificar presença
- Exibição completa: gerar listas de N comentários, verificar que todos são renderizados

### Configuração
- Mínimo 100 iterações por teste de propriedade
- Framework: Jest + fast-check para property-based testing
- Testes de componente com @testing-library/react

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Property 1: Limite do Preview de Comentários

*Para qualquer* lista de N comentários associada a um desabafo, o PreviewComentarios no feed SHALL renderizar exatamente `min(N, 5)` comentários — nunca mais que 5 e nunca menos que o disponível (quando disponível ≤ 5).

**Validates: Requirements 1.3, 1.4**

### Property 2: Visibilidade do LinkVerMais

*Para qualquer* desabafo com campo `totalComentarios` e campo `numero` definido, o LinkVerMais SHALL ser visível se e somente se `totalComentarios > 5`. Quando `totalComentarios ≤ 5`, o link NÃO deve estar presente no DOM.

**Validates: Requirements 3.1, 3.4**

### Property 3: Ordenação de Comentários

*Para qualquer* lista de comentários renderizada pelo ComentarioSection (tanto no feed quanto na PaginaDesabafo), os comentários SHALL estar ordenados do mais antigo para o mais recente — ou seja, para todos os pares consecutivos (c[i], c[i+1]), `c[i].criadoEm <= c[i+1].criadoEm`.

**Validates: Requirements 2.2, 5.4**

### Property 4: Controle do Formulário via Prop

*Para qualquer* combinação de valores `(mostrarFormulario, usuarioAutenticado)`, o ComentarioSection SHALL renderizar o formulário de comentário se e somente se `mostrarFormulario === true AND usuarioAutenticado === true`. Quando `mostrarFormulario === false`, nenhum elemento do formulário (textarea, botão "Comentar") deve estar presente, independentemente do estado de autenticação.

**Validates: Requirements 4.1, 4.4**

### Property 5: Exibição Completa na PaginaDesabafo

*Para qualquer* desabafo com N comentários (N arbitrário), a PaginaDesabafo SHALL renderizar todos os N comentários sem truncamento — a quantidade de itens renderizados na lista deve ser igual ao total de comentários retornados por `buscarComentarios` sem limite.

**Validates: Requirements 5.1**
