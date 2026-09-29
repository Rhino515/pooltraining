# Pool IQ online accounts (v13)

Free accounts for Andrew and 5–10 friends, on Supabase's free tier. The app stays a static GitHub Pages site and still
works fully signed out and offline. Accounts are optional.

## The project

| | |
| --- | --- |
| Project name | **Rhino515's Project** (the dashboard's default name — left as-is on purpose) |
| Project ref | `nqfwlpfyccbqetcyjijf` |
| Region | `us-west-1` (West US) |
| Plan | Free |
| API URL | `https://nqfwlpfyccbqetcyjijf.supabase.co` |
| Site URL | `https://rhino515.github.io/pooltraining/` |
| Redirect URLs | `https://rhino515.github.io/pooltraining/` and `https://rhino515.github.io/pooltraining/**` |

The client uses the **publishable key** (`sb_publishable_…`), which is public by design — it only identifies the
project. It is in `js/cloud/config.js`. The **secret key** and the **service role key** never leave the Supabase
dashboard and are never in the app or the repo. The personal access token used to set the project up is not stored
anywhere in the repo either.

## Auth

- Email + password only. No magic links: on iPhone a magic link opens in Safari instead of the installed app.
- **Email confirmation is OFF** (`mailer_autoconfirm`), so a friend can create an account and use it immediately.
- Password reset still sends an email. On iPhone that link opens in Safari: set the new password there, then go back
  to the Pool IQ app and sign in. Links redirect back to the site URL above.

### The built-in email service only reaches the project owner

The project uses Supabase's built-in email sender (no custom SMTP). That sender only delivers to **pre-authorized
addresses** — the members of the Supabase organization — and is capped at about 2 emails an hour. So a friend's
"Forgot password" email will fail with "Email address not authorized" unless you set up your own SMTP provider
(Authentication → Emails → SMTP Settings; a free Resend or similar account is enough).

Until then, reset a friend's password yourself — see below.

## What's stored where

Everything stays on the phone first (the existing localStorage keys, IndexedDB mirror, snapshots and backup files are
unchanged). When signed in, three things are also stored in Supabase:

| Where | What | Who can read | Who can write |
| --- | --- | --- | --- |
| `profiles` | Display name, photo URL, the local profile id | Any signed-in user (leaderboard names/photos) | Only the owner |
| `saves` | **One private JSON backup per account** — exactly the v9 backup format (`pool-iq-backup`: career, sessions, Ghost matches, drills, shots, content, friends, profile…) plus a small summary, app version and which device saved it | Only the owner | Only the owner |
| `public_stats` | The public stats export: Career rank + ball level, Drill Rank, Lifetime XP, stars, Ghost record, skill levels, and — only if the player switches it on in Settings — the friend-match win record | Any signed-in user | Only the owner |
| `avatars` storage bucket (public) | The profile photo at `avatars/<user id>/avatar`, the same 256×256 downscaled photo the app already makes (≤ 200 KB, JPEG/PNG/WebP) | Anyone with the URL | Only the owner, only inside their own folder |

Row-level security is on for every table, and the signed-out (anon) role can read nothing. The SQL is
`supabase/schema.sql` (no secrets) and is already applied. Re-run it any time from the dashboard's SQL Editor — every
statement is safe to run again.

A few rules the app enforces on top of the policies:

- Automatic cloud backup runs ~20 seconds after a session is saved, and only when something changed.
- If the cloud save was changed on another device since this phone last saw it, automatic backup **pauses** and
  Settings asks you to choose. Nothing is overwritten silently.
- Signing in on a new phone offers to restore the cloud save. Choosing restore always confirms first, and a snapshot
  of the phone is taken before anything is replaced (undo from Settings → Restore previous snapshot).
- DEV MODE test states are never backed up or shared.
- Cloud bookkeeping (device id, last upload) lives in `poolIQMetaV1`, which is not part of backups, so it stays
  per-phone.

## Reset a friend's password

Dashboard → **Authentication** → **Users** → find the friend → **⋮** → **Reset password** (or **Send password recovery**
if their address can receive the built-in email).

From the SQL Editor (the method verified during setup), set a temporary password and tell them to change it in the
app under Account → Change password:

```sql
update auth.users
set encrypted_password = extensions.crypt('the-temporary-password', extensions.gen_salt('bf'))
where email = 'friend@example.com';
```

## Deleting an account

Dashboard → Authentication → Users → the user → Delete. `profiles`, `saves` and `public_stats` rows are removed
automatically (they cascade). Delete their photo too: Storage → avatars → their folder.

## Local development

`scripts/e2e-accounts.mjs` tests the whole flow against a mocked Supabase (no network, no project needed) and is part
of `scripts/e2e.mjs`. The live project was checked once during setup: create user, profile, avatar, cloud save,
public stats, leaderboard read, RLS blocking another user, then full cleanup.
