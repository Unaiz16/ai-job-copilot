# AI Job Copilot

This is the fullstack repository for the AI Job Copilot, an autonomous agent designed to streamline and automate the job search process.

## Repository Structure

```
ai-job-copilot/
├── frontend/          # React frontend application (Vite + Tailwind)
├── backend/           # Node.js backend API
└── README.md
```

## Core Features

- **AI-Powered Profile Synthesis:** Ingests a CV, LinkedIn profile, and other career artifacts to create a unified "Career DNA".
- **Intelligent Job Sourcing:** Finds relevant jobs based on the user's synthesized profile.
- **Automated Document Generation:** Creates tailored CVs and cover letters for specific job applications.
- **Strategic Analysis:** Provides performance insights and suggests strategic A/B tests to improve application success rates.
- **Autonomous Application (Optional):** Can be authorized to apply for high-match jobs on the user's behalf.
- **Google Drive & Sheets Integration:** Syncs generated documents and application pipelines to the user's Google account.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **AI:** Google Gemini API
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Deployment:** 
  - Frontend: Netlify
  - Backend: Render.com

## Getting Started

### Frontend Development

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Environment Variables

#### Frontend (.env in frontend/, see `frontend/.env.example`)
```
VITE_API_BASE_URL=https://ai-job-copilot.onrender.com
```
Every `VITE_*` variable is bundled into the public JavaScript, so never put API keys here.
All Gemini calls go through the backend's `/api/ai/*` routes.

#### Backend (.env in backend/, see `backend/.env.example`)
```
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

### Frontend (Netlify)
- Base directory: `frontend`
- Build command: `npm install --legacy-peer-deps && npm run build`
- Publish directory: `dist`

### Backend (Render.com)
- Build command: `npm install`
- Start command: `npm start`

## About

AI Job Copilot - Autonomous Career Agent

