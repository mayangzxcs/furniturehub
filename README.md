# FurnitureHub

A furniture inspiration and community platform built with React, Vite, TypeScript, and Supabase.

## Features

- 🛋️ Browse and discover furniture posts by category
- ❤️ Like, comment, share, and favorite posts
- 💬 Real-time chat with admins
- 👤 User profiles with avatars
- 🔔 Notifications system
- 📊 Admin dashboard with analytics
- 🔍 Search posts and users
- 🌓 Dark/light theme support

## Tech Stack

- **Frontend**: React 19, Vite 8, TypeScript, Bootstrap 5
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- A Vercel account

### 1. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the **SQL Editor**, run the schema migration:
   - `supabase/migrations/20260714140248_create_furniturehub_schema.sql`
3. Run the storage policies:
   - `supabase/migrations/20260714141113_storage_policies.sql`
4. Create a **`furniture`** storage bucket (Storage → New bucket → public)

### 2. Configure Environment

Copy `.env` and set your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Seed Data (Optional)

Run the seed script to populate demo data:

```bash
npm run seed
```

This creates:
- **Admin**: `admin@homeofcomfort.com` / `admin123`
- **Viewer**: `viewer@homeofcomfort.com` / `viewer123`
- 6 categories, 6 posts with images, comments, likes, favorites, chat messages, notifications

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy** — Vercel auto-detects Vite and builds the project

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utilities, hooks, Supabase client
│   ├── pages/          # Page components
│   └── styles/         # Global styles
├── supabase/
│   ├── migrations/     # SQL schema and policies
│   ├── seed.sql        # SQL seed data
│   └── seed.ts         # Node.js seed script
├── vercel.json         # Vercel SPA routing config
└── package.json
```

## Security Notes

- The `supabase/seed.ts` script contains admin credentials — remove it from the repo after seeding
- The `api/` directory contains the old PHP backend for local development only — it's not used in production
- Never commit `.env` files to version control