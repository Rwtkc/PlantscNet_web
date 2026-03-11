# Project Instructions

- Do not create `docs/plans/` documents for this repository unless the user explicitly asks for them.
- Prefer direct implementation and concise inline explanations over project-internal planning artifacts.
- If any file under `server/` changes, explicitly remind the user to sync those changed server files to the deployment host and include the restart command `pm2 restart PlantScNet_server`.
- Treat file size as an engineering constraint in this repository.
- Use `400` lines as a warning threshold and `600` lines as the default split threshold for code and CSS files.
- If a file is over `600` lines and the requested change would make it larger, the agent should prefer splitting it into smaller files instead of continuing to grow the file.
- For files over `800` lines, the agent should assume refactoring or extraction is needed unless there is a strong reason not to.
- When splitting large files, preserve behavior, keep responsibilities separated, and prefer extracting components, helpers, API clients, or style sections rather than doing cosmetic churn.
- The agent does not need to stop and ask before splitting an oversized file if the split is a straightforward part of the requested work.
