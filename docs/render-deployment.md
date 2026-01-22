# Render + Supabase Deployment Guide

## Token Strategy: Where to Put What

### Render Environment Variables (Server Infrastructure)
These are **shared infrastructure** tokens that the server needs to operate:

| Variable | Purpose | Why in ENV? |
|----------|---------|-------------|
| `OPENAI_API_KEY` | GPT intent parsing | Shared — you pay for all users |
| `HMAC_SECRET` | Request signing | Shared — all shortcuts use same secret |
| `SUPABASE_URL` | Database connection | Server config |
| `SUPABASE_KEY` | Database auth | Server config |
| `GREEN_API_INSTANCE_ID` | WhatsApp sending | Default fallback |
| `GREEN_API_TOKEN` | WhatsApp auth | Default fallback |
| `GREEN_API_URL` | WhatsApp API URL | Default fallback |
| `TODOIST_API_TOKEN` | Task creation | Default fallback |
| `GOOGLE_CALENDAR_ID` | Meeting calendar | Default fallback |

### Supabase Database (Per-User Tokens)
These are stored in the `users` table — each user can have their own:

| Column | Purpose | When to Use |
|--------|---------|-------------|
| `todoist_token` | User's Todoist | If user wants their own task list |
| `calendar_id` | User's calendar | If user wants their own calendar |
| `green_api_*` | User's WhatsApp | If user pays for own Green API (~$15/mo) |
| `hmac_secret` | User's secret | For per-user auth (advanced) |

---

## How It Works

```
User request comes in
    ↓
Server checks Supabase for user config
    ↓
If user has their own token → Use it
If not → Use Render env fallback
```

This means:
- **New users** get YOUR tokens by default
- **Power users** can add their own tokens for full separation

---

## Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Wait for initialization (~2 min)

### 2. Create Database Table
1. Go to **SQL Editor** in Supabase dashboard
2. Paste the contents of `docs/supabase-setup.sql`
3. Click **Run**

### 3. Get Supabase Credentials
1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_KEY`

### 4. Configure Render

In Render dashboard → Your Service → Environment:

```
OPENAI_API_KEY=sk-proj-...
HMAC_SECRET=your-secret-here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GREEN_API_INSTANCE_ID=7107484910
GREEN_API_TOKEN=60ad0ae626694f4e9525e634d291c9273d66c0834a8f4a73b5
GREEN_API_URL=https://7107.api.greenapi.com
TODOIST_API_TOKEN=your-todoist-token
GOOGLE_CALENDAR_ID=your-email@gmail.com
```

### 5. Add User to Supabase
For yourself:
1. Go to **Supabase → Table Editor → users**
2. Click **Insert Row**
3. Fill in:
   - `phone`: `972502765495`
   - `name`: `Daniel`
   - `todoist_token`: (your token)
   - `calendar_id`: `daniel5810005@gmail.com`

---

## Adding a New Friend

### Option A: Uses Your Resources (Easy)
1. Friend installs shortcut
2. Changes `userId` to their phone number
3. Done! Tasks/meetings go to YOUR apps

### Option B: Their Own Resources (Full Separation)
1. Friend installs shortcut
2. Changes `userId` to their phone number
3. You add their tokens to Supabase:
   - Go to Supabase → Table Editor → users
   - Insert row with their phone + tokens

---

## Summary

| Token Type | Location | Who Manages |
|------------|----------|-------------|
| Server infrastructure | Render ENV | You (once) |
| Your personal tokens | Supabase DB | You |
| Friend's tokens | Supabase DB | You (for them) |
