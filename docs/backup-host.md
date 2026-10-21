# Snapfront's backup copy (Render)

Railway runs Snapfront. Render keeps a second copy that is ready to take over if Railway goes down.

**How the copy stays current.** The copy (`STANDBY=true`) deploys from GitHub on every push, just like Railway. It asks the main server for its data using `BACKUP_TOKEN`:
- when it starts, it copies the database;
- 30 seconds later, it copies the photos, downloads, videos and lesson videos;
- every 6 hours, it copies new files and restarts, which loads a fresh database.

**Why the copy does nothing while it waits.** Until it's switched on, every page shows a short "backup copy" notice. So it never sends an email, publishes a post, takes a payment or replies to a DM twice. `https://<render address>/standby` shows when it last caught up.

## One-time setup

1. **Railway:** `BACKUP_TOKEN` is set on the `snapfront-api` service. Open Variables and copy its value.
2. **Render:**
   1. Go to Blueprints, choose New Blueprint, and pick the `riyahstaff/snapfront` repo. Render reads `render.yaml` from it.
   2. When it asks for values, paste `BACKUP_TOKEN` and copy every other value from Railway's Variables page unchanged.
   3. Create it. The Starter plan with a 10 GB disk is enough while it waits.
3. After about 5 minutes, open `https://snapfront-backup.onrender.com/standby`. It should show a recent `database_copied_at` and a file count.

## If Railway goes down: switch to Render

1. **Load the freshest data.** In Render, open snapfront-backup and choose Manual Deploy, then Restart service. If Railway still answers, the copy pulls its latest data. If not, it keeps the last copy, which is at most 6 hours old.
2. **Turn the copy on.** In Environment, set `STANDBY` to `false`, change the plan to Standard (2 GB memory), and save. It redeploys as the live server.
3. **Point the domains at Render.** In Render, go to Settings, then Custom Domains, and add `snapfront.app`, `app.snapfront.app` and `*.snapfront.app`. Then change the DNS records to what Render shows, at Cloudflare or wherever snapfront.app's DNS lives. Visitors move over as DNS updates, usually within minutes.
4. **Webhooks follow the domain.** Stripe and Meta send to snapfront.app, so they follow on their own.

## Going back to Railway

1. Railway has to get Render's data first. Swap the roles:
   - On Railway, set `STANDBY=true` and `PRIMARY_URL=https://snapfront-backup.onrender.com`, then restart.
   - Wait until Railway's `/standby` shows a fresh copy.
2. Set `STANDBY=false` on Railway and `STANDBY=true` on Render.
3. Point DNS back to Railway.

## Notes
- **Never run both with `STANDBY=false` at once.** They would each send emails and posts, and orders would split between two databases.
- **`BACKUP_TOKEN` reads all of Snapfront's data.** Keep it only in the two hosts' variables, never in the code. If it leaks, set a new value on both.
