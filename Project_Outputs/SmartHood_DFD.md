# SmartHood Data Flow Diagram (DFD) Documentation

This document provides a detailed breakdown of the Data Flow Diagram for the **SmartHood Hyper-local Community Platform**, adapted to the specific visual logic of automated incident processing.

## 1. Visual Workflow Diagram (Detailed DFD)

Following the structure of automated monitoring systems, this diagram represents the flow of a community report or emergency alert through the SmartHood ecosystem.

```mermaid
graph TD
    Input[Resident / Professional Input] --> Preprocess[Geospatial Preprocessing <br/> (Coordinate Capture & Media Normalization)]
    Preprocess --> Auth[Identity & Data Validation <br/> (JWT / Mongoose Schema Validation)]
    Auth --> Match[Service Matching & Incident Filter <br/> (MongoDB Geospatial Indexing)]
    
    Match --> Decision{Process Type}

    Decision -- "Verified Service" --> Known[Verified Service Listing]
    Decision -- "Emergency Incident" --> Unknown[Emergency / Unknown Incident]

    Known --> Alert1[Update Marketplace <br/> & Sync Dashboard]
    
    Unknown --> Alert2["[Send Multi-Channel Alert <br/> (FCM / SMTP Email)]"]
    Alert2 --> Wait["Wait for Admin / Neighbor <br/> Response & Oversight"]
    Wait --> Resolve[Resolve Incident if <br/> Approved / Actioned]

    style Alert2 fill:#f9f,stroke:#333,stroke-width:2px
    style Alert1 fill:#ccf,stroke:#333,stroke-width:2px
```

---

## 2. DFD Level 0: Context Diagram

The Context Diagram provides a high-level view of the entire SmartHood system and its interaction with external entities.

```mermaid
graph TD
    User["Residents / Professionals"] 
    Admin["City Administrator"]
    System(("SmartHood Platform"))
    Firebase["Firebase FCM"]
    Cloudinary["Cloudinary Storage"]
    Email["SMTP Server"]

    %% Flow to System
    User -- "Register/Login, File Grievances, Trigger Alerts" --> System
    Admin -- "Moderate Reports, View Analytics" --> System

    %% Flow from System
    System -- "Auth Tokens, Map Data, Dashboard Updates" --> User
    System -- "System Logs, Growth Trends" --> Admin
    System -- "Push Notification Payload" --> Firebase
    System -- "Image Uploads" --> Cloudinary
    System -- "Emergency Alert Emails" --> Email
```

---

## 3. DFD Level 1: Functional Overview

The Level 1 DFD breaks down the system into its primary functional processes.

```mermaid
graph TB
    subgraph "External Entities"
        U[Resident/Professional]
        A[Administrator]
    end

    subgraph "Main Processes"
        P1((1.0 User Auth & Profile Management))
        P2((2.0 Geospatial Mapping & Search))
        P3((3.0 Grievance & Emergency Processing))
        P4((4.0 Service Marketplace Exchange))
        P5((5.0 Notification & Alert Dispatch))
        P6((6.0 Admin Analytics & Moderation))
    end

    subgraph "Data Stores (MongoDB Atlas)"
        DS1[("User Profiles / JWT")]
        DS2[("Locality & Map Data")]
        DS3[("Incidents & Complaints")]
        DS4[("Service Marketplace")]
    end

    subgraph "External Systems"
        EX1["Firebase FCM"]
        EX2["Cloudinary API"]
        EX3["SMTP (Nodemailer)"]
    end

    %% Process 1 logic
    U -->|Credentials| P1
    P1 <-->|Read/Write| DS1
    P1 -->|Auth Token| U

    %% Process 2 logic
    U -->|Coordinates / Queries| P2
    P2 <-->|Fetch Filters| DS2
    P2 -->|Interactive Map Data| U

    %% Process 3 logic
    U -->|Incident Data / Emergency| P3
    P3 -->|Store Metadata| DS3
    P3 -->|Upload Image| EX2
    P3 -->|Trigger Signal| P5

    %% Process 4 logic
    U -->|Offer/Request Service| P4
    P4 <-->|Sync Listings| DS4
    P4 -->|Match Results| U

    %% Process 5 logic
    P5 -->|Push Notify| EX1
    P5 -->|Alert Email| EX3
    EX1 -->|Real-time Alert| U
    EX3 -->|Admin Alert| A

    %% Process 6 logic
    P6 <-->|Analyze System Data| DS1
    P6 <-->|Analyze Incidents| DS3
    P6 -->|Dashboard Insights| A
    A -->|Moderate Action| P6
```
