# ANVESHA — Inter PU Sports & Cultural Fest Management System
### Christ University, Bengaluru

ANVESHA is an enterprise-grade, centralized event management platform designed and developed for Christ University's flagship Inter Pre-University Sports and Cultural Fest.

---

## 🏛️ System Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (Christ University Brand Palette), Lucide Icons, Recharts.
- **Backend**: Node.js, Express.js REST API server with JWT Authentication and Role-Based Access Control (RBAC).
- **Database**: Google Sheets as a Database via Google Apps Script (GAS) Web App Endpoint with built-in instant local JSON fallback storage.

---

## 🎨 Design Identity & Rules
- **Theme**: STRICT Light Theme (No Dark Mode toggle) adhering to Christ University visual standards (Deep Navy Blue `#002147`, Gold `#C5A059`, Crisp Slate Whites `#F8FAFC`).
- **Typography**: Clean hierarchy with Merriweather serif headings and Inter sans-serif body.

---

## ⚡ Enforced Business Rules

1. **Rule 1 (Max 2 Teams per Event)**: Each PU Institution can register at most TWO teams (`Team A` and `Team B`) per event.
2. **Rule 2 (One Participant = One Event)**: A student can participate in **ONLY ONE EVENT**. Cross-event submissions are automatically blocked on Name + DOB + Govt ID.
3. **Rule 3 (Duplicate Protection)**: Prevents duplicate participant registrations across institutions.
4. **Event Day Chest Numbers**: Automatic chest number assignment upon Registration Team approval (e.g., `FB-101`, `DN-201`).
5. **Real-Time Data Sync**: Verified participants propagate instantly to Hospitality, Event Faculty, and Certificate modules.
6. **Score Sheet Locking & Edit Approval**: Event Faculty submitting final results locks the sheet. Changes require Admin approval of a formal Edit Request with justification.

---

## 👥 Crew Roles & Dashboard Access

| Role | Access URL | Features |
|---|---|---|
| **Chief Admin** | `/dashboard/admin` | System overview, edit request approvals, user creation, audit logs |
| **Registration Team** | `/dashboard/verification` | Student ID verification, payment check, chest number auto-assignment |
| **Hospitality Team** | `/dashboard/hospitality` | Delegation arrival check-in, room assignment, food preferences |
| **Event Faculty** | `/dashboard/event/:eventId` | Event-isolated fixtures, live score entry, result submission & locking |
| **Certificate Desk** | `/dashboard/certificates` | Live certificate preview, single & bulk PDF/ZIP generator |
| **University Officials** | `/dashboard/reports` | Executive view-only analytical graphs (district, category, revenue) |

---

## 🚀 Quick Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server (Frontend + Express Backend)
```bash
npm run start
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 📊 Google Apps Script Deployment (Google Sheets Database)

1. Open a new Google Sheet.
2. Go to **Extensions -> Apps Script**.
3. Paste the contents of `gas/Code.gs` and `gas/appsscript.json`.
4. Click **Deploy -> New deployment**.
5. Select type: **Web app**, Execute as: **Me**, Who has access: **Anyone**.
6. Copy the generated Web App URL and add it to your `.env` file:
```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

---

© 2026 Christ University, Bengaluru. ANVESHA Inter PU Fest Secretariat.
