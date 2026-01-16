# WebSocket Connection Troubleshooting Guide

## Problem Overview
You're experiencing WebSocket connection failures with Socket.IO returning 502 errors. This typically happens when:
1. The backend server is not running or not properly configured
2. The WebSocket URL is incorrectly formatted
3. CORS configuration is blocking the connection
4. Render or hosting platform has WebSocket disabled or misconfigured

## Fixed Issues

### 1. **Socket URL Construction**
**Problem:** The code was showing `https://nyayasaathi-final.onrender.com\api` (backslash instead of forward slash)

**Solution:** Updated socket URL construction in both `VideoCallPage.jsx` and `ChatWindow.jsx` to:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const socketUrl = apiUrl.replace(/[\\/]api$/i, '').replace(/\\/g, '/');
```

This now handles:
- Both forward slashes (`/api`) and backslashes (`\api`)
- Case-insensitive matching
- Proper URL normalization

### 2. **Backend Socket.IO Configuration**
Enhanced the Socket.IO server configuration with:
- Explicit path: `/socket.io`
- Both `websocket` and `polling` transports
- Increased timeout values for stability
- Better logging for debugging

## Configuration Requirements

### Frontend `.env` File
Create a `.env` file in the `Frontend` directory:

```bash
# For local development
VITE_API_URL=http://localhost:5001/api

# For production (Render)
VITE_API_URL=https://nyayasaathi-final.onrender.com/api
```

**Important:** 
- The URL MUST use forward slashes (`/`)
- Include the `/api` suffix
- Socket.IO will connect to the base URL automatically (without `/api`)

### Backend `.env` File
Update your `Backend/.env` file:

```bash
# CORS Origins (comma-separated, NO /api suffix)
CORS_ORIGIN=https://nyayasaathi.vercel.app,http://localhost:5173

# For Render deployment, also add:
# CORS_ORIGIN=https://your-frontend.vercel.app,https://nyayasaathi-final.onrender.com

PORT=5001
NODE_ENV=production
```

## Render Deployment Configuration

### Critical Render Settings

1. **Enable WebSocket Support**
   - Render automatically supports WebSockets for Web Services
   - Ensure you're using a "Web Service" not "Static Site"

2. **Environment Variables in Render Dashboard**
   Set these in your Render service settings:
   ```
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   NODE_ENV=production
   PORT=5001
   ```

3. **Health Check Path**
   Set health check path to: `/api`
   This ensures Render knows your service is running

4. **Start Command**
   ```bash
   npm start
   ```
   Make sure your `package.json` has:
   ```json
   {
     "scripts": {
       "start": "node src/server.js"
     }
   }
   ```

## Testing the Connection

### 1. Test Backend Server
```bash
# Check if server is running
curl https://nyayasaathi-final.onrender.com/api

# Should return:
{
  "success": true,
  "message": "NyayaSaathi API is operational",
  ...
}
```

### 2. Test Socket.IO Endpoint
Open browser console and try:
```javascript
const io = require('socket.io-client');
const socket = io('https://nyayasaathi-final.onrender.com', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => console.log('Connected!'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

### 3. Check Render Logs
In your Render dashboard:
- Go to your web service
- Click "Logs" tab
- Look for:
  - `🔌 Initializing Socket.IO with allowed origins:`
  - `🎉 NYAYASAATHI SERVER STARTED SUCCESSFULLY!`
  - Connection attempts and errors

## Common Issues and Solutions

### Issue: 502 Bad Gateway
**Causes:**
- Server is not running
- Server crashed on startup
- Port binding issues

**Solutions:**
1. Check Render logs for startup errors
2. Verify all environment variables are set
3. Ensure MongoDB connection string is valid
4. Check for missing dependencies in `package.json`

### Issue: CORS Errors
**Solution:**
Update `CORS_ORIGIN` in Render environment variables to include your frontend URL

### Issue: Connection Timeout
**Solution:**
The updated socket configuration now has longer timeout values:
- `pingTimeout: 60000` (60 seconds)
- `pingInterval: 25000` (25 seconds)

### Issue: WebSocket Handshake Failed
**Possible causes:**
1. Wrong URL (should not include `/api`)
2. CORS blocking
3. Firewall/proxy blocking WebSocket

**Solution:**
Verify frontend is connecting to base URL without `/api`:
```javascript
// Correct:
io('https://nyayasaathi-final.onrender.com')

// Wrong:
io('https://nyayasaathi-final.onrender.com/api')
```

## Verification Checklist

- [ ] Backend `.env` has `CORS_ORIGIN` with frontend URL
- [ ] Frontend `.env` has `VITE_API_URL` with `/api` suffix and forward slashes
- [ ] Render service is running (check logs)
- [ ] Render environment variables are set correctly
- [ ] Health check is passing in Render dashboard
- [ ] MongoDB connection is working
- [ ] No CORS errors in browser console

## Next Steps

1. **Deploy the fixes:**
   ```bash
   # In Backend directory
   git add .
   git commit -m "Fix Socket.IO configuration for production"
   git push
   ```
   Render will auto-deploy the changes

2. **Rebuild Frontend:**
   ```bash
   # In Frontend directory
   npm run build
   ```
   Deploy to Vercel/your hosting platform

3. **Monitor Logs:**
   - Watch Render logs for Socket.IO initialization
   - Check browser console for connection status
   - Look for successful "✅ Socket connected" messages

## Still Having Issues?

If the 502 error persists after deploying these fixes:

1. **Check Render Service Status**
   - Is the service running? (green indicator)
   - Are there any recent deploy failures?

2. **Restart the Service**
   - In Render dashboard, click "Manual Deploy" → "Clear build cache & deploy"

3. **Check MongoDB Connection**
   - Verify `MONGODB_URI` is correct in Render environment variables
   - Check if MongoDB Atlas allows connections from Render IPs (allow all IPs: 0.0.0.0/0)

4. **Enable Debug Logging**
   Add to backend startup:
   ```javascript
   console.log('Environment:', {
     PORT: process.env.PORT,
     CORS_ORIGIN: process.env.CORS_ORIGIN,
     NODE_ENV: process.env.NODE_ENV
   });
   ```

## Summary of Changes Made

1. ✅ Fixed socket URL construction to handle various formats
2. ✅ Normalized slashes (backslash → forward slash)
3. ✅ Enhanced Socket.IO server configuration
4. ✅ Added explicit transport modes (websocket + polling)
5. ✅ Increased timeout values for better stability
6. ✅ Created `.env.example` files with proper documentation
7. ✅ Added logging for debugging

The code changes are complete. The 502 error you're seeing is likely a backend deployment issue on Render, not a code issue. Follow the deployment steps above to resolve it.
