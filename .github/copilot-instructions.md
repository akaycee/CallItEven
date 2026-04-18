# Copilot Rules for CallItEven

## No Emoji or Special Characters in Source Code

**Never write emoji characters (e.g., 💡🎉💰✨🤔🎯💸) or non-ASCII special characters (e.g., · • →) directly into source files.**

These characters frequently get corrupted into mojibake (e.g., `ðŸ'¡`, `Â·`) due to encoding mismatches between tools, editors, and terminals.

### Instead, use:
- **HTML entities** in JSX: `&middot;`, `&bull;`, `&#x1F4A1;`
- **Unicode escapes** in JS strings: `'\u00B7'`, `'\u2022'`, `'\uD83D\uDCA1'`
- **Hex escapes** for simple cases: `'\xB7'`

### Examples:
```jsx
// BAD — raw emoji/special chars that will corrupt
💡 Click to view all expenses
1/27/2026 · Employment

// GOOD — safe alternatives
{'\uD83D\uDCA1'} Click to view all expenses
1/27/2026 &middot; Employment
1/27/2026 {'\u00B7'} Employment
```

This rule applies to all `.js`, `.jsx`, `.ts`, `.tsx` files in the project.
