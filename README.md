# Shiprocket — Vendor Onboarding

A vendor registration portal that auto-fills GST, MSME, e-invoicing, and Udyam
details from a single PAN entry, and stores submissions to a JSON file with
attachments on disk.

```
vendor_onboarding/
├── backend/                     FastAPI service
│   ├── app.py                   API endpoints + JSON storage
│   ├── data/vendors.json        Stored submissions (acts as DB for now)
│   └── uploads/<vendor_id>/     Uploaded scans
└── frontend/                    React + Vite + Tailwind
    └── src/
        ├── App.jsx
        ├── components/VendorForm.jsx     Main form
        ├── components/Section.jsx        Section card
        ├── components/SectionNav.jsx     Sticky left nav + progress
        ├── components/Field.jsx          Inputs (Field, Select, YesNo, FileField, Textarea)
        ├── components/SuccessScreen.jsx
        ├── lib/api.js
        └── lib/validators.js
```

## Setup

### 1. Backend (Python 3.9+)

```bash
cd backend
pip3 install -r requirements.txt
cp .env.example .env        # then edit .env (defaults work)
```

Run:
```bash
python3 -m uvicorn app:app --reload --port 8000
```

### 2. Frontend (Node 18+)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` and `/uploads` to the backend.

## Bank document

The vendor uploads a single bank document showing the company name —
this can be a cancelled cheque, a bank statement, a passbook front page,
or a bank letter on the bank's letterhead. No OCR / verification is
performed; the file is stored as-is alongside the rest of the submission.

## API reference

| Method | Path                       | Body                                             |
|-------:|----------------------------|--------------------------------------------------|
| POST   | `/api/vendors`             | multipart: `payload` (JSON), `pan_file`, `gst_file`, `msme_file`, `bank_document_file`, `registration_file`, `signed_vrf_file` |
| GET    | `/api/vendors`             | —                                                |
| GET    | `/api/vendors/{id}`        | —                                                |
| GET    | `/uploads/<id>/<file>`     | static file serving                              |
| GET    | `/healthz`                 | —                                                |

Auto-generated docs at http://localhost:8000/docs.

## Validation rules

| Field          | Rule                                              |
|----------------|---------------------------------------------------|
| PAN            | `^[A-Z]{5}[0-9]{4}[A-Z]$`                         |
| GSTIN          | `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$`|
| IFSC           | `^[A-Z]{4}0[A-Z0-9]{6}$`                          |
| Mobile         | 10 digits, starts 6/7/8/9                         |
| Postal code    | 6 digits, doesn't start with 0                    |

## Storage format

Each submission appended to `backend/data/vendors.json`:

```json
{
  "id": "f59c15651ef1",
  "submitted_at": "2026-04-29T13:53:40+00:00",
  "data": { ...all form fields... },
  "files": {
    "pan":           "uploads/f59c15651ef1/pan__scan.png",
    "gst":           "uploads/f59c15651ef1/gst__cert.pdf",
    "msme":          "uploads/f59c15651ef1/msme__udyam.pdf",
    "bank_document": "uploads/f59c15651ef1/bank_document__statement.pdf",
    "registration":  "uploads/f59c15651ef1/registration__coi.pdf",
    "signed_vrf":    "uploads/f59c15651ef1/signed_vrf__vrf.pdf"
  }
}
```

Migration to MongoDB later is straightforward — the record shape maps directly
to a Mongo document; files can move to GridFS or S3, and `files.<key>` keeps
the same string contract.
