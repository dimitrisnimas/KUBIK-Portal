# KubikPortal

A comprehensive, multi-tenant SaaS application for managing assets, tickets, billing, and services.

## 🏗️ Architecture

This project is a **Monorepo** containing both the frontend and backend:

*   **`frontend/`**: React application (Vite + Tailwind CSS).
*   **`backend/`**: Node.js Express API.
*   **`database/`**: SQL scripts for the MySQL database.

## 🚀 Deployment

We recommend a free stack for deployment:
*   **Frontend**: Netlify
*   **Backend**: Render
*   **Database**: TiDB Cloud

👉 **[Read the Deployment Guide](DEPLOYMENT_GUIDE.md)** for step-by-step instructions.

## 🛠️ Local Development

### Prerequisites
*   Node.js (v16+)
*   MySQL

### Setup
1.  Install dependencies:
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```
2.  Setup Database:
    *   Create a MySQL database.
    *   Run `database/database.sql`.
3.  Configure Environment:
    *   Copy `.env.example` to `.env` in `backend/`.
    *   Update database credentials.

### Running the App
*   **Backend**: `cd backend && npm run dev`
*   **Frontend**: `cd frontend && npm run dev`

## 📚 Documentation
*   [Deployment Guide](DEPLOYMENT_GUIDE.md)
*   [System Architecture](SYSTEM_ARCHITECTURE.md)
*   [Setup Guide](SETUP_GUIDE.md)
