Read first:

- project-overview.md
- docs/ARCHITECTURE.md
- docs/API_CONTRACTS.md
- docs/IMPLEMENTATION_PROGRESS.md

Rules:

- React + TypeScript only
- Feature-based structure
- React Query for server state
- Axios for HTTP
- React Hook Form + Zod for forms

Forbidden:

- Redux
- MobX
- Recoil
- CQRS
- DDD
- Over-engineering

Architecture:

Views
  -> Hooks
  -> API Layer
  -> Backend

No direct API calls inside components.

Keep components small.

Prefer composition over inheritance.

Generate compile-ready code only.