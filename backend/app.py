"""Vendor Onboarding API.

Endpoints:
  POST /api/vendors             multipart: payload (JSON) + files → store vendor
  GET  /api/vendors                                            → list vendors
  GET  /api/vendors/{id}                                       → fetch one
  GET  /healthz                                                → ping

Storage:
  - Vendor records appended to data/vendors.json (file-locked).
  - Files saved under uploads/<vendor_id>/<field>__<original_name>.
"""
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

ROOT = Path(__file__).parent
DATA_FILE = ROOT / "data" / "vendors.json"
UPLOADS_DIR = ROOT / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
DECLARATIONS_DIR = ROOT / "declarations"

# ---------------------------------------------------------------- file lock --
try:
    import fcntl

    def _flock(f, exclusive: bool = True):
        fcntl.flock(f.fileno(), fcntl.LOCK_EX if exclusive else fcntl.LOCK_SH)

    def _funlock(f):
        fcntl.flock(f.fileno(), fcntl.LOCK_UN)
except ImportError:  # pragma: no cover — windows fallback
    def _flock(f, exclusive: bool = True): ...
    def _funlock(f): ...


def _read_vendors() -> list[dict[str, Any]]:
    if not DATA_FILE.exists():
        return []
    with DATA_FILE.open("r") as f:
        _flock(f, exclusive=False)
        try:
            return json.load(f) or []
        finally:
            _funlock(f)


