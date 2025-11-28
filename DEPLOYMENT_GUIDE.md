# 🚀 KubikPortal Free Deployment Guide

This guide explains how to deploy KubikPortal for **FREE** using the following stack:
- **Frontend**: **Netlify** (Free static hosting)
- **Backend**: **Render** (Free Node.js hosting)
- **Database**: **TiDB Cloud** (Free Serverless MySQL)

---

## 📋 **Prerequisites**

1.  **GitHub Account**: You need a GitHub account to store your code.
2.  **Git Installed**: Ensure Git is installed on your computer.
3.  **Codebase**: Your project should be pushed to a GitHub repository.

---

## 🗄️ **Step 1: Database Setup (TiDB Cloud)**

TiDB Cloud offers a generous free tier (5GB storage) and is compatible with MySQL.

1.  **Sign Up**: Go to [TiDB Cloud](https://tidbcloud.com/) and sign up.
2.  **Create Cluster**:
    -   Click **"Create Cluster"**.
    -   Select **"Serverless"** (Free).
    -   Choose a region (e.g., AWS us-east-1 or one closer to you).
    -   Give it a name (e.g., `kubikportal-db`).
    -   Click **"Create"**.
3.  **Get Credentials**:
    -   Once created, click **"Connect"**.
    -   Select **"Connect with General Client"**.
    -   Copy the connection details:
        -   **Host**: (e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`)
        -   **Port**: `4000` (Note: TiDB uses 4000, not 3306)
        -   **User**: (e.g., `2G9s...`)
        -   **Password**: (Click "Generate Password" if needed)
    -   **Important**: You must use the secure connection (SSL/TLS). In Node.js `mysql2`, this is usually handled automatically or by adding `ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }` to the config.

4.  **Import Schema**:
    -   Use a tool like **DBeaver**, **HeidiSQL**, or the **TiDB SQL Editor** in the browser.
    -   Run the contents of your `database/database.sql` file to create the tables.

---

## 🖥️ **Step 2: Backend Deployment (Render)**

Render offers a free web service tier for Node.js.

1.  **Sign Up**: Go to [Render](https://render.com/) and sign up with GitHub.
2.  **Create Web Service**:
    -   Click **"New +"** -> **"Web Service"**.
    -   Connect your GitHub repository.
3.  **Configure Service**:
    -   **Name**: `kubikportal-api` (or similar).
    -   **Region**: Choose same/close to your database.
    -   **Branch**: `main` (or your working branch).
    -   **Root Directory**: `backend` (Important! Your backend code is in this subfolder).
    -   **Runtime**: **Node**
    -   **Build Command**: `npm install`
    -   **Start Command**: `node src/server.js`
    -   **Instance Type**: **Free**
4.  **Environment Variables**:
    -   Scroll down to **"Environment Variables"** and add:
        -   `NODE_ENV`: `production`
        -   `PORT`: `10000` (Render expects this or will assign one)
        -   `DB_HOST`: (Your TiDB Host)
        -   `DB_PORT`: `4000`
        -   `DB_USER`: (Your TiDB User)
        -   `DB_PASS`: (Your TiDB Password)
        -   `DB_NAME`: `kubikportal` (or whatever you named your DB)
        -   `SESSION_SECRET`: (Generate a random string)
        -   `FRONTEND_URL`: `https://YOUR-NETLIFY-SITE-NAME.netlify.app` (You will update this after deploying frontend, or set it to `*` temporarily).
5.  **Deploy**: Click **"Create Web Service"**.
    -   *Note: The free tier spins down after 15 mins of inactivity. The first request will take ~30s to wake it up.*

---

## 🌐 **Step 3: Frontend Deployment (Netlify)**

Netlify is excellent for React apps.

1.  **Sign Up**: Go to [Netlify](https://www.netlify.com/) and sign up with GitHub.
2.  **Create Site**:
    -   Click **"Add new site"** -> **"Import from an existing project"**.
    -   Select **GitHub**.
    -   Pick your repository.
3.  **Configure Build**:
    -   **Base directory**: `frontend` (Important!)
    -   **Build command**: `npm run build` (or `vite build`)
    -   **Publish directory**: `dist`
4.  **Environment Variables**:
    -   Click **"Show advanced"** -> **"New Variable"**.
    -   Key: `VITE_API_URL`
    -   Value: (Your Render Backend URL, e.g., `https://kubikportal-api.onrender.com/api`)
        -   *Note: Ensure you include `/api` at the end if your frontend code expects it, or just the base URL depending on your `api.js` setup.*
5.  **Deploy**: Click **"Deploy site"**.

---

## 🔄 **Step 4: Final Configuration**

1.  **Update Backend CORS**:
    -   Once you have your Netlify URL (e.g., `https://cool-app-123.netlify.app`), go back to **Render**.
    -   Update the `FRONTEND_URL` environment variable to this exact URL (no trailing slash).
    -   Render will automatically redeploy.

2.  **Verify**:
    -   Open your Netlify URL.
    -   Try to log in.
    -   Check the Network tab in browser dev tools if issues arise.

---

## 🚨 **Troubleshooting**

-   **Database Connection Errors**: Ensure you are using Port `4000` for TiDB and that SSL is enabled.
-   **CORS Errors**: Check that `FRONTEND_URL` in Render matches your Netlify URL exactly.
-   **404 on Refresh**: Netlify needs a `_redirects` file for SPA routing.
    -   Create a file named `_redirects` in your `frontend/public` folder with this content:
        ```
        /*  /index.html  200
        ```
    -   Push this change to GitHub and Netlify will redeploy.
