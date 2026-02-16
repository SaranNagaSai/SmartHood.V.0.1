# Project Work Division Plan for SmartHood

This document outlines the division of work for the SmartHood project among four team members. The distribution ensures that each member owns a unique aspect of the project, with roles tailored to varying levels of technical confidence.

## 👥 Team Structure Overview

| Role | Focus Area | Technical Difficulty |
|------|------------|----------------------|
| **Member 1 (Back-End Lead)** | Server, Database, Security, APIs | ⭐⭐⭐⭐⭐ (High) |
| **Member 2 (Front-End Lead)** | Logic, Integrations, Maps, Real-time | ⭐⭐⭐⭐⭐ (High) |
| **Member 3 (UI/UX Developer)** | Interface Design, Pages, Styling | ⭐⭐⭐⭐ (Medium) |
| **Member 4 (QA & Content)** | Testing, Documentation, Static Content | ⭐⭐ (Low/Entry) |

---

## 🛠️ Detailed Responsibilities

### 1. Member 1: Back-End Lead & System Architect
**Objective:** Ensure the server is robust, secure, and the database is structured correctly.
*   **Core Responsibilities:**
    *   **Server Logic:** Managing `server.js` and all `controller` logic (Auth, Users, Requests).
    *   **Database:** Designing and maintaining MongoDB Schemas in `server/models`.
    *   **Security:** Implementing JWT Authentication, Password Hashing, and Middleware (`server/middleware`).
    *   **API Management:** Defining REST API routes in `server/routes`.
*   **Key Files/Folders:**
    *   `server/controllers/*`
    *   `server/models/*`
    *   `server/routes/*`
    *   `server/middleware/*`

### 2. Member 2: Front-End Lead & Integration Specialist
**Objective:** Handle complex frontend logic, third-party integrations, and state management.
*   **Core Responsibilities:**
    *   **Map Integration:** Implementing the interactive Leaflet map in `ExploreCity.jsx`.
    *   **State Management:** Managing global state using React Context (`frontend/src/context`).
    *   **API Connection:** Writing the service layer to connect Frontend to Backend (`frontend/src/services`).
    *   **Real-time Features:** Implementing Socket.io for notifications or chat if applicable.
*   **Key Files/Folders:**
    *   `frontend/src/pages/ExploreCity.jsx`
    *   `frontend/src/context/*`
    *   `frontend/src/services/*`
    *   `frontend/src/hooks/*`

### 3. Member 3: UI/UX Developer
**Objective:** Build a beautiful, responsive, and consistent user interface.
*   **Core Responsibilities:**
    *   **Page Layouts:** Building the core pages like Home, Profile, Login, and Dashboard.
    *   **Components:** Creating reusable UI components (Cards, Buttons, Modals) in `frontend/src/components`.
    *   **Styling:** Maintaining the globall `index.css` or Tailwind configs to ensure a "Premium" look.
    *   **Responsive Design:** Ensuring the site looks good on Mobile and Desktop.
*   **Key Files/Folders:**
    *   `frontend/src/pages/Home.jsx`
    *   `frontend/src/pages/Profile.jsx`
    *   `frontend/src/components/*`
    *   `frontend/src/index.css`

### 4. Member 4: Quality Assurance (QA) & Content Manager (Less Technical Focus)
**Objective:** Ensure the project is bug-free, well-documented, and user-friendly.
*   **Core Responsibilities:**
    *   **Manual Testing (QA):** Clicking through every feature, verifying links, and reporting bugs to Members 1, 2, or 3.
    *   **Content Management:** updating text, images, and static information on pages like "About Us", "Contact", "Terms", and "Privacy Policy".
    *   **Localization (i18n):** Managing the translation files (JSON) if the app supports multiple languages.
    *   **Documentation:** Creating the "Project Report", "User Manual", or answering the "Technical Questions" document.
*   **Key Files/Folders:**
    *   `frontend/src/pages/About.jsx`
    *   `frontend/src/pages/Terms.jsx` (and other static pages)
    *   `frontend/src/i18n/*` (Language JSON files)
    *   `tech answer/technical_questions.txt` (Maintenance)
    *   **Task:** Running the app and verifying "Does this button work?"

---

## 🚀 Workflow Recommendation

1.  **Member 1** creates the API.
2.  **Member 2** connects the API to the generic logic.
3.  **Member 3** styles the data presentation.
4.  **Member 4** verifies it works and writes the manual.
