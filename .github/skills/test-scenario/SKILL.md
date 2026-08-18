---
name: test-scenario
description: >
  Converts a business requirement into a focused, implementation-ready end-to-end test scenario
  for this Playwright + TypeScript project. Use this skill whenever the user describes a feature,
  user story, acceptance criterion, or business flow and wants to know what to test — even if they
  don't use the words "test scenario" or "test case". Also use it when the user says things like
  "I need to test X", "how should I cover this requirement", "what should my test do for Y flow",
  or "help me plan my test before I write it". This skill produces a structured scenario document
  that feeds directly into implementation with the playwright-pom skill.
---

# test-scenario

Bridges the gap between a business requirement and a runnable Playwright test. Its job is to
think through the scenario clearly — what state the world needs to be in, what the user does,
and what the application must show — so that by the time code is written, every decision has
already been made.

---

## Step 1: Understand the requirement first

Before producing anything, ask enough clarifying questions to fully understand the requirement.
Do not invent business rules or infer behaviour that hasn't been stated.

Questions to resolve (not all will apply — use judgment):

- What is the user trying to accomplish? What triggers this flow?
- What role/permissions does the user have?
- Is there an existing account, record, or state the test depends on, or does the test create it?
- What page or URL does the flow start on?
- What is the happy path? What does "success" look like to the user?
- Are there important negative or edge-case paths the requirement explicitly mentions?
- Does the requirement describe any API calls that need to happen before or after the UI flow?

If the user has already answered these — either in this message or earlier in the conversation —
extract the answers from context rather than asking again.

---

## Step 2: Produce the scenario document

Once you understand the requirement, output a scenario document using the template below.
Keep it concise — this is a planning artifact, not a prose essay. Every field should be
populated with only what is known from the requirement. Leave a field empty or mark it
`n/a` rather than guessing.

---

### Scenario document template

```
## Scenario: <short name that reads like a test title>

### Requirement summary
One or two sentences describing what the business rule or user story says. Quote the
requirement if the user provided exact wording.

### Preconditions
Bullet list of what must already be true before the test starts:
- User account state (e.g., "a registered user with role: customer exists")
- Application state (e.g., "at least one product is available in the catalogue")
- System state (e.g., "email notifications are enabled")

### Test data
Specific values the test will use. Pull from existing data/
files if they exist in the project; otherwise list what needs to be added.
- username: (value or reference, e.g., data/users.json → valid.username)
- password: (value or reference)
- <other fields specific to the flow>

### API setup (beforeAll / beforeEach)
API calls needed to put the application into the correct state before the UI flow.
If none are needed, write "none".
- POST /api/... → creates ...
- GET /api/... → verifies ...

### UI steps (the test body)
Numbered list of user actions in plain language. One action per step.
Do not reference code or locators here — just what the user does.
1. Navigate to <url or page name>
2. ...
3. ...

### Expected assertions
What the test must verify after the flow completes. These become the `expect()` calls.
- Page URL contains / equals ...
- Element <description> is visible / hidden / contains text "..."
- <other observable UI outcome>

### API cleanup (afterAll / afterEach)
API calls to undo side effects and leave the application in a clean state.
If the setup created data, the cleanup deletes it. If none are needed, write "none".
- DELETE /api/...

### Page objects involved
List the page object class names this test will need. Note whether they already exist
in pages/ or need to be created.
- LoginPage — likely exists
- <PageName> — needs to be created

### Out of scope
List any related scenarios or edge cases that are explicitly NOT covered by this test.
This prevents scope creep and makes clear that exclusions are intentional.
- ...
```

---

## Step 3: Confirm before handing off

After producing the document, ask the user one simple question:

> "Does this capture the scenario correctly? Any adjustments before we start coding?"

This catches misunderstandings cheaply, before any code is written.

Once the user confirms, the scenario is ready to be handed to the `playwright-pom` skill for
implementation. You can reference the scenario document directly: "use the scenario above as
the spec for this test".

---

## Principles

**Stay grounded in the requirement.** If a behaviour isn't stated in the requirement, don't
include it. Invented assertions are the most common source of brittle tests.

**One scenario = one flow.** Each scenario document covers a single happy path (plus any
negative paths the requirement explicitly calls out). If the user describes two distinct flows,
produce two scenario documents.

**Prefer existing data and page objects.** Check `data/` and `pages/` before proposing new
fixtures. Reusing what's already there reduces setup cost and makes the test fit naturally
into the project.

**Assertions should be observable.** Every assertion in "Expected assertions" must be
something a Playwright `expect()` can check: visible elements, URLs, text content, enabled
state. Avoid assertions about internal state (database records, server logs) — those belong
in the API layer, not the UI test.

**Cleanup is as important as setup.** A test that leaves dirty data behind causes flakiness
in other tests. Every API setup action should have a corresponding cleanup action.
