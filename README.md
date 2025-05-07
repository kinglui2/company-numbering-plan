# Numbering Plan Management System

This is a **Numbering Plan Management System** built with the **MERN stack** and **MySQL** database to replace the manual Excel-based workflow used for managing SIP trunk/DID phone numbers.

## 📌 Objective

The goal of this system is to digitize and streamline the management of phone numbers (DIDs) ranging from `0207900000` to `0207909999` (full format: `+254207900000` to `+254207909999`). The system allows tracking the state of each number — whether **assigned**, **unassigned**, or in a **cool-off** period — while retaining critical assignment history and gateway details.

## ✅ Key Features

- Full phone number breakdown:
  - **National Code:** 254
  - **Area Code:** 20
  - **Network Code:** 790
  - **Subscriber Number:** Last 4 digits
- Tracks **golden numbers**
- Tracks status: `assigned`, `unassigned`, `cooloff`
- Records assignment details:
  - Subscriber name
  - Company name
  - Gateway assigned to (`cs01` or `ls02`)
  - Username on gateway
  - Assignment date (automatically captured by the system)
- Maintains unassignment data:
  - Unassigned date
  - 90-day cooldown before number can be reassigned
  - Previous company & previous assignment notes
- Secure update interface for internal users (no new number creation via UI)
- Designed to support **data import from an existing Excel sheet**

## 🛠️ Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **ORM:** Prisma (or Sequelize) [optional]
- **Deployment Ready:** Designed for remote server setup

## 📂 Folder Structure (Proposed)

```
project-root/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── vite.config.js
│
├── database/
│   └── schema.sql       # MySQL schema file
│
└── README.md
```

## ⚙️ Usage Workflow

1. **Initial Data Import**  
   - Existing number data from Excel is prefilled into the MySQL database.
   - No direct number creation via the UI.

2. **Web Interface Interaction**
   - View, assign, and unassign numbers.
   - Track gateway assignments and subscriber history.
   - Ensure unassigned numbers follow a 90-day cooldown before reuse.

3. **Golden Numbers**
   - Tracked separately via a boolean flag (`is_golden`).
   - No manual marking needed once loaded from the source file.

## 🔒 User Access & Data Integrity

- Assignment date is automatically recorded by the system.
- Certain fields are optional on import but required during system assignment.
- Number creation is restricted — only existing imported numbers can be updated.
- Business logic like 90-day hold on reused numbers is enforced in the backend.

## 📈 Future Enhancements

- Role-based access control (Admin, Viewer)
- Import and export functionality for CSV/Excel
- Audit logs for all changes made via the app

---

> This system is designed to improve operational efficiency, reduce manual errors, and provide a reliable structure for DID management within telecom environments.