def _write_vendors(vendors: list[dict[str, Any]]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w") as f:
        _flock(f, exclusive=True)
        try:
            json.dump(vendors, f, indent=2, default=str)
        finally:
            _funlock(f)


# ---------------------------------------------------------------- validators -
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$")
MOBILE_RE = re.compile(r"^[6-9][0-9]{9}$")
PIN_RE = re.compile(r"^[1-9][0-9]{5}$")


def _safe_filename(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name[:120] or "file"


# ------------------------------------------------------------------- schemas -
class VendorPayload(BaseModel):
    # Company
    vendor_name: str
    description: Optional[str] = None
    brand_name: Optional[str] = None
    poc_name: str
    poc_phone: str
    poc_email: str
    address_line: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: str
    country: str
    postal_code: str
    telephone: Optional[str] = None
    fax: Optional[str] = None
    mobile: str
    accounts_email: str
    tax_email: Optional[str] = None

    # Tax & registration
    pan: str
    aadhaar_linked_with_pan: bool
    gstin: Optional[str] = None
    e_invoicing_applicable: bool
    cin: Optional[str] = None
    entity_type: str
    is_proprietor: bool = False
    proprietor_first_name: Optional[str] = None
    proprietor_last_name: Optional[str] = None
    itr_filed_last_2_years: bool
    itr_ack_year_minus_1: Optional[str] = None
    itr_ack_year_minus_2: Optional[str] = None

    # MSME
    msme_registered: bool
    udyam_number: Optional[str] = None
    msme_type: Optional[str] = None

    # Declarations (true only when user ticked the corresponding checkbox)
    non_gst_declaration_accepted: bool = False
    non_msme_declaration_accepted: bool = False

    # Bank
    account_holder_name: str
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_street: Optional[str] = None
    bank_city: Optional[str] = None
    account_number: str
    ifsc_code: str
    swift_code: Optional[str] = None

    # Signatory
    authorised_signatory: Optional[str] = None


def _validate_payload(p: VendorPayload) -> list[str]:
    errs: list[str] = []
    if not PAN_RE.match(p.pan.upper()):
        errs.append("PAN format invalid")
    if p.gstin:
        gstin_up = p.gstin.upper()
        pan_up = p.pan.upper()
        if not GSTIN_RE.match(gstin_up):
            errs.append("GSTIN format invalid")
        elif pan_up not in gstin_up:
            errs.append(
                f"GSTIN must contain PAN ({pan_up})"
            )
    if not IFSC_RE.match(p.ifsc_code.upper()):
        errs.append("IFSC code format invalid (should look like SBIN0123456)")
    if not MOBILE_RE.match(p.mobile):
        errs.append("Mobile must be a 10-digit Indian number starting 6/7/8/9")
    if not MOBILE_RE.match(p.poc_phone):
        errs.append("POC phone must be a 10-digit Indian number starting 6/7/8/9")
    if not PIN_RE.match(p.postal_code):
        errs.append("Postal code must be 6 digits")
    if "@" not in p.accounts_email:
        errs.append("Accounts email looks invalid")
    if "@" not in p.poc_email:
        errs.append("POC email looks invalid")
    if p.itr_filed_last_2_years:
        if not p.itr_ack_year_minus_1 or not p.itr_ack_year_minus_2:
            errs.append("ITR acknowledgement numbers required for both years")
    if p.is_proprietor:
        if not p.proprietor_first_name:
            errs.append("First name required when type is proprietor")
        if not p.proprietor_last_name:
            errs.append("Last name required when type is proprietor")
    if p.msme_registered and not p.udyam_number:
        errs.append("Udyam number required when MSME registered")
    if p.msme_registered and p.msme_type not in ("Micro", "Small", "Medium"):
        errs.append("MSME type must be Micro, Small, or Medium when MSME registered")
    # Declarations are required when the corresponding registration is absent
    if not p.gstin and not p.non_gst_declaration_accepted:
        errs.append("NON-GST declaration must be accepted when GST is not registered")
    if not p.msme_registered and not p.non_msme_declaration_accepted:
        errs.append("NON-MSME declaration must be accepted when not MSME-registered")
    return errs


# ---------------------------------------------------------------------- app --
app = FastAPI(title="Shiprocket Vendor Onboarding API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"), "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
if DECLARATIONS_DIR.exists():
    app.mount(
        "/declarations",
        StaticFiles(directory=str(DECLARATIONS_DIR)),
        name="declarations",
    )


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/vendors")
async def submit_vendor(
    payload: str = Form(...),
    pan_file: Optional[UploadFile] = File(None),
    gst_file: Optional[UploadFile] = File(None),
    msme_file: Optional[UploadFile] = File(None),
    bank_document_file: Optional[UploadFile] = File(None),
    registration_file: Optional[UploadFile] = File(None),
    signed_vrf_file: Optional[UploadFile] = File(None),
) -> JSONResponse:
    try:
        data = json.loads(payload)
        vendor = VendorPayload(**data)
    except Exception as e:
        raise HTTPException(400, f"Bad payload: {e}")

    errs = _validate_payload(vendor)

    if not bank_document_file:
        errs.append("Bank document (showing company name) is required")

    if errs:
        raise HTTPException(422, {"errors": errs})

    vendor_id = uuid.uuid4().hex[:12]
    vdir = UPLOADS_DIR / vendor_id
    vdir.mkdir(parents=True, exist_ok=True)

    file_paths: dict[str, str] = {}
    files = {
        "pan": pan_file,
        "gst": gst_file,
        "msme": msme_file,
        "bank_document": bank_document_file,
        "registration": registration_file,
        "signed_vrf": signed_vrf_file,
    }
    for field, up in files.items():
        if up is None:
            continue
        safe = _safe_filename(up.filename or f"{field}.bin")
        out_name = f"{field}__{safe}"
        out_path = vdir / out_name
        with out_path.open("wb") as f:
            f.write(await up.read())
        # Path relative to backend root, served via /uploads
        file_paths[field] = f"uploads/{vendor_id}/{out_name}"

    record = {
        "id": vendor_id,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "data": vendor.model_dump(),
        "files": file_paths,
    }

    vendors = _read_vendors()
    vendors.append(record)
    _write_vendors(vendors)

    return JSONResponse({"id": vendor_id, "ok": True}, status_code=201)


@app.get("/api/vendors")
def list_vendors() -> list[dict[str, Any]]:
    return _read_vendors()


@app.get("/api/vendors/{vendor_id}")
def get_vendor(vendor_id: str) -> dict[str, Any]:
    for v in _read_vendors():
        if v["id"] == vendor_id:
            return v
    raise HTTPException(404, "Vendor not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
