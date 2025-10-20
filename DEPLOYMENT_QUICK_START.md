# 🚀 Deployment Quick Start

> Fast-track guide to deploy Design Kit to Cloudflare Pages in under 30 minutes

---

## ⚡ Prerequisites (5 minutes)

- [ ] GitHub repository ready
- [ ] Cloudflare account created
- [ ] Production Supabase project created
- [ ] Stripe account (optional for MVP)

---

## 🔧 Step 1: Test Locally (5 minutes)

```bash
# Build and test production version
npm run build
npm run start

# Verify deployment readiness
npm run verify-deployment
```

Visit `http://localhost:3000` and test:
- Landing page loads
- Color Picker works
- No console errors

---

## 🌐 Step 2: Deploy to Cloudflare (10 minutes)

### A. Connect Repository

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click **"Create a project"** → **"Connect to Git"**
3. Select your `design-kit` repository
4. Click **"Begin setup"**

### B. Configure Build

```yaml
Project name: design-kit
Production branch: main
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: / (leave empty)
```

### C. Add Environment Variables

**Required (minimum for MVP):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
NEXT_PUBLIC_APP_URL=https://design-kit-xxx.pages.dev
NODE_ENV=production
```

**Optional (add later):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### D. Deploy

Click **"Save and Deploy"**

Wait 2-5 minutes. You'll get: `https://design-kit-xxx.pages.dev`

---

## ✅ Step 3: Verify Deployment (5 minutes)

Visit your deployment URL and check:

- [ ] Landing page loads
- [ ] Color Picker tool works
- [ ] File upload works
- [ ] Color extraction works
- [ ] Copy to clipboard works
- [ ] No console errors
- [ ] HTTPS is enforced

---

## 🔧 Step 4: Update External Services (5 minutes)

### Supabase

Go to Supabase Dashboard → Authentication → URL Configuration:

**Add redirect URLs:**
```
https://design-kit-xxx.pages.dev/auth/callback
https://design-kit-xxx.pages.dev/auth/confirm
```

### Stripe (if configured)

Go to Stripe Dashboard → Webhooks:

**Add endpoint:**
```
https://design-kit-xxx.pages.dev/api/stripe/webhook
```

Select events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy webhook secret and update `STRIPE_WEBHOOK_SECRET` in Cloudflare.

---

## 🌍 Optional: Custom Domain (10 minutes)

### If domain is on Cloudflare:

1. Cloudflare Pages → Your project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter: `designkit.com`
4. DNS configured automatically
5. SSL certificate generated (5-10 minutes)

### If domain is elsewhere:

1. Add CNAME record at your registrar:
   ```
   Type: CNAME
   Name: @
   Value: design-kit-xxx.pages.dev
   ```
2. Wait for DNS propagation (5 min - 48 hours)
3. SSL certificate auto-generated

### Update environment:

```bash
NEXT_PUBLIC_APP_URL=https://designkit.com
```

Update Supabase and Stripe URLs with new domain.

---

## 🎉 Done!

Your Design Kit is now live! 🚀

**Next Steps:**
- Monitor error logs for 24 hours
- Check analytics for traffic
- Gather user feedback
- Plan next features

---

## 📚 Need More Help?

- **Comprehensive Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Full Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Troubleshooting:** See DEPLOYMENT_GUIDE.md → Troubleshooting section

---

## 🚨 Common Issues

### Build fails?
```bash
# Check locally first
npm run build

# If it works locally, check Cloudflare build logs
# Verify all environment variables are set
```

### "Supabase connection failed"?
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is active
- Confirm using production keys, not development

### "CORS errors"?
- Add your domain to Supabase allowed origins
- Update redirect URLs in Supabase dashboard

---

## 📞 Support

- **Cloudflare:** https://support.cloudflare.com/
- **Supabase:** https://supabase.com/support
- **GitHub Issues:** https://github.com/yourusername/design-kit/issues

---

<p align="center">
  <strong>Happy Deploying! 🎨</strong>
</p>
