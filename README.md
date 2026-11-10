# ProspectIQ AI — Chrome Extension MVP v0.1

An **installable Chrome side-panel extension** that turns company research into a seller-specific pre-meeting intelligence brief. Built for a pilot with Indian B2B founders, account executives and solution-sales teams.

## What works in this MVP

- Chrome Manifest V3 side panel, opened by the toolbar icon.
- Company, prospect, role, website, seller offering and meeting objective input.
- **Explicit** capture of the current company website's page title, description and limited visible text. No background browsing or continuous page monitoring. LinkedIn page capture is intentionally disabled.
- Built-in **fictional demo** that runs offline without any credentials.
- A local Node.js backend that researches public company information via the OpenAI Responses API's web-search tool, then builds a structured brief.
- Three tabs: **Brief** (summary, opportunity hypotheses, discovery questions), **Company** (facts, triggers, clickable sources), **Playbook** (talk tracks, objections, next actions).
- Source-linked observations distinct from seller inputs, unverified claims and AI hypotheses.
- Save up to 30 briefs locally in Chrome, reopen, remove, copy, and download `.md` reports.

## Quick start (Google Chrome 116+, Node.js 20.11+)

### 1. Install the extension, with no code build step

1. Extract `ProspectIQ_AI_MVP.zip` to a normal local folder.
2. In Chrome, open `chrome://extensions`.
3. Turn **Developer mode** on (top right).
4. Click **Load unpacked** and select the extracted `prospectiq-mvp/extension` folder.
5. Pin **ProspectIQ AI** to the toolbar; click its icon to open the side panel.
6. Click **Try a demo**. No server or API key is required to preview the extension.

### 2. Activate live AI research

1. In a terminal, navigate to `prospectiq-mvp/backend`.
2. Copy `.env.example` to `.env`.
3. Edit `.env`, replacing `OPENAI_API_KEY` with **your own OpenAI API key** and `CLIENT_ACCESS_TOKEN` with a long, random string (for example generate one with `openssl rand -hex 24`). **Do not place an OpenAI API key in the extension.**
4. Run `node server.mjs` (or `npm start`). It listens **only** on `127.0.0.1:8787`.
5. Inside the Chrome extension, open **⚙ Settings**, enter the same **CLIENT_ACCESS_TOKEN** string, and save.
6. Enter a real company and what you're selling. Click **Generate intelligence brief**.

The first AI pass researches public company material through live web search; the second produces structured meeting intelligence with source attribution. OpenAI API usage and web search calls may incur charges. **ChatGPT subscriptions do not include API usage.**

### 3. Optional: use the current page

Open a normal company website in Chrome, click the ProspectIQ toolbar icon, and select **Use current tab**. This only attempts a one-time capture after the click. The sidebar lets you review the context before submission. The extension will not capture `chrome://` pages or LinkedIn pages.

## What the AI delivers

- Prospect / role context, company description and named source links where found.
- Recently announced company developments only where source-backed.
- Seller-specific opportunity hypotheses (explicitly labelled as hypotheses).
- Five or more role-aware discovery questions, objections, a conversation opener, positioning and suggested close.
- Exportable Markdown brief suitable for email/CRM notes.

**Coverage varies by company.** Private SMEs may have fewer public facts than listed companies. We do not claim to retrieve all 80 of the eventual research-schema fields, current contact details, private social data, personal personality traits or internal technology systems.

## Security and privacy

- **Local-only prototype. Not production-hardened.** No user registration, tenant isolation, billing, admin console, cloud deployment, or shared team storage.
- The extension requests `sidePanel`, `storage`, `activeTab`, and `scripting`; the only configured backend host is `127.0.0.1:8787`.
- It captures webpage text only when requested; no automatic LinkedIn scraping.
- The OpenAI key is held in the **backend `.env`**, never embedded in JavaScript distributed to customers.
- The local server uses a shared client token, CORS restrictions and a simple 30-request/hour limit. These are prototype safeguards; production needs per-user authorization, proper limits, monitoring, audit logs and secure secret management.
- Current input (including any captured company-page excerpt) is sent to the OpenAI API and may be used by the model's web-search tooling. The backend does not write input to disk. Stored brief copies remain in the current Chrome profile.
- Source labels mean a source URL was returned, **not that every fact has been independently audited**. Verify important details before using externally.
- Do not add unlicensed contact data sources or unauthorized website scrapers.
- `.env` contains secrets: never commit, email, or publish it.

## Architecture

```
Chrome extension (MV3 side panel)
   ↳ [explicit research request, client token]
Local Node HTTP backend (127.0.0.1:8787)
   ↳ OpenAI Responses + web_search (public company research)
   ↳ Structured output pass (sales-specific brief)
   ↳ source URL allowlist / evidence labels
Chrome displays results and stores saved briefs locally
```

Only standard Node.js modules are required for the backend. There are **no `npm install` dependencies**.

## Developer checks

```
cd backend
npm test
node --check server.mjs
node --check brief.mjs
node --check ../extension/panel.js
node --check ../extension/background.js
```

For a production pilot, the next engineering priorities are: deploy an authenticated HTTPS backend, add accounts and encrypted team storage, improve source-level verification and entity matching, implement quotas/subscriptions, collect opt-in quality feedback, and run a documented privacy/Chrome Web Store review.

## Expected limitations of v0.1

- **Live AI research requires a user-supplied API key and local running server.** No API key has been included; the live OpenAI integration cannot be verified without one.
- Chrome Web Store publishing has not been completed (you load the unpacked extension locally).
- No licensed contact database, LinkedIn scraping, CRM integration, calendar sync, SaaS billing or subscriptions yet.
- A Chrome extension is desktop-only; a later web version would serve users on mobile.
- The backend address is fixed in `extension/panel.js` and the manifest. A deployed service would need HTTPS endpoint and host-permission changes.

## Reference documentation

- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Chrome activeTab/scripting](https://developer.chrome.com/docs/extensions/get-started/tutorial/scripts-activetab)
- [OpenAI Responses API web search](https://developers.openai.com/api/docs/guides/tools-web-search)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
