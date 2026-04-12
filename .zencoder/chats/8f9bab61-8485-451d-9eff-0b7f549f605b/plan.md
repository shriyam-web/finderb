# Spec and build

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:

- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [ ] Step: Technical Specification

Assess the task's difficulty, as underestimating it leads to poor outcomes.

- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:

- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `d:\Projects\boomb\.zencoder\chats\8f9bab61-8485-451d-9eff-0b7f549f605b/spec.md` with:

- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `d:\Projects\boomb\.zencoder\chats\8f9bab61-8485-451d-9eff-0b7f549f605b/spec.md`:

- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `d:\Projects\boomb\.zencoder\chats\8f9bab61-8485-451d-9eff-0b7f549f605b/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

**Stop here.** Present the specification (and plan, if created) to the user and wait for their confirmation before proceeding.

---

### [ ] Step 1: Update Configuration and Package Files
- Modify `package.json` and `package-lock.json` to reflect the name `finderb`.
- Update `docker-compose.yml` to change `POSTGRES_DB` to `finderb`.
- **Verification**: Run `npm install` to update the lockfile properly and ensure Docker starts correctly (if possible).

### [ ] Step 2: Update Brand Name in UI Components
- Search and replace `Boomb` with `FinderB` in `Navbar.tsx`, `Footer.tsx`, and `SearchBar.tsx`.
- Update alt tags and display titles in these components.
- **Verification**: Check the rendered UI to ensure "FinderB" is correctly displayed.

### [ ] Step 3: Update Page Content and SEO Metadata
- Replace `Boomb` with `FinderB` in `app/about/page.tsx`, `app/layout.tsx`, and all policy pages (`privacy`, `terms`, `policy`, `contact`).
- Update `app/robots.ts` and `app/sitemap.ts` to reflect the new brand name.
- **Verification**: Inspect the HTML source and meta tags for the new brand name.

### [ ] Step 4: Final Verification and Cleanup
- Run a global case-insensitive search for `boomb` to ensure no instances are left.
- Execute `npm run lint` (if available) to verify no syntax or broken reference issues.
- Update `README.md` with the new project name.
- **Verification**: Final grep check returns no results for the old brand name.

---

### [ ] Step: Final Report

After completion, write a report to `d:\Projects\boomb\.zencoder\chats\8f9bab61-8485-451d-9eff-0b7f549f605b/report.md` describing:
- What was implemented
- How the solution was tested
- The biggest issues or challenges encountered
