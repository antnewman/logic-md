# /logic:compile

Compile a specific step from a LOGIC.md file into its prompt segment.

The argument (`$ARGUMENTS`) should be in the format: `<file_path> <step_name>`
Example: `/logic:compile ./review.logic.md analyze`

Steps:
1. Parse `$ARGUMENTS` to extract the file path (first token) and step name (second token)
2. Read the file at the specified path
3. If a step name was provided:
   - Call `logic_md_compile_step` with `content` (the file content) and `step_name` (the step name)
   - Display the compiled prompt segment with clear formatting under a header like `## Compiled Step: <step_name>`
4. If no step name was provided (only file path given):
   - Call `logic_md_parse` with the file content to extract the spec
   - List the available steps by name and description
   - Ask the user: "Which step would you like to compile?"
   - Once they specify, call `logic_md_compile_step` and display the result

If the file does not exist, say so. If the step name is not found in the file, list the available steps and ask the user to pick one.
