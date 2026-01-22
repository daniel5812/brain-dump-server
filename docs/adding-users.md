# Owner Guide: Adding New Users

## When a Friend Wants to Join

### Step 1: They Install the Shortcut
- Send them the shortcut via AirDrop/iCloud
- They change `userId` to their phone number (e.g., `972501234567`)

### Step 2: They Try It
When they use the shortcut, they'll get a WhatsApp message:
> "📋 Todoist עדיין לא מחובר. כדי לחבר..."

### Step 3: They Send You Their Tokens
Ask them to send you:
- **Todoist Token**: Found in Todoist → Settings → Integrations → API Token
- **Gmail Address**: For Google Calendar

### Step 4: You Add to Supabase
1. Go to **Supabase → Table Editor → users**
2. Find their row (by phone) or insert new
3. Add:
   - `todoist_token`: Their token
   - `calendar_id`: Their Gmail address
4. Save

---

## WhatsApp Setup

### Current Setup (Recommended for MVP)
Your Green API instance sends messages to **all users' phones**.
- ✅ Simple: One account, all users
- ✅ Free for you
- ❌ Messages come from YOUR number

### Per-User WhatsApp (Optional)
If a friend wants messages from their **own** number:

1. **They create** an account at [green-api.com](https://green-api.com)
2. **They link** their WhatsApp via QR code
3. **They send you** their credentials:
   - Instance ID
   - API Token
   - API URL
4. **You add** to their row in Supabase:
   - `green_api_instance_id`
   - `green_api_token`
   - `green_api_url`

**Cost**: ~$15/month per user

---

## Quick Reference: What to Add

| Integration | Column | Where User Gets It |
|-------------|--------|-------------------|
| Todoist | `todoist_token` | Todoist → Settings → Integrations → API Token |
| Calendar | `calendar_id` | Their Gmail address |
| WhatsApp | `green_api_*` | green-api.com dashboard |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User gets onboarding message repeatedly | Check their tokens are saved in Supabase |
| Calendar events fail | Make sure they shared calendar with service account |
| WhatsApp not received | Verify their phone format (no + prefix) |
