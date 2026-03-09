# Extended SmartHood Detailed Data Flow Diagram

This document contains a high-granularity version of the SmartHood workflow, following the linear "box format" requested, but expanding on every technical subsystem.

## Detailed Functional Workflow

```mermaid
graph TD
    %% Start
    Start[User Interaction Trigger <br/> (Dashboard / Action Button)] --> State[1. Context Initialization <br/> (Check Auth State & Language Pref)]
    
    %% Geospatial Layer
    State --> Geo[2. Geospatial Acquisition <br/> (Browser Geolocation API - Lat/Long)]
    Geo --> Norm[3. Local State Normalization <br/> (Coordinate Rounding & Region Clustering)]
    
    %% Security Layer
    Norm --> Security[4. Security Handshake <br/> (JWT Signature Verification & RBAC Check)]
    Security --> Payload[5. Metadata Assembly <br/> (Category: Emergency / Grievance / Service)]
    
    %% Media Layer
    Payload --> Media[6. Cloud Media Offloading <br/> (Async Stream to Cloudinary API)]
    Media --> API[7. API Request Routing <br/> (Node.js/Express Controller Triage)]
    
    %% Data Layer
    API --> DB[8. Geospatial Querying <br/> (MongoDB $near / $geoWithin Indexing)]
    DB --> Match[9. Heuristic Matching Logic <br/> (Is localized resource available?)]
    
    %% Decision Node
    Match --> Decision{Incident Severity}

    %% Branch A: Standard Service
    Decision -- "Standard Service" --> Marketplace[10A. Marketplace Sync <br/> (Non-Critical UI Update)]
    Marketplace --> UI1[11A. Dashboard Refresh <br/> (Update Local Markers)]

    %% Branch B: Critical Alert
    Decision -- "Emergency Alert" --> Alert["[10B. Notification Orchestration <br/> (Firebase FCM + SMTP Dispatch)]"]
    Alert --> Broadcast[11B. Neighborhood Broadcast <br/> (Push Alert to Geo-fenced Users)]
    Broadcast --> Admin[12B. Administrative Triage <br/> (Wait for Approval / Action)]
    
    %% Close loop
    UI1 --> Final[Transaction Logged to Cloud Database]
    Admin --> Final

    %% Styling
    style Alert fill:#ff9999,stroke:#333,stroke-width:2px
    style Broadcast fill:#ff9999,stroke:#333,stroke-width:2px
    style Marketplace fill:#ccffcc,stroke:#333,stroke-width:2px
    style Security fill:#ffffcc,stroke:#333,stroke-width:2px
```

---

### Process Detail Breakdown

| Box ID | Process Name | Technical Implementation |
| :--- | :--- | :--- |
| **1-3** | **Input & Geo-Data** | Uses React Context for state and the Browser Navigator API for real-time coordinates. |
| **4** | **Security Handshake** | Backend middleware checks for valid `Bearer` tokens and user permissions. |
| **6** | **Cloud Offloading** | Media files are streamed to Cloudinary to keep the MongoDB document size lean. |
| **8-9** | **Geospatial Logic** | Queries the database using Spherical Geometry to find data within 1-5km radius. |
| **10B** | **Notification Sync** | Orchestrates dual-delivery: Real-time for neighbors (Firebase) and record-keeping for Admins (Email). |
| **11-12** | **Dashboard Sync** | Triggers a UI re-render on all connected devices in the locality to show New Markers. |
