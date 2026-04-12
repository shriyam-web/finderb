# Technical Specification - Rename Project to FinderB

## Technical Context
- **Project Name**: boomb (Current) -> FinderB (New)
- **Primary Languages**: TypeScript, React, Next.js
- **Key Files**: `package.json`, `docker-compose.yml`, Layout components, and various page components.

## Implementation Approach
1. **Search and Replace**: Execute a case-sensitive and case-insensitive search and replace across the entire codebase.
   - `boomb` -> `finderb` (lowercase, for package names, DB names, etc.)
   - `Boomb` -> `FinderB` (PascalCase, for UI display, brand names, and component descriptions)
2. **Metadata Update**: Update SEO metadata, alt tags, and copyright notices.
3. **Environment/Configuration**: Update `docker-compose.yml` and any other configuration files.
4. **Documentation**: Update `README.md` and other documentation files.

## Source Code Structure Changes
- No structural changes to the directory or file tree are expected, only content modifications within files.

## Data Model / API / Interface Changes
- **Database**: `POSTGRES_DB` in `docker-compose.yml` will be updated from `boomb` to `finderb`.
- **API**: No functional API changes, only descriptive updates if "boomb" appears in API responses or documentation.

## Verification Approach
- **Linting**: Run `npm run lint` (if available) to ensure no syntax errors were introduced.
- **Visual Inspection**: Manually verify key pages (Navbar, Footer, About, Policy) for correct branding.
- **Grep Verification**: Run a final `grep` to ensure no instances of "boomb" remain (except where explicitly excluded, like older lockfiles if necessary).
