# Code Workflow

<!-- managed:linked-repos -->
## Linked Repositories
- heathergerdes360-arch/NichePulse
<!-- /managed:linked-repos -->

## Owner's Workflow (Commit → Push → Test → Merge)

This is the required workflow for every code change. It keeps GitHub as the always-up-to-date source of truth — backup, review, and handoff all depend on it.

### The Cycle
1. **Make a fix** (or any code change) on a feature branch
2. **Commit it** with a clear, descriptive message
3. **Push to GitHub immediately** — after EVERY commit, no batching
4. **Test** the change (run the app, check syntax, hit the endpoints)
5. Once tested and working, **merge into `main`**
6. **Pull the updated `main`** into the working branch before starting the next fix

### Why
- GitHub is always current — backup is automatic, never stale
- The owner can review exact code at any point
- If another developer jumps in, they have the latest
- Progress is independently verifiable (no reliance on status updates)

### Branch Strategy
- Work on feature branches (e.g. `fix/missing-auth`, `feat/export-csv`)
- Every commit is pushed immediately — no local commit backlog
- Merge into `main` only after the change is tested and working
- Squash merge preferred for clean history unless otherwise specified

## Notes
- The team lead can update this file to reflect the owner's preferences (outside the managed block above, which is overwritten when the owner changes the allow-listed repositories)
- If the owner provides specific instructions about code review, branch strategy, or merge policies, update this document accordingly
- Members: read this file before starting any code task
