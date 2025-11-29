# 🛰️ Earth Engine Service Account Setup for Production

To deploy your app to Render (or any cloud platform), you need to set up a **Service Account** for Earth Engine authentication.

## 📋 Step-by-Step Guide

### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project: **nurture-sync** (or create a new one)

### Step 2: Enable Earth Engine API

1. In the search bar, type "Earth Engine API"
2. Click on "Earth Engine API"
3. Click "Enable" (if not already enabled)

### Step 3: Create a Service Account

1. In the left menu, go to **IAM & Admin** → **Service Accounts**
2. Click **"+ CREATE SERVICE ACCOUNT"**

3. Fill in the details:
   - **Service account name:** `agroindia-earth-engine`
   - **Service account ID:** (auto-generated)
   - **Description:** "Service account for AgroIndia Earth Engine access"
   - Click **"CREATE AND CONTINUE"**

4. Grant permissions:
   - Click "Select a role"
   - Search for "Earth Engine"
   - Select **"Earth Engine Resource Writer"**
   - Click **"CONTINUE"**

5. Click **"DONE"** (skip optional steps)

### Step 4: Create and Download JSON Key

1. Find your new service account in the list
2. Click on the service account email
3. Go to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format
6. Click **"CREATE"**
7. A JSON file will download automatically - **KEEP THIS SAFE!**

The file will look like:
```json
{
  "type": "service_account",
  "project_id": "nurture-sync",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "agroindia-earth-engine@nurture-sync.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### Step 5: Register Service Account with Earth Engine

**IMPORTANT:** You must register the service account with Earth Engine:

1. Go to [Earth Engine Asset Manager](https://code.earthengine.google.com/)
2. Click on your profile icon (top right)
3. Click **"Register a Cloud Project"** or **"Manage Cloud Projects"**
4. Select your project: **nurture-sync**
5. Grant Earth Engine access to your service account email:
   - Email: `agroindia-earth-engine@nurture-sync.iam.gserviceaccount.com`

**OR** use this command line approach:
```bash
# Install Earth Engine CLI
pip install earthengine-api

# Authenticate
earthengine authenticate

# Register service account
earthengine set_project nurture-sync
```

### Step 6: Add to Render Environment Variables

1. Go to your Render dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**

5. Add the service account key:
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value:** Copy the ENTIRE contents of the JSON file (all the text)
   - Click **"Save Changes"**

**Example:**
```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"nurture-sync","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"agroindia-earth-engine@nurture-sync.iam.gserviceaccount.com",...}
```

### Step 7: Redeploy

1. Render will automatically redeploy with the new environment variable
2. Check the logs - you should see:
   ```
   ✅ Earth Engine initialized with service account: agroindia-earth-engine@nurture-sync.iam.gserviceaccount.com
   ```

---

## 🔒 Security Best Practices

### DO ✅
- Keep the JSON key file secure and private
- Use environment variables for the key (never commit to Git)
- Rotate keys periodically (every 90 days)
- Delete unused service accounts

### DON'T ❌
- Never commit the JSON key file to Git
- Never share the private key publicly
- Don't hardcode credentials in your code
- Don't use your personal credentials in production

---

## 🧪 Testing Locally with Service Account

If you want to test with the service account locally:

1. Save the JSON file as `service-account-key.json` in your backend folder
2. Add to `.gitignore`:
   ```
   service-account-key.json
   ```
3. Add to your `.env`:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY=$(cat service-account-key.json)
   ```

   Or on Windows PowerShell:
   ```
   GOOGLE_SERVICE_ACCOUNT_KEY=$(Get-Content service-account-key.json -Raw)
   ```

---

## 🐛 Troubleshooting

### Error: "Service account does not have access to Earth Engine"

**Solution:**
- Make sure you registered the service account with Earth Engine (Step 5)
- Verify the service account has "Earth Engine Resource Writer" role
- Wait a few minutes for permissions to propagate

### Error: "Invalid service account key"

**Solution:**
- Make sure you copied the ENTIRE JSON file content
- Check for any missing quotes or brackets
- Verify the JSON is valid (use a JSON validator)

### Error: "Project not found"

**Solution:**
- Verify `GOOGLE_CLOUD_PROJECT` is set to your correct project ID
- Make sure the project is linked to Earth Engine
- Check that the service account belongs to the correct project

---

## 📝 Quick Checklist

Before deploying:
- [ ] Earth Engine API enabled in Google Cloud
- [ ] Service account created
- [ ] Service account has "Earth Engine Resource Writer" role
- [ ] JSON key downloaded and kept secure
- [ ] Service account registered with Earth Engine
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` added to Render
- [ ] `GOOGLE_CLOUD_PROJECT` set to project ID
- [ ] Backend redeployed
- [ ] Logs show successful Earth Engine initialization

---

## 💰 Cost

Service accounts and Earth Engine API usage are **FREE** for:
- Non-commercial research
- Education purposes
- Development/testing

For commercial use, check [Earth Engine pricing](https://earthengine.google.com/pricing/).

---

## 🔗 Helpful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Earth Engine](https://code.earthengine.google.com/)
- [Earth Engine Service Account Docs](https://developers.google.com/earth-engine/guides/service_account)
- [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs/service-accounts)

---

Need help? Check the troubleshooting section or the Earth Engine documentation!
