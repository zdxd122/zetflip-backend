# BloxPVP Casino - Shared Hosting + Render Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the BloxPVP Casino application using Hostinger shared hosting for the frontend and Render for the backend. This setup is completely free and secure.

## 🚀 **SIMPLEST WAY - Just 4 Steps**

### **Step 1: Upload Files**
1. First, build the frontend: In your `Frontend/` folder, run `npm run build`
2. Go to [hpanel.hostinger.com](https://hpanel.hostinger.com) and login
3. Click **"Files"** → **"File Manager"**
4. Open `public_html` folder
5. Upload all files from your `Frontend/dist/` folder to `public_html/`
6. Make sure you see `index.html` directly in `public_html`

### **Step 2: Set Website Folder**
1. Click **"Domains"** in left menu
2. Click on your domain name
3. Find **"Document Root"**
4. Change it to: `public_html`
5. Click **"Save"**

### **Step 3: Enable SSL Certificate**
1. Click **"SSL"** in left menu
2. Find your domain in the SSL certificates list
3. If SSL is not enabled, click **"Enable SSL"** or **"Install Certificate"**
4. Select **"Let's Encrypt"** (free option)
5. Click **"Install"** or **"Enable"**
6. Wait 5-10 minutes for the certificate to be issued

**Note:** In some cases, SSL may be enabled automatically when you add your domain. Check the SSL status first.

### **Step 4: Check Your Website**
1. Type your domain in browser
2. You should see your website!

## ⚠️ **What Works:**
- ✅ Website loads and looks good
- ✅ Pages change when you click links
- ✅ Works on phone and computer
- ✅ Secure (HTTPS) connection

## ⚠️ **What Doesn't Work:**
- ❌ User login
- ❌ Chat messages
- ❌ Games and betting
- ❌ User accounts

## 💡 **For Full Website (Recommended):**
Deploy backend to **Railway** (free tier available) and frontend to Hostinger. This provides a secure, fully functional website with HTTPS.

---

## Backend Deployment (Render - Free Tier)

### Step 1: Prepare Your Code
1. Install Git if not already installed:
   - Download from [git-scm.com](https://git-scm.com/downloads)
   - Follow the installation wizard
2. Create a new repository on GitHub (e.g., `bloxpvp-backend`)
3. Open terminal in `Backend/` folder
4. Initialize git: `git init`
5. Set git identity: `git config user.name "Your Name"` and `git config user.email "your-email@example.com"`
6. Add files: `git add .`
7. Commit: `git commit -m "Initial commit"`
8. Add remote: `git remote add origin https://github.com/yourusername/bloxpvp-backend.git` (skip if already added)
9. Push: `git push -u origin main`

### Step 2: Set Up Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account:
   - In Render dashboard, go to Account > Connected Accounts > GitHub
   - Click "Connect GitHub"
   - Authorize Render to access your repositories

### Step 3: Deploy Backend
1. In Render dashboard, click **"New"** > **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set environment variables:
   - `PORT` (Render sets this automatically)
   - `JWT_SECRET=your-secure-random-jwt-secret`
   - `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
     - Get this from MongoDB Atlas:
       1. Go to Clusters > Connect > Connect your application
       2. Choose "Node.js" driver
       3. Copy the connection string
       4. Replace `<username>`, `<password>`, `<cluster>`, `<database>` with actual values
   - Other variables as in `.env.production`

### Step 4: Get Backend URL
1. After deployment, Render provides a URL like `https://your-app.onrender.com`
2. Note this URL for the frontend config


### Step 5: Update Frontend Config
In `Frontend/src/config.js`, update the API URL:
```javascript
export default {
  api: "https://your-app.onrender.com", // Use Render URL
  h_captcha_key: "your-hcaptcha-key"
};
```

### Step 6: Deploy Frontend to Hostinger
Follow the simple steps above for frontend deployment.

---

## Prerequisites

### Required:
- Hostinger shared hosting account
- Domain name
- MongoDB Atlas account (for database)
- GitHub account
- Basic knowledge of FTP/SFTP

## Project Structure
```
bloxpvp-casino-roblox-fresh-main/
├── Backend/          # Node.js/Express API server
├── Frontend/         # React/Vite frontend application
└── DEPLOYMENT.md     # This deployment guide
```


## Step 2: Database Setup

### 2.1 MongoDB Atlas Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier is sufficient)
3. Create database user with read/write permissions
4. Whitelist your Hostinger IP address (0.0.0.0/0 for testing)
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/bloxpvp_casino`

## Step 2: Backend Deployment (Render)

## Step 3: Frontend Deployment

### 3.1 Upload Frontend Files
1. Upload all files from `Frontend/dist/` folder to `public_html/`
2. The `.htaccess` file should already be included for proper routing

### 3.2 Configure Frontend for Production
The frontend is already built for production and configured to connect to the backend API.

## Step 4: Domain Configuration

### 4.1 Point Domain to Frontend
1. In Hostinger control panel, go to **Domains**
2. Set document root for your domain to `public_html`

### 4.2 Configure API Subdomain (Optional)
If you want to use a subdomain for the API:
1. Create subdomain `api.yourdomain.com`
2. Point it to `public_html/api`
3. Update frontend config to use the subdomain

## Step 5: SSL Certificate

### 5.1 Enable SSL
1. In Hostinger control panel, go to **SSL**
2. Find your domain in the SSL certificates list
3. If SSL is not enabled, click **"Enable SSL"** or **"Install Certificate"**
4. Select **"Let's Encrypt"** (free option)
5. Click **"Install"** or **"Enable"**
6. Wait 5-10 minutes for the certificate to be issued

### 5.2 SSL Status
- **Domain**: zetflip.com
- **SSL Type**: Lifetime SSL (Let's Encrypt)
- **Status**: Active
- **Created at**: 2025-09-09
- **Expires at**: Never

## Step 6: Testing and Monitoring

### 6.1 Test Your Deployment
1. Visit your domain in a web browser
2. Check that the frontend loads correctly
3. Test API endpoints by making requests to your backend

### 6.2 Monitor Logs
1. Check backend logs in Render dashboard
2. Monitor server performance in Hostinger control panel
3. Set up error monitoring if needed

## 🔗 **Backend-Frontend Connection Verification**

### **Why Connection Verification Matters**
After deployment, it's crucial to verify that your frontend (Hostinger) can properly communicate with your backend (Render). Connection issues can prevent login, chat, games, and other features from working.

### **Method 1: Health Check Endpoint**
Test the most basic connection:

```bash
curl https://your-render-app.onrender.com/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2025-09-11T21:04:54.027Z"}
```

### **Method 2: Login Endpoint Test**
Test the login functionality:

```bash
curl -X POST https://your-render-app.onrender.com/connect-roblox \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"referrer\":\"\"}"
```

**Expected Response:** A random description code like:
```
AdoptFlip | sad mile chief fought popular six heard line traffic what
```

### **Method 3: Browser Network Tab**
1. Open your browser's Developer Tools (F12)
2. Go to the **Network** tab
3. Try to login on your frontend
4. Look for requests to your Render URL
5. Check response status codes (should be 200)

### **Method 4: Backend Logs Monitoring**
Watch your Render backend logs for:
- ✅ `"🔍 Login attempt - Step: 1"`
- ✅ `"🔍 Request body: { username: 'testuser', referrer: '' }"`
- ✅ `"127.0.0.1 - POST /connect-roblox HTTP/1.1 200"`

### **Method 5: Frontend Console Logs**
1. Open browser Developer Tools
2. Go to **Console** tab
3. Try login and watch for:
   - Network errors
   - CORS errors
   - API response logs

### **Common Connection Issues & Solutions**

#### **CORS Errors**
```javascript
// Add to backend app.js if needed:
const cors = require('cors');
app.use(cors({
  origin: 'https://yourdomain.com', // Your Hostinger domain
  credentials: true
}));
```

#### **Wrong API URL**
Update `Frontend/src/config.js`:
```javascript
export default {
  api: "https://your-render-app.onrender.com", // Correct Render URL
  h_captcha_key: "your-hcaptcha-key"
};
```

#### **Backend Not Responding**
- Check Render dashboard for backend status
- Verify environment variables in Render
- Check MongoDB connection
- Review Render logs for errors

#### **Frontend Config Issues**
- Ensure `npm run build` was run after config changes
- Verify `dist/` files were uploaded to Hostinger
- Clear browser cache after updates

### **Connection Status Checklist**
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Login endpoint accepts requests
- [ ] Browser Network tab shows successful API calls
- [ ] Backend logs show incoming requests
- [ ] No CORS errors in browser console
- [ ] Login functionality works end-to-end

### **Quick Connection Test Script**
Create a test file to verify all endpoints:

```bash
#!/bin/bash
echo "Testing Backend-Frontend Connection..."

# Test health endpoint
echo "1. Health Check:"
curl -s https://your-render-app.onrender.com/health

echo -e "\n\n2. Login Test:"
curl -s -X POST https://your-render-app.onrender.com/connect-roblox \
  -H "Content-Type: application/json" \
  -d '{"username":"connectiontest","referrer":""}'

echo -e "\n\nConnection test complete!"
```

## Step 7: Production Optimization

### 7.1 Performance Optimization
- Enable GZIP compression in Hostinger control panel
- Set up CDN if needed
- Optimize images and assets

### 7.2 Security Measures
- Keep dependencies updated
- Use strong passwords
- Enable firewall rules
- Regular backups

## Troubleshooting

### Common Issues

**Backend not starting:**
- Check Render logs for errors
- Verify environment variables are set correctly in Render
- Check MongoDB connection string

**Frontend not loading (403 Forbidden):**
- Ensure `index.html` is directly in `public_html` (not in a subfolder)
- Check that `.htaccess` file is uploaded (for SPA routing)
- Verify document root is set to `public_html`
- Rebuild frontend with `npm run build` to include latest changes
- Clear browser cache

**Frontend not loading:**
- Verify files are uploaded to correct directory
- Check `.htaccess` file is present
- Clear browser cache

**API connection issues:**
- Verify backend is running on Render
- Check CORS settings in backend
- Confirm API endpoints are accessible
- Update frontend config with correct Render URL

## Support
If you encounter issues during deployment:
1. Check Hostinger documentation
2. Review server logs
3. Contact Hostinger support for hosting-specific issues

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Backend server port | 3000 |
| JWT_SECRET | JWT signing secret | secure-random-string |
| MONGODB_URI | MongoDB connection string | mongodb+srv://... |
| XP_CONSTANT | XP multiplier | 10 |
| TRANSACTION_SECRET | Transaction signing secret | secure-random-string |
| OXAPAY_MERCHANT_API_KEY | OxaPay merchant key | your-key-here |
| PAYOUT_API_KEY | OxaPay payout key | your-key-here |
| HCAPTCHA_SECRET | hCaptcha secret | your-secret-here |
| NODE_ENV | Environment | production |

## File Structure After Deployment

```
public_html/                # Frontend files
├── assets/
├── index.html
├── .htaccess
└── ...

# Backend is deployed on Render
# Database is on MongoDB Atlas
```

## Backup Strategy
- Regular database backups via MongoDB Atlas
- File backups via Hostinger control panel
- Keep deployment scripts and configs versioned
- Render provides automatic backups for the backend

---

**Note:** This guide assumes you have basic knowledge of web hosting and server management. If you're new to deployment, consider starting with Hostinger's documentation or consulting with a developer.