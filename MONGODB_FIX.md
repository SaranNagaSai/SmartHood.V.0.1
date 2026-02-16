# 🔧 MongoDB Connection Timeout - Troubleshooting Guide

## ❌ Current Error:
```
Operation `users.findOne()` buffering timed out after 10000ms
```

This means your Render backend **cannot connect to MongoDB Atlas**.

---

## ✅ SOLUTION - 3 Steps to Fix

### **Step 1: Whitelist Render IPs in MongoDB Atlas**

1. **Go to MongoDB Atlas Dashboard**: https://cloud.mongodb.com/
2. **Select your Cluster** → Click "Network Access" (left sidebar)
3. **Click "Add IP Address"**
4. **Choose ONE of these options:**

   **Option A: Allow from Anywhere (Easiest - Recommended for testing)**
   ```
   IP Address: 0.0.0.0/0
   Comment: Allow all IPs
   ```
   
   **Option B: Add Specific Render IPs (More secure)**
   - Render doesn't have fixed IPs, so use 0.0.0.0/0
   - Or enable **"Connect from anywhere"**

5. **Click "Confirm"**
6. **Wait 1-2 minutes** for changes to propagate

---

### **Step 2: Verify MongoDB Connection String**

Your current connection string format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?appName=Cluster0
```

**Required format for production:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smarthood?retryWrites=true&w=majority
```

**Key changes:**
- Add database name: `/smarthood` (after `.net/`)
- Add connection options: `?retryWrites=true&w=majority`

---

### **Step 3: Update Render Environment Variables**

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Select "smarthood-backend" service**
3. **Click "Environment" tab**
4. **Find `MONGODB_URI` variable**
5. **Update to correct format:**

```
mongodb+srv://sarannagasait_db_user:YOUR_PASSWORD@cluster0.ak4hxrn.mongodb.net/smarthood?retryWrites=true&w=majority
```

**Replace:**
- `YOUR_PASSWORD` with actual password (use the one from your .env file)
- Keep the rest the same

6. **Click "Save Changes"**
7. **Render will auto-redeploy** (wait 2-3 minutes)

---

## 📋 Quick Checklist

- [ ] MongoDB Atlas Network Access set to `0.0.0.0/0`
- [ ] Connection string includes database name `/smarthood`
- [ ] Connection string includes `?retryWrites=true&w=majority`
- [ ] Password has no special characters (or is URL-encoded)
- [ ] Render environment variables updated
- [ ] Waited 2-3 minutes for deployment

---

## 🔍 Verify Connection String Format

**Your current string from .env:**
```
mongodb+srv://sarannagasait_db_user:TnFwd15pWGZmI4XE@cluster0.ak4hxrn.mongodb.net/?appName=Cluster0
```

**Should be:**
```
mongodb+srv://sarannagasait_db_user:TnFwd15pWGZmI4XE@cluster0.ak4hxrn.mongodb.net/smarthood?retryWrites=true&w=majority&appName=Cluster0
```

---

## 🚨 Special Characters in Password

If your password contains special characters like `@`, `#`, `%`, etc., you need to URL-encode them:

| Character | Encoded |
|-----------|---------|
| @ | %40 |
| # | %23 |
| $ | %24 |
| % | %25 |
| ^ | %5E |
| & | %26 |

**Example:**
- Password: `Pass@123!`
- Encoded: `Pass%40123%21`

---

## ✅ After Making Changes

1. **Save environment variables** in Render
2. **Wait for auto-redeploy** (2-3 minutes)
3. **Check Render logs** for "Connected to MongoDB"
4. **Try registering** again
5. **Should work!** 🎉

---

## 📞 Still Having Issues?

Check Render logs:
1. Render Dashboard → Your Service
2. Click "Logs" tab
3. Look for connection errors
4. Share the error message

Common errors:
- `Authentication failed` → Wrong password
- `Network timeout` → IP not whitelisted
- `ENOTFOUND` → Wrong cluster URL
