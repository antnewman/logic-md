# /logic:respond-issue

Draft a response to a GitHub issue on the logic-md repository.

## Tone & Style

- Professional but warm — this is an open-source project that values contributors
- Technical precision — reference specific files, line numbers, and spec sections
- Acknowledge good catches — external contributors who find real bugs deserve recognition
- Be transparent about the state of things — if something was an oversight, say so

## Response Template

For bug reports with a clear fix:

```markdown
Thanks for the detailed report, @<username> — this is a great catch.

You're right that [describe the problem]. [Brief explanation of why it happened].

**Fix plan:**
- [Specific change 1]
- [Specific change 2]

[If they suggested a fix]: Your suggested approach (Option A) is exactly what we'll go with because [reason].

I'll get this into the next patch. [If they offered a PR]: Happy to review a PR if you'd like to submit one, or I can handle it directly.
```

For feature requests or spec extension proposals:

```markdown
Interesting proposal. [Acknowledge the use case they described].

A few considerations:
- [Technical consideration]
- [Compatibility consideration]

[If positive]: I'd like to explore this further — opening a discussion thread / adding to the roadmap.
[If needs more thought]: Let me think about this more carefully. The tricky part is [specific concern].
```

## Before Responding

1. **Triage first** — Run `/logic:triage-issue` to understand the issue fully
2. **Check if fixed** — Search the codebase for whether this is already addressed
3. **Check related issues** — Link to related issues if they exist
4. **Draft fix first** — Having a concrete fix plan makes the response more credible

## After Responding

- Apply appropriate labels
- If committing a fix, reference the issue in the commit: `fix(schema): description (closes #N)`
- If the contributor offered a PR, provide clear guidance on what the PR should contain
