<div align="center">

# 📧 MailMind

**A permission-based email assistant that reads your inbox, keeps you informed, and only replies when you say so.**

[![Live App](https://img.shields.io/badge/Live%20App-mailmind--chi.vercel.app-4F46E5?logo=googlechrome&logoColor=white)](https://mailmind-chi.vercel.app)
[![n8n](https://img.shields.io/badge/Automation-n8n-EA4B71?logo=n8n&logoColor=white)](https://n8n.io/)
[![OAuth](https://img.shields.io/badge/Auth-OAuth%202.0-4285F4?logo=google&logoColor=white)](#-authentication)
[![License](https://img.shields.io/badge/License-Personal%20Use-lightgrey)](#-license)
[![Status](https://img.shields.io/badge/Status-Concept%20%2F%20Planning-yellow)](#-roadmap)

🌐 **Live Application:** [mailmind-chi.vercel.app](https://mailmind-chi.vercel.app)

</div>

---


----

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

