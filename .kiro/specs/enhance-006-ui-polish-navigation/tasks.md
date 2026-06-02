# Implementation Plan: UI Polish & Navigation Enhancement

## Overview

This plan implements six UI/UX improvements to the "Desabafo Anônimo" application: making the Header title a navigable link, creating a Footer component, adding an About page, highlighting the active navigation link, improving DesabafoCard text emphasis, and simplifying PaginaFeed by removing FeedControls. All changes are in the presentation layer using React, TypeScript, React Router, and CSS with BEM naming.

## Tasks

- [x] 1. Header title as link and active link highlight
  - [x] 1.1 Wrap Header title in a Link to "/" and add active link logic
    - Import `useLocation` from react-router-dom
    - Wrap `<h1>` text in `<Link to="/">` with classes to remove default link styling
    - Use `useLocation().pathname` to determine the current route
    - Apply `header__link-nav--ativo` class to the navigation link whose `to` matches the current pathname (use `startsWith` for matching)
    - Ensure at most one link receives the active class; none if route doesn't match `/feed`, `/trends`, or `/moderacao`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.3, 4.4, 4.5_

  - [x] 1.2 Add Header CSS for title link and active link modifier
    - Add `.header__titulo-link` styles: `text-decoration: none`, `color: inherit`, no hover color change
    - Add `.header__link-nav--ativo` styles: `border-bottom` using `var(--cor-acento)`
    - _Requirements: 1.3, 1.4, 4.2_

  - [ ]* 1.3 Write unit tests for Header title link and active link behavior
    - Test that the title renders as an anchor element with href resolving to "/"
    - Test that hovering/focusing the title link does not change styling (no underline/color)
    - Test that the active class is applied to the correct link for routes `/feed`, `/trends`, `/moderacao`
    - Test that no link has the active class when route is `/`, `/sobre`, or `/desabafo/123`
    - _Requirements: 1.1, 1.2, 4.1, 4.3, 4.5_

  - [ ]* 1.4 Write property test for active link correctness
    - **Property 1: Active link correctness**
    - Generate random routes from known paths (`/feed`, `/trends`, `/moderacao`) and arbitrary non-matching paths (`/`, `/sobre`, `/desabafo/42`)
    - Assert: for matching routes, exactly one link has `header__link-nav--ativo`; for non-matching routes, no link has the class
    - Use fast-check with minimum 100 iterations
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5**

- [x] 2. Create Footer component
  - [x] 2.1 Create Footer.tsx and Footer.css
    - Create `src/components/Footer.tsx` as a functional component with no props
    - Render a semantic `<footer>` element with BEM block name "footer"
    - Display copyright text: "© {currentYear} Desabafo Anônimo" using `new Date().getFullYear()`
    - Include a `<Link to="/sobre">` with label "Sobre"
    - Create `src/components/Footer.css` using existing CSS custom properties (`--cor-superficie`, `--cor-texto`, `--cor-acento`) and BEM naming
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ]* 2.2 Write unit tests for Footer component
    - Test that Footer renders a `<footer>` semantic element
    - Test that copyright text contains "©", the current year, and "Desabafo Anônimo"
    - Test that the "Sobre" link points to "/sobre"
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 3. Create PaginaSobre page and register route
  - [x] 3.1 Create PaginaSobre.tsx and PaginaSobre.css
    - Create `src/pages/PaginaSobre.tsx` with Header (including LoginButton) and Footer
    - Display title "Sobre o Desabafo Anônimo"
    - Include descriptive paragraphs about the project purpose (anonymous space for students)
    - Include professional help disclaimer mentioning psychologist and CVV (188)
    - Create `src/pages/PaginaSobre.css` for page-specific styling
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 3.2 Add /sobre route in App.tsx
    - Import `PaginaSobre` component
    - Add `<Route path="/sobre" element={<PaginaSobre />} />` to the Routes
    - _Requirements: 3.1, 3.4_

  - [ ]* 3.3 Write unit tests for PaginaSobre
    - Test that PaginaSobre renders the title "Sobre o Desabafo Anônimo"
    - Test that descriptive text about the project is present
    - Test that the professional help disclaimer is rendered (CVV 188 mention)
    - Test that Header and Footer are present in the page
    - _Requirements: 3.2, 3.3, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. DesabafoCard text visual emphasis (CSS only)
  - [x] 5.1 Update DesabafoCard.css for text emphasis
    - Change `.desabafo-card__texto` font-size to `1.125rem`
    - Add `border: 1px solid var(--cor-borda)`
    - Add `border-radius: 8px`
    - Add `padding: 0.75rem`
    - Add `min-height: 120px`
    - Maintain existing `line-height: 1.6`, `word-break: break-word`, `white-space: pre-wrap`
    - Ensure no `overflow: hidden` — text expands vertically
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Simplify PaginaFeed by removing FeedControls
  - [x] 6.1 Remove FeedControls from PaginaFeed page component
    - Remove import of `FeedControls` from `src/pages/PaginaFeed.tsx`
    - Remove `filtro` state and `handleFiltroChange` handler
    - Remove `total` from useDesabafos destructuring
    - Call `useDesabafos('todos')` directly with hardcoded value
    - Remove `<FeedControls>` rendering; keep only `<Feed>` with existing props
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.2 Write unit tests for simplified PaginaFeed
    - Test that FeedControls is not rendered
    - Test that Feed component is rendered with correct props (onReagir, onVerDesabafo, onLoadMore)
    - Test that no sentiment filter select element is present
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 7. Add Footer to all pages
  - [x] 7.1 Add Footer component to all existing pages
    - Add Footer import and render to PaginaFeed (`src/pages/PaginaFeed.tsx`)
    - Add Footer import and render to PaginaTrends (`src/pages/PaginaTrends.tsx`)
    - Add Footer import and render to PaginaDesabafo (`src/pages/PaginaDesabafo.tsx`)
    - Add Footer import and render to PaginaModeracao (`src/components/PaginaModeracao.tsx`)
    - Add Footer import and render to the root PaginaFeed in App.tsx
    - _Requirements: 2.3_

  - [ ]* 7.2 Write integration test for Footer presence on all routes
    - Test that Footer renders on routes: `/`, `/feed`, `/trends`, `/sobre`
    - Test that clicking the "Sobre" link in Footer navigates to `/sobre`
    - _Requirements: 2.3, 3.4_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property test validates universal correctness of active link behavior (Property 1 from design)
- Unit tests validate specific examples and edge cases
- All changes are in the presentation layer — no backend or data model modifications
- The project uses fast-check for property-based tests and Jest + Testing Library for unit tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.1", "6.2"] },
    { "id": 2, "tasks": ["1.4", "3.2", "3.3"] },
    { "id": 3, "tasks": ["7.1"] },
    { "id": 4, "tasks": ["7.2"] }
  ]
}
```
