# YouTube OAuth — Fix `403 access_denied`

## What the error means

```
Erreur 403 : access_denied
```

Google refused to authorize your app. This is **not a bug in MultiPoster** — it is almost always **Google Cloud OAuth consent screen** configuration.

YouTube upload scopes (`youtube.upload`, `youtube.readonly`) are **sensitive**. While your app is in **Testing** mode, **only Test users** you explicitly add can connect.

---

## Fix (10 minutes)

### 1. Open Google Cloud Console

[console.cloud.google.com](https://console.cloud.google.com) → select the project that owns your OAuth client.

### 2. Enable YouTube Data API v3

**APIs & Services → Library** → search **YouTube Data API v3** → **Enable**.

### 3. Configure OAuth consent screen

**APIs & Services → OAuth consent screen**

| Setting | Value |
|---------|--------|
| User type | **External** (for personal Gmail) |
| App name | MultiPoster TN (any name) |
| User support email | Your email |
| Developer contact | Your email |

**Scopes → Add or remove scopes:**

- `.../auth/youtube.upload`
- `.../auth/youtube.readonly`

Save.

### 4. Add yourself as Test user (critical)

Still on **OAuth consent screen** → **Test users** → **Add users**

Add the **exact Gmail address** you use when clicking Connect YouTube in MultiPoster.

Without this step you get **403 access_denied**.

### 5. OAuth client redirect URI

**APIs & Services → Credentials** → your OAuth 2.0 Client ID → **Authorized redirect URIs**:

```
https://multi-flame.vercel.app/api/oauth/youtube/callback
```

Must match exactly (https, no trailing slash).

### 6. Vercel environment variables

| Variable | Value |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Your client ID (`.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | From Google Console |
| `GOOGLE_REDIRECT_URI` | `https://multi-flame.vercel.app/api/oauth/youtube/callback` |

**Redeploy** after changing env vars.

### 7. Connect again

1. Open https://multi-flame.vercel.app (not localhost)
2. **Settings → Connect** on YouTube
3. Sign in with the **same Gmail** you added as Test user
4. If Google shows "App not verified" → **Advanced** → **Go to MultiPoster (unsafe)** — normal in Testing mode

---

## Checklist

| Step | Done? |
|------|-------|
| YouTube Data API v3 **enabled** | ☐ |
| OAuth consent screen configured | ☐ |
| Scopes include **youtube.upload** + **youtube.readonly** | ☐ |
| Your Gmail in **Test users** | ☐ |
| Redirect URI matches Vercel URL | ☐ |
| Client ID + secret in **Vercel** + redeployed | ☐ |

---

## Still failing?

| Symptom | Try |
|---------|-----|
| `access_denied` immediately | Gmail not in Test users, or wrong Google account |
| `redirect_uri_mismatch` | Copy URI from Google Console character-for-character |
| Works locally, not on Vercel | Add same env vars on Vercel and redeploy |
| No "Advanced" link | Add account as Test user first |

---

## Going live (any user can connect)

1. Submit app for **Google OAuth verification** (required for `youtube.upload` in Production)
2. Provide demo video + privacy policy URL
3. After approval, publish OAuth consent screen to **Production**

Until verification, only **Test users** can connect.
