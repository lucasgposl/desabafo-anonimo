# Requirements Document

## Introduction

Este documento especifica os requisitos para melhorias de UI/UX e navegação no projeto "Desabafo Anônimo". As melhorias incluem: título clicável no Header para navegar à home, criação de um Footer com link para uma nova página "Sobre", destaque visual do link ativo no Header, ênfase visual no texto do DesabafoCard, e remoção do filtro de sentimento na PaginaFeed.

## Glossary

- **Header**: Componente de cabeçalho presente em todas as páginas, contendo título, aviso e links de navegação
- **Footer**: Novo componente de rodapé com copyright e link para a página Sobre
- **DesabafoCard**: Componente de card que exibe um desabafo individual no feed
- **PaginaFeed**: Página dedicada ao feed de desabafos na rota /feed
- **PaginaSobre**: Nova página informativa sobre o projeto, acessível pela rota /sobre
- **FeedControls**: Componente de filtro por sentimento usado atualmente na PaginaFeed
- **Link_Ativo**: Estado visual que indica qual link de navegação corresponde à rota atual
- **Router**: Sistema de roteamento da aplicação (React Router)

## Requirements

### Requirement 1: Título do Header como link para a home

**User Story:** As a user, I want to click the "Desabafo Anônimo" title in the header to navigate back to the home page, so that I can easily return to the main page from anywhere.

#### Acceptance Criteria

1. WHEN the user clicks the Header title "Desabafo Anônimo", THE Header SHALL navigate the user to the route "/"
2. THE Header SHALL render the title "Desabafo Anônimo" wrapped in an anchor element (`<a>`) with its `href` resolving to "/" so that screen readers and browser navigation identify it as a link to the home page
3. THE Header SHALL apply `text-decoration: none` and `color: inherit` to the title link element so that it visually matches the existing `header__titulo` styling without displaying a default link underline or color change
4. WHILE the user hovers over or focuses the title link, THE Header SHALL not change the title text color or add underline decoration

### Requirement 2: Componente Footer

**User Story:** As a user, I want to see a footer at the bottom of every page with copyright information and a link to the About page, so that I can access project information and know the site's authorship.

#### Acceptance Criteria

1. THE Footer SHALL display a copyright text containing the "©" symbol, the current year, and the application name "Desabafo Anônimo"
2. THE Footer SHALL contain a react-router-dom Link component pointing to the route "/sobre" with the visible label "Sobre", enabling client-side navigation without full page reload
3. THE Footer SHALL be rendered after the main content area in the document flow on all application routes (/, /feed, /desabafo/:numero, /trends, /moderacao, /sobre)
4. THE Footer SHALL use the existing CSS custom properties (--cor-superficie for background, --cor-texto for text color, --cor-acento for link color) and follow BEM naming convention with the block name "footer"
5. THE Footer SHALL be wrapped in a semantic HTML `<footer>` element to serve as a contentinfo landmark for assistive technologies

### Requirement 3: Página Sobre

**User Story:** As a user, I want to access an "About" page, so that I can learn about the purpose and context of the project.

#### Acceptance Criteria

1. WHEN the user navigates to the route "/sobre", THE Router SHALL render the PaginaSobre component
2. THE PaginaSobre SHALL display a title "Sobre o Desabafo Anônimo" and descriptive paragraphs about the project's purpose: providing an anonymous space for students to express feelings and seek support
3. THE PaginaSobre SHALL include the Header component at the top and the Footer component at the bottom for consistent layout with other pages
4. THE PaginaSobre SHALL be accessible via the Footer "Sobre" link and via direct URL navigation to "/sobre"
5. THE PaginaSobre SHALL mention that the project does not replace professional help and encourage users to seek a psychologist or call CVV (188) if needed

### Requirement 4: Destaque visual do link ativo no Header

**User Story:** As a user, I want to see which navigation link corresponds to the current page, so that I can orient myself within the application.

#### Acceptance Criteria

1. WHILE the user is on a route that matches a navigation link (/feed or /trends, or /moderacao for admins), THE Header SHALL apply the BEM modifier class `header__link-nav--ativo` to the corresponding navigation link element
2. THE Header SHALL style the active navigation link with a visible `border-bottom` using the `--cor-acento` CSS variable, differentiating it from non-active links which have no border-bottom
3. THE Header SHALL apply the active modifier class to at most one navigation link at a time; all other navigation links SHALL NOT have the active modifier class
4. WHEN the user navigates to a different route, THE Header SHALL remove the active modifier class from the previously active link and apply it to the navigation link matching the new route
5. IF the current route does not correspond to any navigation link (e.g., `/` or `/desabafo/:numero`), THEN THE Header SHALL not apply the active modifier class to any navigation link

### Requirement 5: Ênfase visual no texto do DesabafoCard

**User Story:** As a user, I want the desabafo text to be the most visually prominent element in the card, so that I can easily read and focus on the content.

#### Acceptance Criteria

1. THE DesabafoCard SHALL render the desabafo-card__texto element with a font size of 1.125rem (18px), which is larger than the body text size (var(--fonte-corpo): 1rem) and larger than the meta/reactions text size (var(--fonte-secundaria): 0.875rem)
2. THE DesabafoCard SHALL apply a 1px solid border using var(--cor-borda) with a border-radius of 8px and an internal padding of at least 0.75rem around the desabafo-card__texto element to visually frame and separate it from other card content
3. THE DesabafoCard SHALL set a min-height of 120px on the desabafo-card__texto element to ensure the text area dominates the card visually relative to meta info, reactions, and comments sections
4. THE DesabafoCard SHALL maintain a line-height of at least 1.6, use word-break: break-word, and white-space: pre-wrap on the desabafo-card__texto element so that text wraps within the element boundaries without horizontal overflow at any content length
5. THE DesabafoCard SHALL ensure the desabafo-card__texto element does not clip or hide text content when the text exceeds the min-height, allowing the element to expand vertically to fit all content

### Requirement 6: Remoção do filtro de sentimento na PaginaFeed

**User Story:** As a user, I want a simplified feed page without sentiment filtering, so that I can browse all desabafos without unnecessary UI complexity.

#### Acceptance Criteria

1. THE PaginaFeed SHALL NOT render the FeedControls component nor its associated sentiment filter select element
2. THE PaginaFeed SHALL invoke useDesabafos with the hardcoded value 'todos', displaying all desabafos regardless of sentiment
3. THE PaginaFeed SHALL NOT declare a filtro state variable nor a handleFiltroChange handler
4. THE PaginaFeed SHALL render the Feed component preserving reactions (onReagir), navigation to individual desabafo (onVerDesabafo), pagination (onLoadMore with "Carregar mais" button), loading states, and the empty state message
5. THE PaginaFeed SHALL NOT render a desabafo count indicator (previously shown in FeedControls)
