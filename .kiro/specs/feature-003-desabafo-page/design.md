# Design Document

## Overview

A feature adiciona o campo `numero` incremental ao tipo `Desabafo`, usa uma transação Firestore no `config/counters` para garantir unicidade, cria o componente `PaginaDesabafo` e o hook `useDesabafo`, e adiciona a rota `/desabafo/:numero`. Desabafos legados sem `numero` continuam funcionando no feed, apenas sem a navegação dedicada.

## Architecture

| Camada | Mudança |
|--------|---------|
| Firestore | Novo documento `config/counters`; campo `numero` nos docs da coleção `desabafos`; index em `numero` |
| Regras de segurança | Leitura pública de `config/counters`; escrita autenticada |
| Tipos (`types.ts`) | Campo `numero?: number` em `Desabafo` e `DesabafoDoc` |
| Serviço (`firebase/desabafos.ts`) | `criarDesabafo` usa `runTransaction` para gerar `numero` |
| Hook (`hooks/useDesabafo.ts`) | Novo hook que busca um desabafo pelo campo `numero` |
| Página (`src/pages/PaginaDesabafo.tsx`) | Novo componente de página |
| Roteamento (`App.tsx`) | Nova rota `/desabafo/:numero` |
| Componente (`DesabafoCard.tsx`) | Exibe badge `#numero` quando disponível |

## Data Model

```typescript
// types.ts — atualizado
interface DesabafoDoc {
  texto: string;
  sentimento: 'Tristeza' | 'Raiva' | 'Alívio';
  criadoEm: Timestamp;
  reacoes: { apoio: number; forca: number; pouco: number };
  totalComentarios: number;
  numero?: number;      // novo campo — opcional para compatibilidade com legados
  autorId?: string;     // apenas admins leem; não exposto no cliente
}

interface Desabafo {
  id: string;           // ID do documento Firestore (auto-gerado)
  texto: string;
  sentimento: 'Tristeza' | 'Raiva' | 'Alívio';
  criadoEm: Date;
  reacoes: { apoio: number; forca: number; pouco: number };
  totalComentarios: number;
  numero?: number;      // novo campo
}

// Firestore: config/counters
interface CountersDoc {
  totalDesabafos: number;
}
```

## Counter Strategy

O `numero` é gerado via `runTransaction` no momento da publicação:

```typescript
// src/firebase/desabafos.ts — criarDesabafo atualizado
import { runTransaction, doc } from 'firebase/firestore';

async function criarDesabafo(texto: string, sentimento: string, autorId: string): Promise<void> {
  const countersRef = doc(db, 'config', 'counters');

  await runTransaction(db, async (transaction) => {
    const countersSnap = await transaction.get(countersRef);
    const total = countersSnap.exists() ? (countersSnap.data().totalDesabafos ?? 0) : 0;
    const numero = total + 1;

    transaction.set(countersRef, { totalDesabafos: numero }, { merge: true });

    const novoDesabafoRef = doc(collection(db, 'desabafos'));
    transaction.set(novoDesabafoRef, {
      texto,
      sentimento,
      criadoEm: serverTimestamp(),
      reacoes: { apoio: 0, forca: 0, pouco: 0 },
      totalComentarios: 0,
      numero,
      autorId,
    });
  });
}
```

## New Hook: useDesabafo

```typescript
// src/hooks/useDesabafo.ts
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Desabafo } from '../types';

interface UseDesabafoResult {
  desabafo: Desabafo | null;
  carregando: boolean;
  naoEncontrado: boolean;
  erro: string | null;
}

export function useDesabafo(numero: number): UseDesabafoResult {
  const [desabafo, setDesabafo] = useState<Desabafo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      setNaoEncontrado(false);
      setErro(null);
      try {
        const q = query(
          collection(db, 'desabafos'),
          where('numero', '==', numero)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setNaoEncontrado(true);
        } else {
          const docSnap = snap.docs[0];
          setDesabafo({ id: docSnap.id, ...mapDoc(docSnap.data()) });
        }
      } catch (e) {
        setErro('Erro ao carregar o desabafo.');
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [numero]);

  return { desabafo, carregando, naoEncontrado, erro };
}
```

## New Page: PaginaDesabafo

```tsx
// src/pages/PaginaDesabafo.tsx
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ComentarioSection } from '../components/ComentarioSection';
import { useDesabafo } from '../hooks/useDesabafo';
import { useAuth } from '../hooks/useAuth';
import { useReacoes } from '../hooks/useReacoes';

export function PaginaDesabafo() {
  const { numero } = useParams<{ numero: string }>();
  const numeroInt = parseInt(numero ?? '', 10);
  const { usuario, isAdmin } = useAuth();
  const { desabafo, carregando, naoEncontrado, erro } = useDesabafo(
    isNaN(numeroInt) ? -1 : numeroInt
  );
  const { reagir } = useReacoes();

  if (carregando) return <div className="pagina-desabafo__loading">Carregando...</div>;

  if (naoEncontrado || isNaN(numeroInt)) {
    return (
      <div className="pagina-desabafo__nao-encontrado">
        <p>Desabafo não encontrado.</p>
        <Link to="/">Voltar ao início</Link>
      </div>
    );
  }

  if (erro) return <div className="pagina-desabafo__erro">{erro}</div>;

  return (
    <div className="app-container">
      <Header usuario={usuario} isAdmin={isAdmin} />
      <main className="pagina-desabafo">
        {/* card do desabafo + reações */}
        {/* ComentarioSection sem limite de 50 */}
      </main>
    </div>
  );
}
```

## Route Addition

```tsx
// App.tsx
import { PaginaDesabafo } from './pages/PaginaDesabafo';

// Dentro de <Routes>:
<Route path="/desabafo/:numero" element={<PaginaDesabafo />} />
```

## Firestore Index

Index de campo único necessário para `where('numero', '==', ...)`:

```json
// firestore.indexes.json
{
  "indexes": [],
  "fieldOverrides": [
    {
      "collectionGroup": "desabafos",
      "fieldPath": "numero",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" }
      ]
    }
  ]
}
```

## Security Rules

```javascript
// Adicionar ao firestore.rules
match /config/counters {
  allow read: if true;                          // leitura pública
  allow write: if request.auth != null;         // escrita apenas autenticado
}
```

## Migration Note

Desabafos existentes sem o campo `numero` continuam aparecendo no feed normalmente. O `DesabafoCard` omite o badge quando `numero` é `undefined`. Esses desabafos não terão uma `PaginaDesabafo` acessível por URL — comportamento aceitável para o MVP.

## Correctness Properties

### Property 1: Unicidade do numero
Para quaisquer dois desabafos publicados (simultaneamente ou não), seus campos `numero` devem ser diferentes. A transação Firestore garante isso via leitura-modificação-escrita atômica.

### Property 2: Numero é sempre positivo e incremental
Para qualquer sequência de N publicações bem-sucedidas, os valores de `numero` devem formar um subconjunto de `{1, 2, 3, ..., N}` sem repetição. O contador `totalDesabafos` no documento `config/counters` deve sempre ser igual ao maior `numero` já atribuído.

### Property 3: naoEncontrado para numero invalido
Para qualquer valor de `:numero` na URL que não corresponda a nenhum desabafo (numero inexistente, string não numérica, negativo), o hook `useDesabafo` deve retornar `naoEncontrado: true` e o componente deve exibir a mensagem de não encontrado.
