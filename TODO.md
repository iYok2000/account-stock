# TODO — Security & Localization Hardening

1) **Env secrecy**
   - ✅ Root secrets removed from client env typing / .env.example.
   - (Open) Evaluate whether `CALC_ENGINE_SECRET` should be server-only; if yes move call behind API proxy.
   - Auth flow must fetch/check these on the server (route handler / backend), never in the browser.

2) **Auth dev bypass**
   - ✅ Client-side env comparison removed; login now calls backend `/api/auth/login`.

3) **HTML lang correctness**
   - In `app/layout.tsx`, set `<html lang={locale}>` using `getLocale()` instead of hard-coded `"th"`.

4) **Locale static params**
   - Add `generateStaticParams()` in `app/[locale]/layout.tsx` to prebuild all locales for faster startup.

5) **Security headers**
   - Add headers/middleware (or `next.config.ts` headers) for CSP (with `frame-ancestors 'none'` or allowed origins), `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin` (or stricter), `Permissions-Policy` (disable camera/mic/geo by default), and HSTS on HTTPS.

6) **API base & Vercel env**
   - Use HTTPS or relative `/api` for non-local envs; set correct API URL per environment in Vercel.
   - Add the server-only secrets to Vercel Project Settings; keep `.env.example` free of real secrets.

7) **Regression check**
   - After changes, run `npm run lint && npm run build`; verify build output has no public env leaks and locale pages carry correct `lang`.
