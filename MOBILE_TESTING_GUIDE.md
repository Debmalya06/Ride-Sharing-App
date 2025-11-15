# 📱 Mobile Testing Guide - SmartRide Development

## Quick Start - Access Your React Project on Mobile

### Your Development Server Details:
- **Desktop IP Address**: `10.208.74.77`
- **Frontend Port**: `5173`
- **Backend Port**: `8080`
- **Frontend URL**: `http://10.208.74.77:5173`
- **Backend API URL**: `http://10.208.74.77:8080/api`

---

## Step 1: Ensure Both Devices are on Same WiFi Network ✅

Your mobile device and desktop must be connected to the same WiFi network.

---

## Step 2: Update API Service Configuration 🔧

If needed, update your API base URL in `client/src/services/api.js`:

```javascript
// For testing on mobile, make sure backend URL is accessible
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://10.208.74.77:8080/api'
```

---

## Step 3: Start Development Server 🚀

### Option A: Using npm (Recommended)
```powershell
cd client
npm run dev
```

### Option B: Using Vite directly
```powershell
npm run dev -- --host 0.0.0.0
```

---

## Step 4: Access on Mobile Browser 📲

### On Your Mobile Device:

1. **Open Mobile Browser** (Chrome, Safari, Firefox, etc.)

2. **Navigate to**:
   ```
   http://10.208.74.77:5173
   ```

3. **Done!** 🎉 Your React app should load on mobile

---

## Step 5: Backend Access on Mobile 🔗

If your mobile app needs to call the backend API:

1. **Make sure Backend is Running**:
   ```powershell
   # In Ride-Sharing directory
   ./mvnw spring-boot:run
   ```

2. **Backend will be accessible at**:
   ```
   http://10.208.74.77:8080/api
   ```

3. **Your API calls should work seamlessly**

---

## Troubleshooting 🔧

### Issue: Cannot connect from mobile
**Solution**: 
- [ ] Check both devices are on same WiFi
- [ ] Check Windows Firewall is not blocking port 5173
- [ ] Try pinging from mobile: `ping 10.208.74.77`
- [ ] Restart development server

### Issue: Firewall blocking connection
**Solution**: Allow port 5173 through Windows Firewall:
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=tcp localport=5173
```

### Issue: Mobile shows "Cannot reach server"
**Solution**:
- Verify backend is running on port 8080
- Check API URL in your code points to `http://10.208.74.77:8080/api`
- Clear browser cache on mobile (Ctrl+Shift+Delete)

---

## Testing Checklist ✅

- [ ] Frontend loads on mobile browser
- [ ] Login/Registration works
- [ ] Dashboard displays correctly
- [ ] API calls work (check Network tab in DevTools)
- [ ] Images load properly
- [ ] Forms submit successfully
- [ ] Navigation works smoothly

---

## Advanced: Enable DevTools on Mobile 🛠️

### For Chrome Mobile:
1. Connect mobile to USB on desktop
2. Open Chrome: `chrome://inspect`
3. Enable USB debugging on mobile
4. Debug remotely!

---

## Notes 📝

- **Host**: `0.0.0.0` means accessible from all network interfaces
- **Port 5173**: Default Vite port (change in vite.config.js if needed)
- **HMR (Hot Module Replacement)**: Works on mobile, changes reflect in real-time
- **Backend**: Ensure Spring Boot is running on 8080

---

## Quick Reference Commands 🚀

```powershell
# Start React Dev Server
cd client
npm run dev

# Start Backend (from Ride-Sharing directory)
./mvnw spring-boot:run

# Check if ports are open
netstat -ano | findstr :5173
netstat -ano | findstr :8080

# Kill process on port (if needed)
taskkill /PID <PID> /F
```

---

## Your IP Addresses 🌐

| Device | IP Address | Port | URL |
|--------|-----------|------|-----|
| Desktop | 10.208.74.77 | 5173 | http://10.208.74.77:5173 |
| Desktop Backend | 10.208.74.77 | 8080 | http://10.208.74.77:8080 |
| Mobile | Same Network | - | http://10.208.74.77:5173 |

---

Happy Testing! 🎉
