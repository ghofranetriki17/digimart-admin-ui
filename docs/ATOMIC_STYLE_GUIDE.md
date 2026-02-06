# Atomic Design Style Guide

## Folder Structure
- `src/components/atoms/` Small, reusable primitives (Button, TextInput).
- `src/components/molecules/` Combinations of atoms that form a small feature (CardGrid, FilterBar).
- `src/components/organisms/` Larger UI blocks that compose sections (Sidebar, PageHeader).
- `src/templates/` Page-level structure and layout wrappers (StandardPage, AuthPage).
- `src/pages/` Route-level views. Pages should compose templates + organisms.

## Naming Rules
- Component folder: `PascalCase` (e.g., `Button/`, `PageHeader/`).
- Component file: same name as folder (`Button.jsx`, `Button.css`).
- One component per folder. Export from `index.js` in the folder.

## CSS Rules
- Keep CSS co-located with the component.
- Class names: `kebab-case` and scoped by component (`.page-header`, `.tenant-wallet-form`).
- Avoid global selectors; use the component root class.
- Layout belongs to templates. Use CSS variables for overrides:
  - `--page-gap` for vertical spacing.
  - `--page-max-width` for wider pages.
  - `--page-padding` / `--page-padding-mobile` when needed.

## Composition Guidelines
- Atoms must not import molecules/organisms.
- Molecules may import atoms only.
- Organisms may import atoms + molecules.
- Templates may import atoms + molecules + organisms.
- Pages should import templates and compose them with organisms/molecules.

## Testing
- Place tests next to the component (`Component.test.jsx`).
- Prefer Testing Library and user events.

## Quick Checklist (New Component)
1. Pick the correct layer (`atoms`, `molecules`, `organisms`, `templates`).
2. Create folder with PascalCase name.
3. Add `Component.jsx`, `Component.css`, and `index.js`.
4. Keep layout in templates; use CSS variables for page spacing.
5. Run `npm run audit:atomic` before committing.

## Example Import
```
import Button from '../../components/atoms/Button'
import FilterBar from '../../components/molecules/FilterBar'
import PageHeader from '../../components/organisms/PageHeader'
import StandardPage from '../../templates/StandardPage'
```
