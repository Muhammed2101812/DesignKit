# ✅ Deployment Checklist

Use this checklist to ensure your Design Kit application is ready for production deployment to Cloudflare Pages.

---

## 📋 Pre-Deployment

### Local Testing

- [ ] Run production build locally: `npm run build`
- [ ] Test production server: `npm run start`
- [ ] Verify all pages load correctly
- [ ] Test Color Picker tool functionality
- [ ] Check responsive design on mobile
- [ ] Verify no console errors
- [ ] Run type checking: `npm run type-check`
- [ ] Run linting: `npm run lint`
- [ ] Run tests: `npm run test`

### Environment Variables

- [ ] Copy `.env.production.example` as reference
- [ ] Verify all required variables are documented
- [ ] Prepare production values (no test keys!)
- [ ] Run verification: `npm run verify-deployment`

---

## 🔐 Supabase Setup

### Database

- [ ] Create production Supabase project
- [ ] Run database migrations (from `supabase/migrations/`)
- [ ] Enable Row Level Security on all tables
- [ ] Create RLS policies
- [ ] Create database functions
- [ ] Run verification query: `supabase/verify_setup.sql`
- [ ] Test database connection

### Authentication

- [ ] Enable Email/Password authentication
- [ ] Configure email templates (confirmation, password reset)
- [ ] Set up OAuth providers (Google, GitHub) if needed
- [ ] Configure redirect URLs:
  - `https://yourdomain.com/auth/callback`
  - `https://yourdomain.com/auth/confirm`
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test password reset

### API Keys

- [ ] Copy Supabase URL
- [ ] Copy Supabase Anon Key (public)
- [ ] Copy Service Role Key (keep secret!)
- [ ] Verify keys are from production project

---

## 💳 Stripe Setup

### Products & Pricing

- [ ] Create Stripe account (or use existing)
- [ ] Switch to Live mode (not Test mode)
- [ ] Create Premium product ($9/month)
- [ ] Create Pro product ($29/month)
- [ ] Copy Premium Price ID
- [ ] Copy Pro Price ID

### API Keys

- [ ] Copy Publishable Key (starts with `pk_live_`)
- [ ] Copy Secret Key (starts with `sk_live_`)
- [ ] Verify using LIVE keys, not test keys

### Webhook

- [ ] Create webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy Webhook Signing Secret (starts with `whsec_`)
- [ ] Test webhook with Stripe CLI (optional)

---

## 🌐 Cloudflare Pages Setup

### Account & Project

- [ ] Create Cloudflare account
- [ ] Navigate to Workers & Pages → Pages
- [ ] Click "Create a project"
- [ ] Connect GitHub repository
- [ ] Select `design-kit` repository

### Build Configuration

- [ ] Framework preset: **Next.js**
- [ ] Build command: `npm run build`
- [ ] Build output directory: `.next`
- [ ] Root directory: `/` (leave empty)
- [ ] Node version: **18.x** or higher

### Environment Variables

Add all variables in Cloudflare Pages → Settings → Environment Variables:

**Required:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NODE_ENV=production`

**Stripe (if ready):**
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_)
- [ ] `STRIPE_SECRET_KEY` (sk_live_)
- [ ] `STRIPE_WEBHOOK_SECRET` (whsec_)
- [ ] `STRIPE_PREMIUM_PRICE_ID`
- [ ] `STRIPE_PRO_PRICE_ID`

**Optional:**
- [ ] `REMOVE_BG_API_KEY`
- [ ] `REPLICATE_API_KEY`
- [ ] `UPSTASH_REDIS_URL`
- [ ] `UPSTASH_REDIS_TOKEN`
- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`

### Deploy

- [ ] Click "Save and Deploy"
- [ ] Monitor build logs
- [ ] Wait for deployment to complete (2-5 minutes)
- [ ] Note the deployment URL: `https://design-kit-xxx.pages.dev`

---

## 🌍 Custom Domain (Optional)

### Domain Setup

- [ ] Purchase domain (if needed)
- [ ] Go to Cloudflare Pages → Custom domains
- [ ] Click "Set up a custom domain"
- [ ] Enter domain: `designkit.com`
- [ ] Follow DNS configuration instructions
- [ ] Wait for SSL certificate (5-10 minutes)

