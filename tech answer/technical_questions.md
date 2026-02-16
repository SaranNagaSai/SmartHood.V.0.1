# Top 15 Technical Questions & Answers - SmartHood Project

## Frontend Architecture

### 1. What is the core technology stack used for the Frontend?
**Answer:**
The frontend is built using **React.js** with **Vite** as the build tool for faster development and optimized production builds. Styling is handled by **Tailwind CSS**, providing a utility-first approach for responsive design. **Firebase** is integrated for specific services (likely notifications or secondary auth features), and **Leaflet/React-Leaflet** is used for map functionalities.

### 2. How is application state managed across the project?
**Answer:**
Global state is managed using **React Context API**. Specifically:
- `AuthContext`: Manages user authentication state (user object, token, login/logout methods).
- `LanguageContext`: Handles application-wide language preferences (English/Telugu).
- `LocationContext` and `NotificationContext`: Manage geospatial data and user alerts respectively.
This usage of Context API avoids prop drilling and keeps the architecture lightweight compared to Redux.

### 3. How does the application handle Authentication on the client side?
**Answer:**
Authentication is handled via the `AuthContext`. On successful login, the server returns a **JWT (JSON Web Token)** and user details. These are stored in the browser's `localStorage` to persist sessions across refreshes. The `AuthProvider` component checks for these tokens on initial load to set the user state automatically.

### 4. How is routing implemented in the application?
**Answer:**
Client-side routing is implemented using **React Router DOM**. The `routes` folder contains route definitions (likely in `AppRoutes.jsx` or specialized route files), ensuring that navigation between pages like Home, Login, and Services happens instantly without full page reloads.

### 5. What is the approach for handling multi-language support (Internationalization)?
**Answer:**
The project uses a custom `LanguageContext` to manage the selected language state. The application is designed to support a "Language-first" experience, where the user's preference (e.g., Telugu or English) is selected at the start and persisted. Text rendering across components likely relies on this context to conditionally display the correct string resources.

---

## Backend Architecture & Modules

### 6. What architectural pattern does the Backend follow?
**Answer:**
The backend is built on **Node.js** and **Express.js**, following the **MVC (Model-View-Controller)** architectural pattern.
- **Models**: Mongoose schemas defining data structure (e.g., `User.js`, `Service.js`).
- **Controllers**: Functions handling business logic (e.g., `authController.js`, `serviceController.js`).
- **Routes**: API endpoint definitions that map URLs to their respective controllers.

### 7. How are independent modules organized in the backend?
**Answer:**
The backend is modularized by functionality. Key modules include:
- **Auth Module**: `authController`, `authRoutes` (Register/Login).
- **Service Module**: `serviceController`, `serviceRoutes` (Service offers/requests).
- **User Module**: `userController`, `userRoutes` (Profile management).
- **Notification Module**: `notificationController` (Alerts and updates).
Each module is self-contained with its own route and controller files, promoting code maintainability.

### 8. Explain the custom Login/Registration logic used.
**Answer:**
The project uses a unique identifier system instead of standard email/password.
- **Registration**: Captures extensive details (Name, Phone, Locality, Profession) and generates a random **Unique ID** (e.g., "ABC12").
- **Login**: Validates strictly using **Name + Phone Number**. There is no password; the combination of name and registered phone acts as the credential. This simplifies access for non-tech-savvy users while maintaining security via phone uniqueness.

### 9. How is the overarching "Service" feature implemented?
**Answer:**
The Service module (`serviceController.js`) handles both "Offers" and "Requests".
- A Service document is created with a `type` ('offer' or 'request') and `targetAudience` ('ALL' or 'SPECIFIC').
- It supports **Hyperlocal Targeting**: The controller logic filters target users based on `locality` and `professionCategory`.
- Notifications are triggered automatically to relevant users upon creation.

### 10. How are Database relations handled in MongoDB?
**Answer:**
Although MongoDB is NoSQL, relationships are maintained using **Mongoose References (`ObjectId`)**.
- A `Service` document references the `User` who created it via the `createdBy` field.
- It also references arrays of Users in `interestedProviders` and the specific User in `completedBy`.
- `data.populate()` is used in controllers to fetch full user details when querying services.

---

## Methods & Technical Specifics

### 11. How does the "Target Specific" logic work in the backend?
**Answer:**
In `serviceController.js`, the `createService` method checks if `targetAudience` is 'SPECIFIC'. If so, it builds a MongoDB query that filters users by **both** `locality` (ensuring hyperlocal scope) and `professionCategory` (e.g., matching 'Plumber' to 'Plumber'). This ensures that service requests are only routed to relevant professionals in the same neighborhood.

### 12. How are file uploads (Attachments) handled?
**Answer:**
File uploads are handled using the **Multer** middleware. In the controller, `req.files` is checked for uploaded documents or images. These files are saved to an `uploads/` directory on the server, and their storage paths are saved in the `attachments` array within the Service document in the database.

### 13. What is the purpose of the `generateUniqueId` method?
**Answer:**
The `generateUniqueId` function (in `authController.js`) ensures every user has a short, readable ID. It combines random characters and numbers (e.g., "XYZ99") and loops to check the database against collisions, guaranteeing that every ID is unique across the system. This ID is used for user identification and service completion verification.

### 14. How is "Interest Expression" handled for Service Requests?
**Answer:**
The `expressInterest` method allows users to signal willingness to help.
- It performs a toggle operation: if the user ID is already in the `interestedProviders` array, it's removed; otherwise, it's added.
- This allows for dynamic updates to the service status without creating separate "Interest" documents, keeping the database schema efficient.

### 15. How does the Completion flow work securely?
**Answer:**
The `completeService` method enforces security by:
1. Verifying that `req.user._id` matches the service's `createdBy` field (only the creator can close it).
2. Requiring the **Unique ID** of the provider. The backend searches for a user with that exact Unique ID.
3. If valid, it updates the service status to 'completed', logs the revenue, and increments the provider's `impactScore`, ensuring a closed loop of trust and verification.
