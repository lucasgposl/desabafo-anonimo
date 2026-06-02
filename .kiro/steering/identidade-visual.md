---
inclusion: auto
---

# Identidade Visual — Desabafo Anônimo

## Filosofia

A interface transmite **anonimato, introspecção e acolhimento**. O tema escuro reforça privacidade — como um espaço protegido onde o usuário pode se expressar sem ser visto.

## Paleta de Cores (CSS Custom Properties)

Sempre usar as variáveis definidas em `src/styles/variables.css`. Nunca usar valores hex diretamente nos componentes.

| Token | Hex | Uso |
|-------|-----|-----|
| `--cor-fundo` | `#1a1a2e` | Fundo principal |
| `--cor-superficie` | `#16213e` | Cards, containers |
| `--cor-superficie-alt` | `#0f3460` | Inputs, selects, áreas interativas |
| `--cor-texto` | `#e0e0e0` | Texto principal |
| `--cor-texto-secundario` | `#a0a0a0` | Timestamps, placeholders |
| `--cor-borda` | `#2a2a4a` | Bordas sutis |
| `--cor-acento` | `#7b68ee` | Botões primários, links |
| `--cor-acento-hover` | `#9b8afb` | Hover de botões |
| `--cor-sucesso` | `#2d6a4f` | Mensagens de sucesso |
| `--cor-erro` | `#9b2335` | Mensagens de erro |

### Cores por Sentimento (borda lateral dos cards)

| Sentimento | Token | Hex |
|------------|-------|-----|
| Tristeza | `--cor-tristeza` | `#4a90d9` |
| Raiva | `--cor-raiva` | `#d94a4a` |
| Alívio | `--cor-alivio` | `#4ad9a0` |

## Tipografia

- Fonte: **Inter** (Google Fonts)
- Título principal: `1.75rem`, peso 700
- Subtítulos: `1.25rem`, peso 600
- Texto do desabafo: `1rem`, peso 400
- Texto secundário: `0.875rem`, peso 400
- Botões: `0.875rem`, peso 500

## Espaçamento e Layout

- Container máximo: **640px** centralizado
- Border-radius dos cards: **12px**
- Borda lateral do sentimento: **4px** sólida
- Padding interno dos cards: **1.25rem**
- Gap entre cards: **1rem**
- Sombra dos cards: `0 2px 8px rgba(0, 0, 0, 0.3)`

## Responsividade

- Breakpoint principal: **720px**
- Abaixo de 720px: container ocupa largura total com padding interno
- Mínimo suportado: **320px** sem scroll horizontal
- Usar Flexbox para layouts, não Grid (manter simplicidade)

## Efeitos e Transições

- Hover em botões: `transition: all 0.2s ease`
- Botões de reação no hover: `transform: scale(1.05)`
- Mensagens de feedback: fade-in/fade-out de **300ms**
- Loading: animação de pulso

## Convenções de CSS

1. **Um arquivo CSS por componente**: `NomeComponente.css` ao lado de `NomeComponente.tsx`
2. **Sem CSS-in-JS**: usar CSS puro com classes
3. **Nomenclatura de classes**: kebab-case descritivo (ex: `.desabafo-card`, `.input-box`, `.feed-controls`)
4. **Sem `!important`**: resolver especificidade pela estrutura
5. **Variáveis globais em `src/styles/variables.css`**: nunca duplicar valores
6. **Reset e base em `src/styles/global.css`**: box-sizing, font-family, body styles
7. **Responsivo em `src/styles/responsive.css`**: media queries centralizadas
8. **Ordem das propriedades**: posicionamento → display → box model → tipografia → visual → misc