### DNS Configuration

If domain is on another registrar:
- [ ] Add CNAME record: `@ → design-kit-xxx.pages.dev`
- [ ] Add CNAME record: `www → design-kit-xxx.pages.dev`
- [ ] Wait for DNS propagation (up to 48 hours)

---

## 🔧 Post-Deployment Configuration

### Update External Services

- [ ] Update Supabase redirect URLs with production domain
- [ ] Update Stripe webhook URL with production domain
- [ ] Update OAuth callback URLs (Google, GitHub)
- [ ] Update `NEXT_PUBLIC_APP_URL` if using custom domain

### Verify Deployment

- [ ] Visit production URL
- [ ] Test landing page loads
- [ ] Test navigation (header, footer)
- [ ] Test Color Picker tool
- [ ] Test file upload
- [ ] Test color extraction
- [ ] Test copy to clipboard
- [ ] Test export palette
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout
- [ ] Test mobile responsive design
- [ ] Check browser console for errors
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)

### Performance

- [ ] Run Lighthouse audit (target score > 90)
- [ ] Check First Contentful Paint < 1.5s
- [ ] Check Largest Contentful Paint < 2.5s
- [ ] Check Time to Interactive < 3.5s
- [ ] Verify images are optimized
- [ ] Check bundle size is reasonable

### Security

- [ ] Verify HTTPS is enforced
- [ ] Check SSL certificate is valid
- [ ] Verify no sensitive data in client code
- [ ] Test RLS policies in Supabase
- [ ] Verify environment variables are not exposed
- [ ] Check CSP headers are configured

---

## 📊 Monitoring Setup (Optional)

### Analytics

- [ ] Set up Plausible Analytics
- [ ] Add domain to Plausible
- [ ] Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in Cloudflare
- [ ] Verify analytics tracking works

### Error Tracking

- [ ] Create Sentry project
- [ ] Copy Sentry DSN
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in Cloudflare
- [ ] Test error reporting
- [ ] Configure error filtering

### Uptime Monitoring

- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure alerts for downtime
- [ ] Set up status page (optional)

---

## 📝 Documentation

### Update Documentation

- [ ] Update README.md with production URL
- [ ] Update API documentation with production endpoints
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document rollback procedure

### Team Communication

- [ ] Notify team of deployment
- [ ] Share production URL
- [ ] Share admin credentials (securely)
- [ ] Schedule post-deployment review

---

## 🎉 Launch

### Final Checks

- [ ] All checklist items completed
- [ ] Production tested thoroughly
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Backup plan ready

### Go Live

- [ ] Announce launch
- [ ] Monitor error logs for first 24 hours
- [ ] Check analytics for user behavior
- [ ] Gather initial user feedback
- [ ] Plan next iteration

---

## 🚨 Rollback Plan

If something goes wrong:

1. **Immediate Rollback:**
   - Go to Cloudflare Pages → Deployments
   - Find previous successful deployment
   - Click "..." → "Rollback to this deployment"

2. **Investigate Issue:**
   - Check build logs
   - Check error logs (Sentry)
   - Check browser console
   - Review recent changes

3. **Fix and Redeploy:**
   - Fix issue locally
   - Test thoroughly
   - Push to GitHub
   - Monitor new deployment

---

## 📞 Support Contacts

- **Cloudflare Support:** https://support.cloudflare.com/
- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com/
- **Team Lead:** [Your contact info]

---

## 📅 Post-Launch Schedule

### Day 1
- [ ] Monitor error logs every 2 hours
- [ ] Check analytics for traffic
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately

### Week 1
- [ ] Daily error log review
- [ ] Weekly analytics review
- [ ] Gather user feedback
- [ ] Plan improvements

### Month 1
- [ ] Performance optimization
- [ ] Feature enhancements
- [ ] User experience improvements
- [ ] Marketing push

---

**Last Updated:** [Date]  
**Deployment Status:** [ ] Not Started | [ ] In Progress | [ ] Complete  
**Production URL:** [Your URL]

---

<p align="center">
  <strong>Good luck with your deployment! 🚀</strong>
</p>
