# AI Job Copilot Frontend

This directory contains the React.js frontend application for the AI Job Copilot.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

3.  **Build for Production**:
    ```bash
    npm run build
    ```
    This will create a `dist` folder with the production-ready build.

## Deployment

This frontend can be deployed to any static site hosting service (e.g., Vercel, Netlify, GitHub Pages).

It is configured to connect to the backend API at `https://ai-job-copilot.onrender.com/api` in production.

## API Endpoints

The frontend communicates with the following backend API endpoints:
- AI Services: `/api/ai`
- Data Services: `/api/data`
- Automation Services: `/api/automation`
- Google Drive Services: `/api/gdrive`

For local development, these endpoints will point to `http://localhost:3000/api`.

