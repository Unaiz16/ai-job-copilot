# AI Job Copilot

This is the fullstack repository for the AI Job Copilot, an autonomous agent designed to streamline and automate the job search process.

## Core Features

*   **AI-Powered Profile Synthesis:** Ingests a CV, LinkedIn profile, and other career artifacts to create a unified "Career DNA".
*   **Intelligent Job Sourcing:** Finds relevant jobs based on the user's synthesized profile.
*   **Automated Document Generation:** Creates tailored CVs and cover letters for specific job applications.
*   **Strategic Analysis:** Provides performance insights and suggests strategic A/B tests to improve application success rates.
*   **Autonomous Application (Optional):** Can be authorized to apply for high-match jobs on the user's behalf.
*   **Google Drive & Sheets Integration:** Syncs generated documents and application pipelines to the user's Google account.

## Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **AI:** Google Gemini API
*   **Backend:** Node.js, Express
*   **Database:** Supabase (PostgreSQL)
*   **Deployment:** Render

## Getting Started

### Prerequisites

*   Node.js (LTS version)
*   Git

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Create a `.env` file by copying `.env.example`.
3.  Fill in your `API_KEY` (for Gemini), and your Supabase URL and Key in the `.env` file.
4.  Run `npm install` to install backend dependencies.

### Running Locally

This project is configured for deployment on Render. The frontend is a static build that communicates with the backend API. To run locally, you would typically serve the frontend files and run the backend server separately, ensuring the frontend's API calls can reach the backend.