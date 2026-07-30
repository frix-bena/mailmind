<div align="center">

# 📧 MailMind

**A permission-based email assistant that reads your inbox, keeps you informed, and only replies when you say so.**

[![n8n](https://img.shields.io/badge/Automation-n8n-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)
[![OAuth](https://img.shields.io/badge/Auth-OAuth%202.0-4285F4?logo=google&logoColor=white)](#-authentication)
[![License](https://img.shields.io/badge/License-Personal%20Use-lightgrey)](#-license)
[![Status](https://img.shields.io/badge/Status-Concept%20%2F%20Planning-yellow)](#-roadmap)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Core Principles](#-core-principles)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Authentication](#-authentication)
- [Architecture](#-architecture)
- [UI/UX](#-uiux)
- [Getting Started](#-getting-started)
- [Privacy & Safety](#-privacy--safety)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 About

**MailMind** is an email assistant built on **n8n** that reads incoming emails, notifies you as messages arrive, and drafts replies in plain, human language — but never sends anything without your explicit approval. It's designed to cut down on inbox anxiety and repetitive replying, without turning into a black-box bot that acts on your behalf without asking.

Newsletters, receipts, and notifications are read and summarized automatically. Anything that looks like it needs a real response gets flagged, drafted, and handed back to you for a final decision.

---

## 🧭 Core Principles

| Principle | What it means |
|---|---|
| 🙋 **Permission first** | No email is ever sent without the user approving it |
| 🗣️ **Plain language** | Drafts sound like a person, not a corporate bot or ambiguous auto-reply |
| 🔔 **Always informed** | Every new email triggers a simple, readable notification |
| 🔐 **Secure by design** | OAuth login only — the app never sees or stores your password |
| 📚 **Context-aware** | Can look back through older emails and summarize on request |

---

## ✨ Features

| | |
|---|---|
| 📥 **Full inbox monitoring** | Reads every incoming email — personal, newsletter, receipt, or notification |
| 🔔 **Real-time notifications** | Plain-language summary the moment something new arrives |
| 🧠 **Smart classification** | Sorts emails into "needs a reply" vs. "just FYI" |
| ✍️ **Human-toned drafting** | Suggests a reply in simple, natural language — no jargon |
| ✅ **Approve / Edit / Decline** | User has final say on every reply before it's sent |
| 🔎 **Inbox lookback & search** | Ask it to summarize or find things from past emails |
| 🎚️ **Tone control** | Choose professional, casual, or brief as your default reply style |

---

## ⚙️ How It Works

1. **New email arrives** → MailMind reads it and sends you a short summary (who, what, why it matters).
2. **Classification** → The email is sorted as either *needs a reply* or *no reply needed* (newsletters, receipts, auto-notifications).
3. **Drafting** → For emails needing a reply, a plain-language draft is generated and shown to you alongside the original.
4. **Your decision** → You choose **Send as-is**, **Edit then send**, or **Don't send**. Nothing goes out without this step.
5. **Logging** → Every email, its classification, and the outcome (sent/edited/declined) is logged for your own review.

---

## 🔐 Authentication

MailMind connects to your inbox using **OAuth 2.0** ("Sign in with Google" / "Sign in with Microsoft") — never a raw email/password combo.

- You grant a **revocable access token**, not your actual password
- Disconnect access anytime from your account settings or directly from Google/Microsoft's app permissions page
- No credentials are ever stored in plaintext

> ⚠️ Google and Microsoft have blocked plain password sign-in for third-party mail apps for years — OAuth isn't just safer, it's required.

---

## 🏗️ Architecture

```
MailMind/
├── n8n workflows/
│   ├── oauth-trigger.json         # Handles inbox connection & token refresh
│   ├── inbox-poll.json            # Checks for new mail every few minutes
│   ├── classify-email.json        # AI node: needs-reply vs. no-reply-needed
│   ├── draft-reply.json           # AI node: generates plain-language draft
│   ├── approval-wait.json         # Holds draft until user responds
│   ├── send-reply.json            # Sends only after explicit approval
│   └── log-activity.json          # Logs email, classification, outcome
├── frontend/
│   ├── onboarding/                # Connect email → pick tone → done
│   ├── inbox-feed/                # Feed of emails with summaries + drafts
│   ├── approval-actions/          # Send / Edit / Decline controls
│   └── notifications/             # In-app + push notification system
└── data/
    └── activity-log.db            # Local record of emails & agent decisions
```

**Core workflow nodes (n8n):**

| Node | Purpose |
|---|---|
| OAuth Trigger | Authenticates and refreshes inbox access |
| Poll Inbox | Checks for new messages on an interval |
| Classify (AI) | Determines if a reply is needed |
| Draft Reply (AI) | Writes a plain-language response |
| Safety Check | Confirms no placeholder text, reasonable length, on-topic |
| Approval Wait | Pauses workflow until user approves/edits/declines |
| Send | Sends the approved reply |
| Log | Records the email, decision, and outcome |

---

## 🎨 UI/UX

- **Onboarding:** Connect email (OAuth) → choose default reply tone (professional / casual / brief) → done
- **Inbox feed:** Chronological list of incoming emails, each with a short AI summary and, where relevant, a suggested reply inline
- **Approval controls:** Clear **Send / Edit / Decline** buttons on every drafted reply — no auto-sending, ever
- **Notifications:** Lightweight in-app and optional push notifications so you always know what came in without opening your actual inbox
- **Lookback search:** A simple prompt box — e.g. *"summarize what I missed last week"* or *"find emails about the Johnson contract"*

---

## 🚀 Getting Started

> This project is currently in the **planning / prompt-design stage** — no code has been built yet. The steps below reflect the intended setup once implemented.

1. **Set up n8n** (self-hosted or cloud)
2. **Import the workflow files** from `n8n workflows/`
3. **Configure OAuth credentials** for Gmail and/or Outlook in n8n
4. **Connect your AI provider** (e.g. Anthropic API) for the classification and drafting nodes
5. **Deploy the front end** and point it at your n8n webhook endpoints
6. **Sign in**, choose a reply tone, and start monitoring your inbox

---

## 🔒 Privacy & Safety

- Inbox access is granted via OAuth, not a stored password
- No reply is ever sent without explicit user approval
- Newsletters, receipts, and notifications are summarized but never auto-actioned
- All activity (reads, classifications, drafts, sends) is logged locally for the user's own review
- Access can be revoked at any time from the account settings

---

## 🗺️ Roadmap

- [ ] Build core n8n workflow (poll → classify → draft → approve → send)
- [ ] Add whitelist / trusted-sender rules
- [ ] Add daily send-limit safeguard
- [ ] Build
