# Bangladesh e-Apostille Verification System

An official administrative management and public verification suite for documents legalized by the Ministry of Foreign Affairs (MoFA), Government of the People’s Republic of Bangladesh.

This full-stack application utilizes a high-performance **Express API backend** coupled with a responsive **Vite + React frontend**, leveraging a secure **JSON Ledger DB** immune to classic SQL injection vectors, full cryptographic password hashing (`bcrypt`), and session-level protection keys (`JWT`).

---

## 1. System Architecture

```
                                      +------------------+
                                      |   Web Browser    |
                                      +--------+---------+
                                               |
                                     (HTTP / API Requests)
                                               |
                                               v
+----------------------------------------------+-----------------------------------------------+
| SERVER-SIDE APPLICATION CONTAINER (Port 3000)                                                |
|                                                                                              |
|   +--------------------------+     +--------------------------+     +---------------------+  |
|   |  Public Static Router    |     |  Admin Controller (JWT)  |     |  Verification API   |  |
|   |  (Serves Built SPA Assets) |     |  - Certificates CRUD     |     |  - Verification ID  |  |
|   |                          |     |  - System Presets        |     |  - Real-time Check  |  |
|   +------------+-------------+     +------------+-------------+     +----------+----------+  |
|                |                                |                              |             |
|                v                                v                              v             |
|   +---------------------------------------------+------------------------------+----------+  |
|   | Secure Database Ledger File (`/data/db.json`)                                         |  |
|   +---------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------+
```

---

## 2. Database Schema (`/data/db.json`)

The database service implements structured JSON parameters with validation guards to replicate relational constraints without needing native binary SQLite compilation.

### `CertificateRecord` Schema:
```typescript
interface CertificateRecord {
  id: string;                  // Primary Key, Unique Verification ID (e.g., BD-AP-2026-89410)
  applicantName: string;       // Name of Applicant (Enforced Upper-Case)
  fatherName: string;          // Father's Name (Enforced Upper-Case)
  motherName: string;          // Mother's Name (Enforced Upper-Case)
  dob: string;                 // ISO Date String YYYY-MM-DD
  certificateType: string;     // Document Category (e.g., Educational, Birth, Marriage)
  examinationName?: string;    // Exam identifier (for Educational certificates)
  rollNumber?: string;         // Roll Number (for Educational certificates)
  registrationNumber?: string; // Registration (for Educational certificates)
  certificateNumber: string;   // Original document serial code
  boardName?: string;          // Education Board Name (for Educational certificates)
  country: string;             // Destination nation requesting legalization
  issueDate: string;           // Date of e-Apostille authentication (YYYY-MM-DD)
  qrCodeDataUrl?: string;      // Base64 visual representation
  officerName: string;         // Signatory officer
  officerDesignation: string;  // Officer designation
  signatureImageUrl: string;   // PNG transparent base64 image or file URL
  sealImageUrl: string;        // Target stamp transparent base64 image or file URL
  createdDate: string;         // System timestamp
  status: 'VERIFIED' | 'REVOKED'; // Active record status
}
```

---

## 3. Core REST API Endpoints

### 🔐 Public Routes
- **`GET /api/certificates/verify/:id`**: Publicly scans the folder registry. Retrieves the targeted verified model sequence if active.
  * *Request ID Examples:* `BD-AP-2026-89410` (Pre-seeded Demo)
- **`GET /api/auth/verify-token`**: Inspects browser cookies and tokens for session validity.

### 🛡️ Administrative Console Routes (Authorized via headers `'Authorization': 'Bearer <JWT_TOKEN>'`)
- **`POST /api/auth/login`**: Authenticates credentials using hashed compares. Returns authorization token valid for 24h.
- **`GET /api/certificates`**: Returns comprehensive record list. Supports query search parameter `?search=String`.
- **`POST /api/certificates`**: Stores a new certificate. Automatically asserts unique constraints on `Verification ID` values.
- **`PUT /api/certificates/:id`**: Edits targeted certificate details.
- **`DELETE /api/certificates/:id`**: Permenantly revokes and discards requested authorization IDs.
- **`GET /api/settings`** & **`POST /api/settings`**: Edits defaults such as default seal template.

---

## 4. Visual Certificate Generation & Printing

High accuracy design configurations are performed in real-time inside the browser:
- **Rendering engine:** HTML5 Canvas (`src/utils/certificateRenderer.ts`).
- **Resolutions:** Draws 1000px × 1414px vector blocks (A4 standard ratio) matching government green `#006a4e` and gold `#d4af37`.
- **Watermarking:** Automatically sets translucent diagonally-layered safety strings (`VERIFIED BANGLADESH e-APOSTILLE`).
- **PDF exporter:** Compiled inside `jsPDF` using vector compressions preserving 100% legal margins.

---

## 5. Local Setup & Technical Installation Guide

### Prerequisites
- Node.js version 18.0 or newer
- NPM package manager

### Steps:
1. **Clone the repository** and navigate into the folder directory.
2. **Install all bundle components**:
   ```bash
   npm install
   ```
3. **Run in local development mode** (launches Express API proxying Live React on Port 3000):
   ```bash
   npm run dev
   ```
4. **Build for high-speed production releases**:
   ```bash
   npm run build
   ```
5. **Start the production server environment**:
   ```bash
   npm run start
   ```

---

## 6. Cloud Deployment Protocols

The system is configured to bundle both client SPA outputs and server routers inside a lightweight CommonJS packet in `/dist/server.cjs` via `esbuild`.

### Deploying to Google Cloud Run (Containerized)
Configure your deployment target or pipeline tool targeting Port 3000:
```bash
# 1. Build the production image locally or via cloud builds
gcloud builds submit --tag gcr.io/my-project/bd-eapostille

# 2. Deploy the container service
gcloud run deploy bd-eapostille \
  --image gcr.io/my-project/bd-eapostille \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=super-secret-key-goes-here"
```

---

*Issued under Hague Apostille Legalizations, Consular Registry, Dhaka, Bangladesh.*
