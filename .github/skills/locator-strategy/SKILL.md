---
name: locator-strategy
description: >
  Discovers and validates Playwright locators from the live application using Playwright MCP.
  Use this skill whenever the user needs to find a locator for any element on any page — even
  if they just say "what's the locator for X", "how do I select the login button", "find the
  selector for Y", or "I need to target this element". Also use it when a page object needs
  new locators, when an existing locator is broken, or when you are about to write a test and
  need to know how to reach a specific element. Never guess or hard-code a locator without
  first validating it against the live page through this skill.
---

# locator-strategy

A skill for discovering, evaluating, and validating Playwright locators against the **live**
application via Playwright MCP.

The output of this skill is a single validated locator expression plus the reasoning behind
the choice. This skill never creates or modifies test files — its only responsibility is
locator discovery and validation.

---

## Core principle: never guess

Every locator must be confirmed against the real page before being returned. If a locator
looks correct but has not been verified with a live element check, it is not done.

---

## Workflow

Follow these steps in order. Do not skip steps, and do not move on until each step is
confirmed.

### Step 1 — Open the application

Use `browser_navigate` (Playwright MCP) to navigate to the base URL. Confirm the page
loaded by checking the page title or a known landmark.

```
browser_navigate({ url: "<base_url>" })
```

### Step 2 — Navigate to the target page

If the element is not on the landing page, navigate to the correct page. Use whatever
navigation the application provides (menu, direct URL, etc.). Confirm you are on the right
page before proceeding.

### Step 3 — Inspect the live accessibility tree

Take a snapshot of the page's accessibility tree. This is the primary source of truth for
choosing a locator.

```
browser_snapshot()
```

Read the snapshot carefully:
- Look for ARIA roles, labels, placeholder text, and test IDs associated with the target element.
- Note the element's role, accessible name, and any unique attributes.

If the snapshot alone is not enough, take a screenshot to understand the visual layout:

```
browser_take_screenshot()
```

### Step 4 — Identify the target element in the tree

Find the element in the snapshot output. Record:
- Its ARIA role (if any)
- Its accessible name / label (if any)
- Its placeholder text (if any)
- Any `data-testid` attribute (if any)
- Its visible text content (if any)
- Its tag name, id, class, and other attributes (fallback only)

### Step 5 — Select the most stable locator

Apply the priority order below. Start at the top and stop at the first option that is
available and unique on the page.

| Priority | Strategy | When to use |
|---|---|---|
| 1 | `getByRole(role, { name })` | Element has a semantic ARIA role and an accessible name |
| 2 | `getByLabel(text)` | Form field has an associated `<label>` |
| 3 | `getByPlaceholder(text)` | Input has a `placeholder` attribute |
| 4 | `getByTestId(id)` | Element has a `data-testid` (or configured test-id attribute) |
| 5 | `getByText(text)` | Element has unique, stable visible text |
| 6 | CSS selector | No semantic option is available; use a structural or attribute-based selector |
| 7 | XPath | Last resort only — use only when CSS cannot reach the element |

**Why this order matters:** Semantic locators (role, label, placeholder) reflect how the
application is actually used and survive visual/style refactors. CSS classes tied to styling
frameworks change often; avoid them unless they are explicitly added for testing. XPath is
brittle and hard to read — use it only when there is no other way.

#### Rules for each level

- **getByRole**: prefer the most specific `{ name }` option. Verify the name matches the
  accessible name shown in the snapshot, not just visible text. Common roles: `button`,
  `textbox`, `link`, `heading`, `checkbox`, `combobox`, `listitem`.

- **getByLabel**: use the label text exactly as it appears. Check for `for`/`id` linkage or
  `aria-label` in the snapshot.

- **getByPlaceholder**: use the full placeholder string. Watch for dynamic placeholders.

- **getByTestId**: use the exact attribute value. Check what attribute the project uses
  (default is `data-testid`; check `playwright.config.ts` for `testIdAttribute` overrides).

- **getByText**: prefer `{ exact: true }` to avoid partial matches. Only use when the text
  is stable and not shared with other elements.

- **CSS selector**: use `id` attributes first (`#my-id`), then stable attribute selectors
  (`[name="email"]`, `[type="submit"]`). Avoid classes that look like auto-generated utility
  names (e.g., `bg-blue-500`, `text-sm`, `px-4`). Structural selectors like `form > button`
  are acceptable when they are stable.

- **XPath**: document why no other strategy worked.

### Step 6 — Validate the locator against the live element

Before returning the locator, confirm it resolves to exactly one element on the page.
Use `browser_evaluate` to run a count check:

```
browser_evaluate({
  expression: `document.querySelectorAll('<your-css-equivalent>').length`
})
```

For role/label/text-based locators, verify via the snapshot that the accessible name or
text is unique. If the locator matches more than one element, refine it (add `{ name }`,
`.nth(0)` with caution, or a more specific ancestor) and re-validate.

**A locator is only valid when it matches exactly one element.**

### Step 7 — Return the result

Provide a short, structured answer:

```
Locator:   page.getByRole('button', { name: 'Sign in' })
Strategy:  getByRole
Reason:    The submit button has role="button" and accessible name "Sign in" confirmed
           in the accessibility tree. No other element shares this role+name combination.
```

If the first-choice strategy was unavailable, briefly explain what was tried and why it
was skipped before reaching the chosen strategy.

---

## What this skill does NOT do

- It does not write, create, or modify test files.
- It does not create page objects.
- It does not run assertions.
- It does not decide how the locator is used in a test — that is the responsibility of the
  `playwright-pom` skill.

If the user also needs a test written, finish locator discovery first, then hand off to
the `playwright-pom` skill.

---

## Handling tricky situations

**Multiple matching elements:** Add a scoping ancestor, e.g.
`page.getByRole('region', { name: 'Login form' }).getByRole('button', { name: 'Submit' })`.

**Dynamic text or labels:** Fall back one priority level. Document the instability so the
team can add a `data-testid`.

**Shadow DOM:** Note the shadow boundary. Use Playwright's built-in piercing (Playwright
auto-pierces shadow DOM for most locators) and verify with `browser_evaluate`.

**Iframe content:** Use `page.frameLocator('iframe[name="..."]').getByRole(...)`. Confirm
the frame selector first via snapshot.

**Locator works locally but may be fragile:** Flag it clearly so the developer knows to add
a `data-testid` for long-term stability.
