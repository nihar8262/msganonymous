
# MSGAnonymous

>A privacy-focused platform for sending and receiving anonymous messages, built with Next.js, TypeScript, and MongoDB.

---

## 📝 Project Overview

**MSGAnonymous**(also referred to as “True Feedback”) allows users to create events and receive anonymous messages from anyone. It features user authentication, event management, AI-powered message suggestions, and robust rate limiting to prevent spam. The project is designed for privacy, security, and ease of use.

---

## 🚀 Features

- User authentication with email verification and OAuth
- Authenticated dashboard for managing events and received messages
- Event lifecycle management (create, update, delete) with access control
- Public event pages for anonymous message submissions
- Public read-only messages page for sharing event messages
- AI-generated message suggestions with daily usage limits
- Per-event response limits and end date/time controls
- Auto-closing events on limit reached or expiration
- One message per day per event per fingerprint/IP (anti-spam)
- Message filtering by time range and pagination (20 per page)
- Multi-select message delete actions
- QR code generation for instant event sharing
- Responsive dashboard for event and message management

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, MongoDB (via Mongoose)
- **Authentication:** NextAuth.js
- **Email:** Resend API
- **AI:** Google Gemini API (for message suggestions)
- **Other:** Zod (schema validation), custom rate-limiting middleware, request fingerprinting

---

## 🏗️ Architecture Diagram

The application uses server-side rendering for authenticated pages and serverless API routes for event and message operations, ensuring secure access control and scalable request handling.


```
┌────────────┐     ┌──────────────┐     ┌─────────────┐
│  Browser   │<--->│ Next.js App  │<--->│ MongoDB     │
│ (User)     │     │ (API Routes) │     │ (Database)  │
└────────────┘     └──────────────┘     └─────────────┘
		  │                 │
		  │                 └──> NextAuth, Resend, OpenAI
		  │
		  └──> QR Code, AI Suggestions, Rate Limiting
```

---

## 📸 Screenshots / GIFs

> _Add your screenshots or GIFs here_
![Landing Page](./screenshots/Landing.png)
![Sign In Page](./screenshots/SignIn.png)
![Sign Up Page](./screenshots/SignUp.png)
![Dashboard](./screenshots/Dashboard.png)
![Public Event Page](./screenshots/events.png)

---

## ⚙️ Setup Steps

1. **Clone the repository:**
	```bash
	git clone https://github.com/yourusername/msganonymous.git
	cd msganonymous
	```
2. **Install dependencies:**
	```bash
	npm install
	# or
	yarn install
	```
3. **Configure environment variables:**
	- Copy `.env.example` to `.env.local` and fill in your MongoDB URI, NextAuth secrets, Resend API key, and OpenAI key.
4. **Run the development server:**
	```bash
	npm run dev
	```
5. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## 🔑 Key Engineering Highlights

- Enforced event state validation on both frontend and backend to prevent submissions to closed or deleted events.
- Per-event anti-abuse: response limits, expiration checks, and fingerprint/IP daily message caps.
- Role-based access checks on event mutations (update/delete).
- Public read-only link for message viewing without authentication.
- No custom message encryption is implemented in the app layer; transport security relies on HTTPS provided by the deployment platform. Database encryption at rest depends on your MongoDB setup.
- Structured codebase with clear separation of API routes, UI components, and utility logic.

---
## 💡 What I Learned / Tradeoffs

- **Authentication:** NextAuth.js made it easy to implement secure authentication, but customizing flows (like email verification) required extra work.
- **Rate Limiting:** Implementing robust rate limiting and fingerprinting was essential to prevent abuse, but balancing user experience and security was tricky.
- **AI Integration:** Using OpenAI for message suggestions added value, but required careful prompt engineering and cost management.
- **Architecture:** Keeping the code modular (separating API, components, helpers, etc.) improved maintainability.
- **Tradeoffs:** Chose serverless API routes for simplicity, but for high scale, a dedicated backend might be better. Used MongoDB for flexibility, but relational DBs could offer stronger consistency for some use cases.

---

## 📄 License

MIT
