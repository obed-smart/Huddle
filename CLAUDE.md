# Huddle — Project Guidelines

Guidance for Claude (and any AI assistant) working in this repository.

## Git Branching and Collaboration Rules

These rules govern how you interact with Git, GitHub, and the repository's
branches. **They are mandatory.** If a task appears to require violating any of
them, stop and request explicit permission before proceeding.

Protect the integrity of the `main` branch and preserve the repository's
existing Git history.

### Branch management

1. Never work directly on the `main` branch.
2. Always create a dedicated feature, fix, or refactor branch before
   implementing changes.
3. Use descriptive branch names following these conventions:
   - `feature/feature-name`
   - `fix/bug-name`
   - `refactor/module-name`
   - `docs/documentation-name`
4. Never force push to any remote branch.
5. Never delete remote branches without explicit permission.
6. Never merge pull requests into `main`.
7. Never bypass repository branch protection rules.

### Development workflow

8. Before committing, run relevant tests, TypeScript checks, and linting where
   available.
9. Do not commit code that has known failing tests without explicitly reporting
   the failure and obtaining permission.
10. Use descriptive Conventional Commit messages. Examples:
    - `feat: implement audio to video upgrade`
    - `fix: resolve socket reconnection issue`
    - `refactor: improve call service architecture`
    - `docs: update API documentation`
11. Push completed changes to the appropriate feature branch.
12. Do not push directly to `main`, under any circumstances.

### Reporting and communication

13. After completing a task, provide a summary containing:
    - Files created, modified, or deleted.
    - Implementation decisions and architectural considerations.
    - Tests and checks performed, including their results.
    - Outstanding issues, limitations, or potential risks.
14. Explain significant architectural decisions and trade-offs rather than
    making unexplained changes.
15. Report any tests that could not be executed and explain why.
16. Do not claim that tests passed unless they were actually executed
    successfully.

### Pull request and merging policy

17. When implementation is complete, push the feature branch to GitHub.
18. Provide a summary of the changes and instructions for creating a pull
    request.
19. Do not approve or merge your own pull requests.
20. The repository owner is responsible for reviewing and merging changes into
    `main`.
