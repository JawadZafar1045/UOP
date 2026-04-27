# Unified Operations Platform (UOP) - Setup Guide

## Requirements
- Node.js (v18+)
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379` (For BullMQ background tasks)

## 1. Backend Setup

1. Open a terminal in `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill the variables (like JWT Secrets, Mongo URI, Redis, S3 config).
4. Run the development server:
   ```bash
   npm run dev
   ```

## 2. Frontend Setup

1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
   *(Note: `zustand` and `axios` are already added).*
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```

## Usage
- Open `http://localhost:3000` in your browser.
- You can create a backend route or use Postman to register an initial user via `POST /api/auth/register` with `tenantId="default"`.
- Then, login through the frontend at `http://localhost:3000/login` with those credentials.
