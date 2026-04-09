# /logic:init

Scaffold a new LOGIC.md file from a template.

The argument (`$ARGUMENTS`) is an optional template name (e.g., `code-review`, `debugger`, `reviewer`).

Steps:
1. Call `logic_md_list_templates` to get the list of available templates
2. If a template name was provided in `$ARGUMENTS`:
   - Call `logic_md_init` with `template_name` set to the provided name
   - Show the generated LOGIC.md content
   - Ask the user: "Where would you like to save this file? (e.g., `./my-workflow.logic.md`)"
   - Write the file to the path the user specifies
3. If no template name was provided:
   - Display the available templates as a numbered list with their descriptions
   - Ask the user to pick one by name or number
   - Once they pick, call `logic_md_init` with the chosen `template_name`
   - Show the generated content and ask where to save it

After saving, confirm: "Created `<path>`. Run `/logic:validate` to check it, or `/logic:apply <path>` to use it."
