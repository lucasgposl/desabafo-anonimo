---
inclusion: always
---

# Spec Naming Conventions

All specs for this project follow a strict naming convention to ensure scalability and clarity.

## Directory Structure

```
.kiro/specs/
├── desabafo-anonimo/              ← base project spec (never rename)
├── feature-001-admin-management/  ← features
├── feature-002-.../
├── enhance-001-.../               ← enhancements to existing features
├── fix-001-.../                   ← bug fixes
```

## Naming Pattern

```
{type}-{number}-{kebab-case-name}
```

| Type | Prefix | When to use |
|------|--------|-------------|
| New functionality | `feature-` | Adding something that doesn't exist |
| Improvement to existing | `enhance-` | Changing/improving existing behavior |
| Bug fix | `fix-` | Correcting broken behavior |

## Rules

- Numbers are zero-padded to 3 digits: `001`, `002`, `003`...
- Numbers are sequential per type (features have their own sequence, enhancements have their own, fixes have their own)
- Names are kebab-case and descriptive
- Every spec directory must contain: `requirements.md`, `design.md`, `tasks.md`, `.config.kiro`

## Examples

```
feature-001-admin-management
feature-002-comment-reactions
enhance-001-wider-layout
enhance-002-sentiment-icons
fix-001-comment-not-saving
fix-002-filter-returning-empty
```

## Current Specs

| Spec | Type | Status |
|------|------|--------|
| `desabafo-anonimo` | base | completed |
| `feature-001-admin-management` | feature | completed |
