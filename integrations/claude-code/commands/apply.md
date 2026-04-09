# /logic:apply

Apply a LOGIC.md reasoning scaffold to the current task.

The argument (`$ARGUMENTS`) is the path to a `*.logic.md` file. If no argument is provided, ask the user to specify a file path.

Steps:
1. Read the file at the path provided in `$ARGUMENTS`
2. Call the `logic_md_parse` MCP tool with the file content as the `content` argument to extract the parsed spec
3. Call the `logic_md_compile_workflow` MCP tool with the file content as the `content` argument to get the full compiled reasoning scaffold
4. Present the compiled scaffold clearly with:
   - The workflow name and description
   - Each step's compiled prompt segment, clearly separated
5. Ask the user: "Would you like me to apply this reasoning scaffold to your current task? If yes, describe what you're working on and I'll follow the scaffold steps."

If the file does not exist or cannot be read, say so and suggest running `/logic:status` to see available LOGIC.md files.

If the file is invalid LOGIC.md, show the validation errors from `logic_md_validate`.
