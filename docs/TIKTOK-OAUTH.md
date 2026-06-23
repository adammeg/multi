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
