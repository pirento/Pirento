# Pirento AI across the products

Every AI call goes through `services/ai`. Customer tools run at `POST /api/ai/assist/:kind` (`routes/assist.routes.js`,
prompts in `lib/assistJobs.js`) and take one message from the person's daily allowance; staff tools do not. The words
for each tool live in `apps/web/src/data/aiTools.js`; `AiTool` / `AiToolBox` (`features/ai/AiTool.jsx`) render them.
Without `ANTHROPIC_API_KEY` every tool answers 503 and the rule-based parts keep working.

| #   | What                        | Where it shows                           | How                                                                                         |
| --- | --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Find the right service      | Pirento dashboard → Pirento AI           | `recommend` (catalogue only, slugs checked)                                                 |
| 2   | My month, summed up         | Pirento dashboard → Pirento AI           | `monthly` (the person's own summaries from 5 services)                                      |
| 3   | Legal service chooser       | Legal dashboard → Pirento AI             | `recommend` with `product: legal`                                                           |
| 4   | Draft a document            | Legal dashboard → Pirento AI             | `draftDoc` (a lawyer must check)                                                            |
| 5   | Explain a legal notice      | Legal dashboard → Pirento AI             | `explainDoc` (PDF/photo, never stored)                                                      |
| 6   | My filing dates             | Black dashboard → Pirento AI             | `compliance` (standard dates, confirm on the portal)                                        |
| 7   | Check my documents          | Customer's order → Documents             | orders `POST /:id/files/check` → AI job `docCheck` (cached an hour)                         |
| 8   | Explain a tax notice        | Black dashboard → Pirento AI             | `explainDoc` with `product: black`                                                          |
| 9   | My planting report          | Green dashboard → Pirento AI             | `greenImpact` (own Green orders, no invented figures)                                       |
| 10  | CSR section draft           | Green dashboard → Pirento AI             | `csrReport`                                                                                 |
| 11  | Find the right gift         | Giftox dashboard → Pirento AI            | `recommend` with `product: giftox`, budget                                                  |
| 12  | Gift message                | Giftox dashboard → Pirento AI            | `giftMessage`                                                                               |
| 13  | AI tutor                    | Intern → Learn → a lesson                | `tutor` (explanation + practice)                                                            |
| 14  | Mock interview              | Intern → Learn                           | `interview` (5 questions, then a score)                                                     |
| 15  | Bharat ID step help         | Bharat ID → Application, under each step | `idHelp` (the step only, never what is typed)                                               |
| 16  | Warning signs for reviewers | Admin → Bharat ID review                 | rules, not AI (`identity/src/lib/flags.js`): same PAN, mobile, Aadhaar ending + birth date  |
| 17  | Developer helper            | Business console → API reference         | `devHelp`                                                                                   |
| 18  | File labels                 | Vault → Files → Label with AI            | `label` (file names only, never contents)                                                   |
| 19  | Expiry reminders            | Vault → Files → Expires                  | `expiresOn`; an email 30 days before (`vault/src/lib/expiry.js`)                            |
| 20  | Share message               | Pirento One dashboard                    | `shareMessage`                                                                              |
| 21  | Earnings coach              | Pirento One dashboard                    | `partnerCoach` (orders `/internal/partner-summary`)                                         |
| 22  | EMI explained               | Capital page, under the calculator       | `emiExplain` (numbers worked out on the server)                                             |
| 23  | Foundation story            | Admin → Pirento AI → Foundation story    | `impactStory` (staff)                                                                       |
| 24  | Ask about today             | Admin → Pirento AI → Ask                 | `adminAnswer` (each service's `/internal/staff-summary`, only areas the role may see)       |
| 25  | Ticket triage               | Every new ticket                         | support `lib/triage.js` → AI job `triage`, in the background; raises priority, never lowers |

## Pirento Legal

Customer tools run through `/ai/assist/:kind` (prompts in `services/ai/src/lib/legalJobs.js`); a tool about an order reads
it through orders' `/internal/order-summary`, which refuses anyone else's order. Team tools run in the orders service at
`POST /orders/staff/:id/ai/:kind` (`routes/ai.routes.js`): the staffer must be able to open the order, the job goes to the
AI service, and every use is audited. Nothing an AI writes is sent or saved without a person choosing to.

| #   | What                              | Where it shows                                                                                       | How                                                                                                          |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Fill the checkout by chatting     | Checkout → Fill this with Pirento AI                                                                 | `intake`: asks one question at a time; answers checked against the service's questions, then put in the form |
| 2   | What to have ready                | Service page                                                                                         | `checklist` (the service's live name, the person's situation)                                                |
| 3   | Contract review                   | Legal dashboard → Pirento AI                                                                         | `contractReview` (risky clauses with level and what to ask; suggests a lawyer review)                        |
| 4   | Reply to a notice                 | Legal dashboard → Pirento AI                                                                         | `noticeReply` (a first draft and what a lawyer must check)                                                   |
| 5   | Ask about my order                | Customer's order page                                                                                | `orderAsk`                                                                                                   |
| 6   | Where is my order?                | Customer's order page                                                                                | `orderStatus` (now, what is needed from them, next)                                                          |
| 7   | Consultation brief / call summary | Customer's order page (brief, sent as their message) · staff order (summary, sent as a team message) | `consultBrief`, `consultSummary`                                                                             |
| 8   | Draft from the order              | Admin → Orders → an order                                                                            | `orderDraft`; "Add as a document" saves it as a text document to finish                                      |
| 9   | Check before sending              | Admin → Orders → an order → a document                                                               | `deliverableCheck` (names, dates, amounts, blanks, signatures against the order)                             |
| 10  | Sum up the order                  | Admin → Orders → an order                                                                            | `orderSummary` (what, where it stands, who it waits on, next steps)                                          |
| 11  | Read details from a document      | Admin → Orders → an order → a document                                                               | `extract` (Aadhaar, PAN and account numbers masked to the last 4; shown, never saved)                        |
| 12  | Read it in my language            | Legal dashboard → Pirento AI                                                                         | `translate` (the original language version counts)                                                           |
| 13  | Company compliance dates          | Legal dashboard → Pirento AI                                                                         | `companyCompliance`; Add to my calendar (.ics, reminder 3 days before)                                       |
