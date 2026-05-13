# NEXUS Resume Analyzer

> An AI-powered resume builder and analyzer with a dark futuristic interface — built as a pure HTML/CSS/JS single-page application.

---

## Overview

NEXUS Resume Analyzer is a browser-based SPA that helps users create, optimize, and analyze professional resumes using AI. It combines Firebase for authentication and data persistence with the Groq API (Llama 3.3 70B) for intelligent resume content generation, ATS scoring, job matching, and skill gap analysis — all wrapped in a neon-accented, cyberpunk-inspired UI.

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | Email/password and Google sign-in via Firebase Auth |
| **Resume Builder** | Multi-section form with live preview and 3 templates (Modern, Minimal, Executive) |
| **ATS Scoring** | Real-time Applicant Tracking System score with improvement tips |
| **AI Content Generation** | Rewrite bullet points, generate summaries and cover letters |
| **Skill Suggestions** | AI-powered skill recommendations based on target role |
| **Job Matcher** | Groq-powered job search with skills gap analysis |
| **Analytics Dashboard** | Chart.js score history and performance metrics |
| **PDF Export** | One-click PDF export from the live preview via html2pdf.js |
| **Cloud Sync** | All resumes saved to Firestore in real time |

---

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+) — no framework
- **Authentication:** Firebase Auth (compat SDK v10 via CDN)
- **Database:** Firebase Firestore
- **AI Model:** Groq API — `llama-3.3-70b-versatile`
- **Charts:** Chart.js (via CDN)
- **PDF Export:** html2pdf.js (via CDN)
- **Fonts:** Orbitron, Rajdhani, Space Mono (Google Fonts)

---

## Project Structure

```
nexus-resumeanalyzer/
├── index.html            # SPA shell — sidebar nav + 6 pages (dashboard, resumes, builder, ai, jobs, analytics)
├── login.html            # Authentication page (email + Google sign-in)
├── css/
│   └── styles.css        # Dark futuristic design — neon cyan/purple/pink accents
├── js/
│   ├── app.js            # Router, AppState, toast/loader helpers, Firebase init
│   ├── auth.js           # Auth guards — redirects to login.html if not signed in
│   ├── firestore.js      # AppFS: save/load resumes, analytics increments, score history
│   ├── gemini.js         # AI client — Groq REST API calls (rewrite, summarize, ATS, jobs)
│   ├── resumeBuilder.js  # Form binding, live preview, 3 templates, ATS score display
│   ├── aiFeatures.js     # UI wrappers for Groq calls — outputs to ai-output divs
│   ├── jobMatcher.js     # Groq-powered job search with skills gap analysis
│   ├── analytics.js      # Chart.js score history doughnut + performance table
│   └── pdfExport.js      # html2pdf export from the live preview div
└── data/
    └── config.js         # Firebase config + Groq API key
```

---

## Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A **Firebase project** with Auth and Firestore enabled
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))
- Git (for cloning and pushing)
- A static file server or any web host (Vercel, GitHub Pages, Firebase Hosting, etc.)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/dinu2oo6/nexus-resumeanalyzer.git
cd nexus-resumeanalyzer
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project (or use an existing one).
2. Enable **Authentication** → Sign-in methods: **Email/Password** and **Google**.
3. Enable **Firestore Database** in production mode.
4. Copy your Firebase project's SDK config snippet.

### 3. Configure the API keys

Open [data/config.js](data/config.js) and replace the placeholder values:

```js
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
```

> **Security note:** Do not commit real API keys to a public repository. For production deployments, inject secrets via environment variables or a backend proxy.

### 4. Run locally

The app is pure static HTML — no build step required. Use any static server:

**Option A — Python (built-in)**
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option B — Node.js (npx)**
```bash
npx serve .
# Open the URL shown in the terminal
```

**Option C — VS Code Live Server**

Install the Live Server extension, right-click `index.html`, and select **Open with Live Server**.

> Opening `index.html` directly as a `file://` URL will fail due to Firebase SDK CORS restrictions. Always use a local server.

---

## Firebase Firestore Rules

Apply these rules in your Firebase Console → Firestore → Rules to allow only authenticated users to read/write their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Deploying to Production

### Vercel (recommended — zero config)

```bash
npm install -g vercel
vercel
# Follow the prompts — no build step needed
```

### GitHub Pages

```bash
# Ensure your repo is public and has the files at the root
# Go to Settings → Pages → Source: Deploy from branch → main → / (root)
# Your app will be live at https://dinu2oo6.github.io/nexus-resumeanalyzer/
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to "." and single-page app to "No"
firebase deploy
```

---

## How It Works

1. User lands on `login.html` → Firebase Auth handles sign-in.
2. On success, redirected to `index.html` — `auth.js` guards every page load.
3. The SPA router in `app.js` swaps page sections without any full reload.
4. Resume data is persisted to Firestore under `users/{uid}/resumes/{resumeId}`.
5. AI features call the Groq REST API directly from the browser and render responses in-place.
6. PDF export renders the live preview `div` to a downloadable PDF via html2pdf.js.

---

## Pages & Navigation

| Page | Route key | Description |
|---|---|---|
| Dashboard | `dashboard` | Stats overview — resume count, AI assist count, downloads |
| My Resumes | `resumes` | Grid of saved resumes with edit/delete/export |
| Builder | `builder` | Full resume form + live template preview + ATS score |
| AI Features | `ai` | Bullet rewriter, summary generator, cover letter, skill suggester |
| Job Matcher | `jobs` | Groq-powered job recommendations with skills gap table |
| Analytics | `analytics` | Score history chart + performance breakdown |

---

## AI Capabilities (Groq / Llama 3.3 70B)

| Function | What it does |
|---|---|
| `rewriteBullet` | Transforms a weak bullet point into a strong, metric-driven statement |
| `generateSummary` | Creates a professional summary tailored to the candidate's background |
| `generateCoverLetter` | Writes a job-specific cover letter from resume data |
| `analyzeAts` | Returns an ATS compatibility score with actionable suggestions |
| `suggestSkills` | Recommends skills to add for a target role |
| `matchJobs` | Generates relevant job matches with required vs. present skills gap |
| `quickAtsScore` | Lightweight ATS pre-check used in the builder's live preview panel |

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
