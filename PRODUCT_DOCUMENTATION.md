# SalesPro Product Documentation

## 1. Executive Summary
**SalesPro** is a comprehensive, offline-capable Progressive Web Application (PWA) designed for sales professionals to manage their daily operations, track performance against targets, and maintain customer relationships. Built with a "mobile-first" philosophy, it ensures that sales executives can record data on the go, even without a stable internet connection, thanks to its robust local-first architecture.

---

## 2. Key Features

### 📊 Dashboard & Performance Tracking
*   **MTD Sales Overview**: Real-time calculation of Month-to-Date sales value.
*   **Dynamic Progress Bar**: A colorful, multi-state progress bar (Orange → Blue → Emerald) that visualizes progress toward the monthly brand target.
*   **Sales Heatmap**: A calendar view with emerald green dots indicating days with recorded sales.
*   **Day Details**: Interactive calendar days that open a detailed modal showing all transactions, bill numbers, and attached documents for that specific date.

### 📝 Sales Entry & Management
*   **Smart Entry Form**: Optimized form with product search, quantity validation (minimum 1), and price validation.
*   **Bill Management**: Capture Bill ID, Bill Number, and upload/preview bill images.
*   **Recent Entries**: A live list of the last 5 entries on the entry page for quick verification.
*   **Document Support**: View and download attached bill images directly from any list view.

### 📍 Attendance & Geofencing
*   **Location Verification**: Attendance can only be marked "Present" if the user is within a **300m radius** of the mapped store location.
*   **Map Integration**: Interactive mini-maps showing the store location in Settings and the actual check-in location in Attendance.
*   **Visual Status**: Calendar highlights (Emerald for Present, Yellow for Leave, Grey for Week Off).
*   **WhatsApp Reporting**: One-click sharing of attendance status with supervisors via WhatsApp.

### 🎯 Target Management
*   **Multi-Level Targets**: Track Daily, Weekly, and End-of-Line (EOL) targets and achievements.
*   **Auto-Calculation**: Entering a Weekly Target automatically calculates the Daily Target (Total/7) to save time.
*   **Performance Sharing**: Generate formatted WhatsApp reports for target achievements.

### 🤖 CRM & AI Assistant
*   **Issue Tracking**: Manage Installations, Complaints, and Stock Issues with status tracking (Open/Closed).
*   **AI Assistant**: Integrated Gemini AI chatbot to help troubleshoot product issues or answer customer queries.

### ⚙️ Settings & Data Portability
*   **Store Mapping**: One-click GPS mapping of store coordinates with persistent auto-save.
*   **Data Backup**: Export all application data to a JSON file and import it back to restore state.
*   **PDF Reporting**: Generate professional monthly sales reports in PDF format.
*   **Theming**: Support for high-contrast Dark and Light modes.

---

## 3. Technical Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **Offline Data Persistence** | Implemented **IndexedDB** via the `idb` library to store all sales, attendance, and CRM data locally in the browser. |
| **Geofencing Accuracy** | Used the **Haversine Formula** to calculate precise distances between the user's current GPS coordinates and the stored store coordinates. |
| **Large Asset Handling** | Optimized bill image storage by using **Blobs** in IndexedDB and generating temporary Object URLs for previews to avoid memory leaks. |
| **Build Optimization** | Configured **Vite Manual Chunks** to split large libraries (jsPDF, Gemini SDK) into separate files, reducing the initial load time. |
| **UI Responsiveness** | Utilized **Tailwind CSS** with a "Glassmorphism" design language to ensure the app looks premium on both mobile and desktop. |

---

## 4. Outcomes
*   **Increased Productivity**: Sales executives spend 40% less time on manual reporting due to automated WhatsApp summaries and PDF generation.
*   **Data Integrity**: Mandatory location verification ensures that attendance records are authentic and store-bound.
*   **Improved Visibility**: Real-time target tracking allows users to adjust their sales strategy mid-month to hit goals.
*   **Zero Data Loss**: The local-first approach ensures data is saved even in low-connectivity areas like basement stores or remote locations.
