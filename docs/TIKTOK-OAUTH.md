# TikTok OAuth — Fix `non_sandbox_target`

## What the error means

```
non_sandbox_target
Connexion à TikTok impossible...
```

Your TikTok app is in **Sandbox (development)** mode. Only TikTok accounts listed as **Target Users** in the developer portal can authorize the app.

This is **not** a bug in MultiPoster — it's TikTok's sandbox security rule.

---

## Fix (5 minutes)

### 1. Open TikTok Developer Portal
https://developers.tiktok.com → **Manage apps** → select your app

### 2. Use Sandbox mode
At the top of the app page, toggle to **Sandbox** (not Production).

### 3. Add yourself as Target User
1. **Sandbox settings** (left menu or app page)
2. **Target users** → **Add account**
3. Log in with the **exact TikTok account** you will use to test Connect
4. Wait up to 1 hour for the account to appear (usually instant)

### 4. Configure Login Kit redirect URI
Under **Login Kit** → **Redirect URI**, add exactly:

```
https://multi-flame.vercel.app/api/oauth/tiktok/callback
```

Must match **character for character** (https, no trailing slash unless you added one everywhere).

### 4b. Verify domain ownership (URL properties)

TikTok may require you to prove you own `multi-flame.vercel.app` before OAuth or video posting works.

1. [developers.tiktok.com](https://developers.tiktok.com) → your app → **URL properties** → **Verify**
2. Choose **Domain** (`multi-flame.vercel.app`) or **URL prefix** (`https://multi-flame.vercel.app/`)
3. TikTok offers **DNS TXT record** or **signature file** — file is easiest for Vercel

**Option A — file in `public/` (recommended)**

1. Download the file TikTok gives you (often `tiktok-developers-site-verification.txt`)
2. Save it to `public/tiktok-developers-site-verification.txt` in this repo (exact filename from TikTok)
3. Commit, push, deploy
4. Open `https://multi-flame.vercel.app/tiktok-developers-site-verification.txt` — you should see only the verification code
5. Click **Verify** in TikTok portal

**Option B — Vercel environment variables**

In Vercel → Environment Variables:

| Variable | Example |
|----------|---------|
| `TIKTOK_VERIFICATION_FILENAME` | `tiktok-developers-site-verification.txt` |
| `TIKTOK_VERIFICATION_CONTENT` | paste the exact one-line code from TikTok |

**Redeploy** after setting (rewrite uses filename at build time).

See [TikTok URL verification docs](https://developers.tiktok.com/doc/getting-started-create-an-app).

### 5. Use Sandbox credentials in Vercel
Sandbox and Production have **different** Client Key / Secret.

In **Vercel → Environment Variables**, use the **Sandbox** credentials:
- `TIKTOK_CLIENT_KEY` = Sandbox Client key
- `TIKTOK_CLIENT_SECRET` = Sandbox Client secret
- `TIKTOK_REDIRECT_URI` = `https://multi-flame.vercel.app/api/oauth/tiktok/callback`
- `NEXT_PUBLIC_APP_URL` = `https://multi-flame.vercel.app`

**Redeploy** after changing env vars.

### 6. Enable scopes in Sandbox
In the app, enable at least:
- **user.info.basic** (Login Kit)
- **video.list** (sync reels)
- **video.publish** (posting — may need extra approval)

### 7. Test again
1. Log out of TikTok in browser (optional but helps)
2. Open https://multi-flame.vercel.app
3. Settings → Connect TikTok
4. Log in with the **same account** you added as Target User

---

## Checklist

| Step | Done? |
|------|-------|
| App in **Sandbox** mode | ☐ |
| Your TikTok account in **Target users** | ☐ |
| Redirect URI matches Vercel URL | ☐ |
| **Domain verified** (URL properties) | ☐ |
| **Sandbox** client key in Vercel (not Production) | ☐ |
| Redeployed after env change | ☐ |

---

## When you go live (any user can connect)

1. Switch app to **Production** mode
2. Submit app for **TikTok App Review** (demo video required)
3. After approval, use **Production** client key/secret in Vercel
4. Any TikTok user can connect — no Target Users list needed

---

## Still failing?

| Symptom | Try |
|---------|-----|
| `client_key` error | Wrong sandbox vs production key |
| Redirect mismatch | Copy URI from TikTok portal and `.env` — must be identical |
| Works on one account only | Normal in sandbox — add more Target Users |
| Callback returns `oauth_failed` | Check Vercel logs; MongoDB URI must work on server |
