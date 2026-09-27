# 🏫 School Relief Planning System

A modern, full-stack Web Application for substitute teacher scheduling and relief allocation. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Neon Serverless Postgres**.

---

## 🌟 Core Features

1. **Admin Dashboard (Home Page)**
   - Live DB stats summary cards: Total Absent Today, Classes Needing Cover, Classes Covered.
   - Absence registration form saving directly to the Neon PostgreSQL database.
   - Real-time today's absent staff roster management.

2. **Workload Parameters (Settings Panel)**
   - Configurable policy limits for `maxConsecutivePeriods` and `maxTotalPeriodsPerDay`.
   - Persisted in the database `SystemSettings` table.
   - Enforces workload logic across backend matching algorithm to prevent teacher burnout.

3. **Smart Relief Assignment Interface (The Core Tool)**
   - **Left Panel:** Interactive list of "Classes Needing Coverage" for any date, displaying Period Number, Subject, Absent Teacher, and **prominently highlighted Reporting Venues** (e.g. `📍 Classroom 4A`).
   - **Right Panel:** Advanced Backend Matching Algorithm executing rules:
     - **Rule 1:** Teacher is NOT marked absent for today.
     - **Rule 2:** Teacher's timetable slot for this period/day is marked `isFreePeriod = true`.
     - **Rule 3:** Adding this period will NOT exceed `maxTotalPeriodsPerDay`.
     - **Rule 4:** Adding this period will NOT exceed `maxConsecutivePeriods` in a row.
   - **Soft Warning Feature:** Shows a yellow warning badge when a teacher is exactly 1 period away from their maximum daily limit.
   - **Exclusion Transparency Toggle:** Switch to view unavailable teachers with explicit tags explaining *why* they were excluded.
   - **Toast Notifications:** Instant success/error toasts on Server Action mutations.

4. **Daily Relief Masterlist & Export**
   - Central overview querying all successful `ReliefAssignments` for the selected date.
   - Prominently displays Assigned Teacher, Subject, and Venue.
   - One-click **Export to CSV** for administrative recording.
   - Native **Print Masterlist** formatted view.

5. **Built-in Database Seeding Tool**
   - Includes a seed script (`prisma/seed.ts`) populating 25 teachers across 8 departments, a 5-day timetable (8 periods/day), default settings, and pre-marked absences.
   - One-click "Reset & Seed Demo DB" button in the app header.

---

## 🚀 Technology Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Glassmorphism, Vibrant visual hierarchy)
- **Icons:** Lucide React
- **Database:** Neon (Serverless Postgres)
- **ORM:** Prisma ORM

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- pnpm or npm

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy `.env.example`):
```env
DATABASE_URL="postgresql://username:password@ep-xxxxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 4. Initialize Database Schema & Seed Data
```bash
# Push schema to database
pnpm prisma db push

# Seed Evergreen Primary School dummy data
pnpm db:seed
```

### 5. Start Local Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel with Neon Serverless Postgres

### Step 1: Provision a Neon Postgres Database
1. Go to [Neon.tech](https://neon.tech) and create a new project (e.g. `evergreen-school-relief`).
2. Copy your Connection String from the Neon Dashboard (starts with `postgresql://...`).

### Step 2: Push Code to GitHub / Git Provider
Push this codebase to your GitHub repository.

### Step 3: Deploy on Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Under **Environment Variables**, add:
   - Key: `DATABASE_URL`
   - Value: `<YOUR_NEON_POSTGRES_CONNECTION_STRING>`
3. The `package.json` is pre-configured with the standard build script:
   ```json
   "build": "prisma generate && prisma db push && next build"
   ```
   This ensures Vercel automatically generates the Prisma Client and applies schema changes to your Neon database during deployment.
4. Click **Deploy**.

### Step 4: Seed Neon Database on Vercel
Once deployed, click the **"Reset & Seed Demo DB"** button in the header of your live Vercel app to initialize the 25 teachers, timetable slots, and default settings into Neon!

---

## 📄 License
MIT License. Built for Evergreen Primary School Relief Planning.
