---
inclusion: auto
---

# React — Boas Práticas de Componentes

## Stack

- React 18 com TypeScript
- Vite como bundler
- react-router-dom v6 para roteamento
- CSS puro (sem styled-components, Tailwind ou CSS Modules)
- Firebase SDK v9+ (imports modulares)

## Function Components

- **Sempre usar function components** com arrow functions ou function declarations
- **Nunca usar class components**
- Preferir `function NomeComponente()` (function declaration) para componentes exportados
- Usar `export default` apenas no componente principal do arquivo

```tsx
// ✅ Correto
interface HeaderProps {
  titulo: string;
}

function Header({ titulo }: HeaderProps) {
  return <header><h1>{titulo}</h1></header>;
}

export default Header;
```

## Organização de Arquivos

```
src/components/
├── Header.tsx
├── Header.css
├── LoginButton.tsx
├── LoginButton.css
├── Feed.tsx
├── Feed.css
└── ...
```

- Um componente por arquivo
- CSS do componente no mesmo diretório, mesmo nome
- Importar o CSS no topo do componente: `import './Header.css'`

## Props e Tipos

- Definir interfaces de props no mesmo arquivo do componente
- Nomear como `NomeComponenteProps`
- Usar destructuring nos parâmetros
- Não usar `React.FC` — tipar props diretamente

```tsx
// ✅ Correto
interface InputBoxProps {
  onPublicar: (texto: string, sentimento: Sentimento) => Promise<void>;
  isPublicando: boolean;
}

function InputBox({ onPublicar, isPublicando }: InputBoxProps) { ... }
```

## Hooks

- Custom hooks em `src/hooks/` com prefixo `use`
- Um hook por arquivo
- Retornar objetos nomeados (não arrays) para hooks com múltiplos valores
- Usar `useState` para estado local, `useEffect` para side effects
- Sempre limpar side effects no return do `useEffect`

```tsx
// ✅ Correto
function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => { ... });
    return () => unsubscribe();
  }, []);

  return { usuario, isLoading, login, logout, isAutenticado: !!usuario };
}
```

## Estado e Renderização

- Manter estado o mais próximo possível de onde é usado
- Elevar estado apenas quando necessário para compartilhar entre irmãos
- Evitar re-renders desnecessários: não criar objetos/arrays inline em props
- Usar `useCallback` apenas quando passar callbacks para componentes filhos que dependem de referência estável

## Padrões de Componentes

### Renderização condicional
```tsx
// ✅ Preferir early return ou ternário simples
{isLoading && <LoadingIndicator />}
{!isLoading && desabafos.length === 0 && <EmptyState />}
{!isLoading && desabafos.length > 0 && <Lista />}
```

### Listas
```tsx
// ✅ Sempre usar key única e estável (ID do documento)
{desabafos.map((d) => (
  <DesabafoCard key={d.id} desabafo={d} onReagir={handleReagir} />
))}
```

### Eventos
```tsx
// ✅ Handler com prefixo handle
function InputBox({ onPublicar }: InputBoxProps) {
  const handleSubmit = async () => { ... };
  return <button onClick={handleSubmit}>Publicar</button>;
}
```

## Acessibilidade Básica

- Botões com texto descritivo ou `aria-label`
- Inputs com `label` associado ou `aria-label`
- Usar elementos semânticos: `<header>`, `<main>`, `<section>`, `<button>`
- Não usar `<div>` com `onClick` — usar `<button>` para ações

## Idioma do Código

- **Nomes de variáveis, funções, componentes e tipos**: em português (seguindo o padrão do projeto)
- **Comentários**: em português
- **Mensagens de UI**: em português
- Exceções: termos técnicos universais (props, hooks, state, etc.)

## Tratamento de Erros na UI

- Exibir mensagens de erro amigáveis, nunca stack traces
- Mensagens temporárias desaparecem após 3 segundos
- Manter dados do usuário em caso de falha (não limpar formulários)
- Desabilitar botões durante operações assíncronas para evitar duplo-clique
