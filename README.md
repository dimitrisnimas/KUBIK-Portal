# KubikPortal

A standalone portfolio demonstration for managing clients, assets, tickets,
billing, and services. The application is not connected to the shared KUBIK
ecosystem and does not process real billing data.

## 🏗️ Architecture

This project is a **Monorepo** containing both the frontend and backend:

*   **`frontend/`**: React application (Vite + Tailwind CSS).
*   **`backend/`**: Node.js Express API.
*   **`database/`**: PostgreSQL schema and deterministic demo seed data.

## 🚀 Deployment

The frontend and API deploy together as two Vercel Services in one project.
Public `/api/*` requests are routed to the Express service and all other
requests are routed to the Vite service.

## 🛠️ Local Development

### Prerequisites
*   Node.js 20+
*   PostgreSQL 16+ or a Neon database

### Setup
1.  Install dependencies:
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```
2.  Setup Database:
    *   Create a PostgreSQL database.
    *   Run `psql "$DATABASE_URL" -f database/database.sql`.
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
