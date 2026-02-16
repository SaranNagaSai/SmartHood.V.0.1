# Firebase Setup Guide for SmartHood

To enable push notifications, you need to connect your SmartHood website to a Firebase project.

## 1. Why is there an `appId` for a website?
Firebase treats every client that connects to its backend as an "App".
- **Concept**: A single Firebase Project can support an iOS App, an Android App, and a Website all at once.
- **`appId`**: This unique ID tells Firebase specifically *which* interface (your website) is communicating with it. This allows for platform-specific analytics and configuration.

## 2. Step-by-Step Process to Get Keys

### Step A: Create Project & Get Config
1.  Go to the [Firebase Console](https://console.firebase.google.com/) and log in with your Google account.
2.  Click **Create a project** and name it `SmartHood`.
3.  Once created, you will see a dashboard. Click the **Web Icon (`</>`)** (it looks like code brackets) to register your web app.
4.  Enter a nickname (e.g., "SmartHood Web") and click **Register app**.
5.  **Copy the `firebaseConfig` object** displayed. It will look like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "smarthood.firebaseapp.com",
      projectId: "smarthood",
      storageBucket: "smarthood.appspot.com",
      messagingSenderId: "12345...",
      appId: "1:12345...:web:..."
    };
    ```
    *You will replace the placeholders in `src/services/firebaseConfig.js` and `public/firebase-messaging-sw.js` with these values.*

### Step B: Get VAPID Key (For Web Push)
1.  In your Firebase Project, click the **Gear Icon (Settings)** > **Project settings**.
2.  Go to the **Cloud Messaging** tab.
3.  Scroll down to the **Web configuration** section.
4.  Click **Generate key pair**.
5.  A long string will appear. This is your **VAPID Key**.
    *You will use this in `requestForToken` inside `src/services/firebaseConfig.js`.*

## 3. Where to Paste
1.  **`src/services/firebaseConfig.js`**: Paste the full `firebaseConfig` object and the `vapidKey`.
2.  **`public/firebase-messaging-sw.js`**: Update the `firebaseConfig` variables at the top to match.
