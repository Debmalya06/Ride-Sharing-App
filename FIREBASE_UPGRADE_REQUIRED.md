# ⚠️ Firebase Upgrade Required to Blaze Plan

## What's Needed

Your Firebase project needs to be upgraded to **Blaze (Pay-as-you-go)** plan to deploy Cloud Functions.

**Good news:** Cloud Functions are FREE for the first 2 million calls per month! You only pay if you exceed that.

---

## How to Upgrade

### Step 1: Open Firebase Console
Go to: https://console.firebase.google.com/project/ridesharing-692d1/usage/details

### Step 2: Click "Upgrade to Blaze"
You'll see a blue button at the top or in the usage section

### Step 3: Add Payment Method
- Add your credit/debit card
- Choose billing account
- Confirm upgrade

### Step 4: Wait for Upgrade
Takes 1-2 minutes

### Step 5: Try Deploy Again
```powershell
firebase deploy --only functions:sendOtp
```

---

## Pricing

✅ **FREE:**
- First 2 million function invocations per month
- First 400,000 GB-seconds per month
- First 200,000 GB-seconds for background functions

💰 **If You Exceed:**
- $0.40 per million invocations
- $0.0000025 per GB-second

**For your use case: ~FREE** (unless you have 1000+ users)

---

## Alternative: Use HTTP Endpoint Instead

If you don't want to upgrade, we can use **REST API** instead:

1. Your backend calls Twilio directly (not via Cloud Function)
2. No Cloud Function deployment needed
3. Works without Blaze plan

Which do you prefer?

**Option A:** Upgrade to Blaze (Free tier included)
**Option B:** Use direct Twilio REST API from backend

Let me know! 🚀
