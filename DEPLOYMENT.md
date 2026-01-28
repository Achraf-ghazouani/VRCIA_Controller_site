# Deployment Guide

This guide will help you deploy your website to Vercel and your WebSocket server to Railway (or another service).

## 📦 Part 1: Deploy WebSocket Server

### Option A: Railway (Recommended - Free tier available)

1. **Create Railway account**: Go to [railway.app](https://railway.app) and sign up

2. **Install Railway CLI** (Optional):
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy via Railway Dashboard**:
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or "Empty Project")
   - If using GitHub:
     - Push your code to GitHub first
     - Select your repository
     - Railway will auto-detect Node.js
   - If using Empty Project:
     - Click on the project
     - Go to Settings → Environment
     - Add PORT variable = 8080 (optional, Railway auto-assigns)
     - Deploy by connecting GitHub or uploading files

4. **Get your WebSocket URL**:
   - Go to your project settings
   - Find your deployment URL (e.g., `your-app.railway.app`)
   - Your WebSocket URL will be: `wss://your-app.railway.app`

5. **Configure CORS** (if needed):
   Railway automatically handles this, but ensure your server accepts connections from any origin (already configured).

---

### Option B: Render (Free tier available)

1. Go to [render.com](https://render.com) and sign up

2. Click "New +" → "Web Service"

3. Connect your GitHub repository or upload manually

4. Configure:
   - **Name**: vrcia-websocket-server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Your WebSocket URL: `wss://your-app.onrender.com`

**Note**: Render free tier may spin down after inactivity, causing initial connection delays.

---

### Option C: Heroku

1. Install Heroku CLI: [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

2. Create and deploy:
   ```bash
   heroku login
   heroku create vrcia-websocket-server
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

3. Your WebSocket URL: `wss://vrcia-websocket-server.herokuapp.com`

---

### Option D: ngrok (For Testing Only)

If you want to keep the server running locally but make it accessible:

1. **Download ngrok**: [ngrok.com](https://ngrok.com)

2. **Run your server locally**:
   ```bash
   npm start
   ```

3. **Expose it with ngrok** (in another terminal):
   ```bash
   ngrok http 8080
   ```

4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. Your WebSocket URL: `wss://abc123.ngrok.io` (replace `https` with `wss`)

**Note**: ngrok URLs change each time you restart, and free tier has connection limits.

---

## 🌐 Part 2: Deploy Website to Vercel

1. **Update WebSocket URL**:
   - Open `config.js`
   - Replace `'wss://your-websocket-server.railway.app'` with your actual WebSocket server URL from Part 1

   ```javascript
   WS_SERVER_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
       ? 'ws://localhost:8080'
       : 'wss://YOUR-ACTUAL-URL.railway.app'  // ← Change this!
   ```

2. **Install Vercel CLI** (Optional):
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel**:

   **Method 1: Vercel CLI**
   ```bash
   vercel
   ```
   Follow the prompts, and Vercel will deploy your site.

   **Method 2: Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "Add New" → "Project"
   - Import your GitHub repository (or drag & drop your folder)
   - Vercel will auto-detect settings
   - Click "Deploy"

4. **Your website is live!** 🎉
   - Vercel will give you a URL like `https://your-site.vercel.app`

---

## 🧪 Testing the Deployment

1. Open your Vercel website URL
2. Check the connection status - should show "Connected"
3. Click a color button
4. If you have Unity running and connected to the same WebSocket server, it should receive the color

---

## 🔧 Troubleshooting

### WebSocket connection fails

**Check:**
- Is your WebSocket server running?
- Did you update `config.js` with the correct URL?
- Is the URL using `wss://` (not `ws://`) for HTTPS sites?
- Check browser console for errors

**Solution:**
- Test WebSocket server directly: `wscat -c wss://your-server-url.railway.app`
- Or use online tool: [websocket.org/echo.html](https://www.websocket.org/echo.html)

### CORS errors

Your server already handles CORS, but if issues persist:
- Make sure server `verifyClient` returns `true`
- Check server logs for connection attempts

### Railway/Render deployment fails

- Check build logs in the dashboard
- Ensure `package.json` has correct start script: `"start": "node server.js"`
- Verify Node.js version compatibility

---

## 📊 Environment Variables (Advanced)

Instead of hardcoding the WebSocket URL, you can use Vercel environment variables:

1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_WS_URL` = `wss://your-server.railway.app`
3. Update `config.js`:
   ```javascript
   WS_SERVER_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
   ```

---

## 💰 Cost Summary

- **Vercel**: Free tier (perfect for this project)
- **Railway**: Free tier with $5 credit/month
- **Render**: Free tier (with spin-down after 15 min inactivity)
- **Heroku**: No longer offers free tier (paid plans start at $5/month)
- **ngrok**: Free tier available (for testing only)

---

## 🚀 Quick Deploy Commands

```bash
# 1. Test locally first
npm start
# Open index.html in browser

# 2. Commit your changes
git init
git add .
git commit -m "Prepare for deployment"

# 3. Deploy WebSocket server (Railway example)
# → Use Railway dashboard or CLI

# 4. Update config.js with your WebSocket server URL

# 5. Deploy to Vercel
vercel

# Done! 🎉
```

---

## 📝 Final Checklist

- [ ] WebSocket server deployed and running
- [ ] WebSocket server URL copied
- [ ] `config.js` updated with production WebSocket URL
- [ ] Website deployed to Vercel
- [ ] Tested color buttons on deployed site
- [ ] Unity app configured to use production WebSocket URL

---

Need help? Check the logs:
- **Vercel logs**: Dashboard → Your Project → Deployments → View Function Logs
- **Railway logs**: Dashboard → Your Project → Deployments → View Logs
- **Browser console**: F12 → Console tab
