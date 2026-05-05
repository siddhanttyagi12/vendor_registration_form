import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Section from './Section.jsx';
import SectionNav from './SectionNav.jsx';
import Declaration from './Declaration.jsx';
import { Field, Select, YesNo, FileField, Textarea } from './Field.jsx';
import {
  PAN_RE, GSTIN_RE, IFSC_RE, MOBILE_RE, PIN_RE, EMAIL_RE,
  ENTITY_TYPES, COUNTRIES, STATES,
} from '../lib/validators.js';
import { submitVendor } from '../lib/api.js';

const initialForm = {
  // tax
  pan: '', aadhaar_linked_with_pan: null,
  has_gst: null, gstin: '', e_invoicing_applicable: null,
  cin: '', entity_type: '',
  itr_filed_last_2_years: null,
  itr_ack_year_minus_1: '', itr_ack_year_minus_2: '',
  // msme
  msme_registered: null, udyam_number: '',
  // declarations (only required when corresponding registration = No)
  non_gst_declaration_accepted: false,
  non_msme_declaration_accepted: false,
  // company
  vendor_name: '', description: '', brand_name: '',
  poc_name: '', poc_phone: '', poc_email: '',
  address_line: '', street: '', city: '',
  state: '', country: 'India', postal_code: '',
  telephone: '', fax: '', mobile: '',
  accounts_email: '', tax_email: '',
  // bank
  account_holder_name: '', bank_name: '', bank_branch: '',
  bank_street: '', bank_city: '',
  account_number: '', ifsc_code: '', swift_code: '',
  // signatory
  authorised_signatory: '',
};

const REQUIRED = [
  'pan', 'aadhaar_linked_with_pan', 'has_gst', 'e_invoicing_applicable',
  'cin', 'entity_type', 'itr_filed_last_2_years', 'msme_registered',
  'vendor_name', 'poc_name', 'poc_phone', 'poc_email',
  'state', 'country', 'postal_code',
  'mobile', 'accounts_email',
  'account_holder_name', 'account_number', 'ifsc_code',
];

export default function VendorForm({ onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState({
    pan_file: null, gst_file: null, msme_file: null,
    bank_document_file: null,
    registration_file: null, signed_vrf_file: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const set = (name) => (val) => setForm((f) => ({ ...f, [name]: val }));

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // ------------------------------------------------------------- progress --
  const progress = useMemo(() => {
    const total = REQUIRED.length;
    let done = 0;
    for (const k of REQUIRED) {
      const v = form[k];
      if (v === null || v === undefined || v === '') continue;
      done += 1;
    }
    return Math.round((done / total) * 100);
  }, [form]);

  // -------------------------------------------------------------- submit --
  function validateAll() {
    const errs = {};
    const r = (k, msg) => {
      const v = form[k];
      if (v === null || v === undefined || v === '') errs[k] = msg || 'Required';
    };
    REQUIRED.forEach((k) => r(k));

    if (form.pan && !PAN_RE.test(form.pan.toUpperCase()))
      errs.pan = 'PAN must look like ABCDE1234F';
    if (form.has_gst === true) {
      const gstinUp = form.gstin.toUpperCase();
      const panUp = form.pan.toUpperCase();
      if (!form.gstin) errs.gstin = 'Required';
      else if (!GSTIN_RE.test(gstinUp))
        errs.gstin = 'GSTIN format invalid';
      else if (panUp && !gstinUp.includes(panUp))
        errs.gstin = `GSTIN must contain your PAN (${panUp})`;
    }
    if (form.ifsc_code && !IFSC_RE.test(form.ifsc_code.toUpperCase()))
      errs.ifsc_code = 'IFSC must look like SBIN0123456';
    if (form.mobile && !MOBILE_RE.test(form.mobile))
      errs.mobile = '10-digit mobile starting with 6/7/8/9';
    if (form.poc_phone && !MOBILE_RE.test(form.poc_phone))
      errs.poc_phone = '10-digit mobile starting with 6/7/8/9';
    if (form.postal_code && !PIN_RE.test(form.postal_code))
      errs.postal_code = '6-digit pincode';
    if (form.accounts_email && !EMAIL_RE.test(form.accounts_email))
      errs.accounts_email = 'Email looks invalid';
    if (form.poc_email && !EMAIL_RE.test(form.poc_email))
      errs.poc_email = 'Email looks invalid';
    if (form.tax_email && !EMAIL_RE.test(form.tax_email))
      errs.tax_email = 'Email looks invalid';
    if (form.itr_filed_last_2_years === true) {
      if (!form.itr_ack_year_minus_1) errs.itr_ack_year_minus_1 = 'Required';
      if (!form.itr_ack_year_minus_2) errs.itr_ack_year_minus_2 = 'Required';
    }
    if (form.msme_registered === true && !form.udyam_number)
      errs.udyam_number = 'Required when MSME registered';
    if (form.has_gst === false && !form.non_gst_declaration_accepted)
      errs.non_gst_declaration_accepted = 'You must accept the NON-GST declaration';
    if (form.msme_registered === false && !form.non_msme_declaration_accepted)
      errs.non_msme_declaration_accepted = 'You must accept the NON-MSME declaration';
    if (!files.pan_file) errs.pan_file = 'PAN scan required';
    if (form.has_gst === true && !files.gst_file)
      errs.gst_file = 'GST certificate required';
    if (!files.bank_document_file) errs.bank_document_file = 'Bank document required';
    if (form.msme_registered === true && !files.msme_file)
      errs.msme_file = 'MSME certificate required';

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateAll();
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields');
      const firstId = Object.keys(errs)[0];
      document.getElementById(firstId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        pan: form.pan.toUpperCase(),
        gstin: form.gstin ? form.gstin.toUpperCase() : null,
        ifsc_code: form.ifsc_code.toUpperCase(),
      };
      const res = await submitVendor(payload, files);
      onSuccess(res.id);
    } catch (e) {
      toast.error(`Submission failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------------------- render -
  const showItr = form.itr_filed_last_2_years === true;
  const showMsmeFields = form.msme_registered === true;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <SectionNav progress={progress} />

      <div className="space-y-6">
        {/* TAX & COMPLIANCE */}
        <Section
          id="tax"
          icon="①"
          title="Tax & Compliance"
          subtitle="PAN, GST, e-invoicing and ITR details."
          accent="brand"
        >
          <Field
            label="PAN Number" name="pan" required
            value={form.pan}
            onChange={(v) => set('pan')(v.toUpperCase())}
            placeholder="ABCDE1234F"
            maxLength={10}
            error={errors.pan}
            help="Permanent Account Number — 10 chars"
          />
          <YesNo
            label="Aadhaar linked with PAN" name="aadhaar_linked_with_pan" required
            value={form.aadhaar_linked_with_pan}
            onChange={set('aadhaar_linked_with_pan')}
          />

          {/* Has-GST gate */}
          <YesNo
            label="Do you have a GST registration"
            name="has_gst"
            required
            value={form.has_gst}
            onChange={(v) => {
              update({ has_gst: v });
              if (v === false) {
                update({ gstin: '' });
                setFiles((s) => ({ ...s, gst_file: null }));
                setErrors((e) => ({ ...e, gstin: undefined, gst_file: undefined }));
              }
            }}
          />

          {form.has_gst === true && (
            <Field
              label="GST Number" name="gstin" required
              value={form.gstin}
              onChange={(v) => set('gstin')(v.toUpperCase())}
              placeholder="22ABCDE1234F1Z5"
              maxLength={15}
              error={errors.gstin}
              help="Must contain your PAN"
            />
          )}

          {form.has_gst === false && (
            <Declaration
              title="NON-GST Declaration"
              subject="GST Act"
              vendorName={form.vendor_name}
              accepted={form.non_gst_declaration_accepted}
              onChange={set('non_gst_declaration_accepted')}
              error={errors.non_gst_declaration_accepted}
              downloadHref="/declarations/non_gst_declaration.docx"
            />
          )}

          <YesNo
            label="E-invoicing applicable" name="e_invoicing_applicable" required
            value={form.e_invoicing_applicable}
            onChange={set('e_invoicing_applicable')}
          />
          <Field
            label="CIN — Entity Registration No"
            name="cin"
            required
            value={form.cin}
            onChange={(v) => set('cin')(v.toUpperCase())}
            placeholder="U72200DL2019PTC123456"
            error={errors.cin}
          />
          <Select
            label="Type of Entity" name="entity_type" required
            value={form.entity_type}
            onChange={set('entity_type')}
            options={ENTITY_TYPES}
            error={errors.entity_type}
          />

          <YesNo
            label="ITR filed for previous 2 years" name="itr_filed_last_2_years" required
            value={form.itr_filed_last_2_years}
            onChange={set('itr_filed_last_2_years')}
            full
          />
          {showItr && (
            <>
              <Field
                label="ITR Acknowledgement No (Year-1)"
                name="itr_ack_year_minus_1"
                required
                value={form.itr_ack_year_minus_1}
                onChange={set('itr_ack_year_minus_1')}
                error={errors.itr_ack_year_minus_1}
              />
              <Field
                label="ITR Acknowledgement No (Year-2)"
                name="itr_ack_year_minus_2"
                required
                value={form.itr_ack_year_minus_2}
                onChange={set('itr_ack_year_minus_2')}
                error={errors.itr_ack_year_minus_2}
              />
            </>
          )}

        </Section>

        {/* MSME */}
        <Section
          id="msme"
          icon="②"
          title="MSME / Udyam"
          subtitle="Micro / Small / Medium Enterprise registration."
        >
          <YesNo
            label="Registered under MSME"
            name="msme_registered"
            required
            value={form.msme_registered}
            onChange={set('msme_registered')}
          />
          {showMsmeFields && (
            <Field
              label="Udyam Number" name="udyam_number" required
              value={form.udyam_number}
              onChange={set('udyam_number')}
              placeholder="UDYAM-XX-00-0000000"
              error={errors.udyam_number}
            />
          )}
          {showMsmeFields && (
            <FileField
              label="MSME Certificate"
              required
              file={files.msme_file}
              onChange={(f) => setFiles((s) => ({ ...s, msme_file: f }))}
              accept="image/*,application/pdf"
              error={errors.msme_file}
              full
            />
          )}
          {form.msme_registered === false && (
            <Declaration
              title="NON-MSME Declaration"
              subject="MSME Act"
              vendorName={form.vendor_name}
              accepted={form.non_msme_declaration_accepted}
              onChange={set('non_msme_declaration_accepted')}
              error={errors.non_msme_declaration_accepted}
              downloadHref="/declarations/non_msme_declaration.docx"
            />
          )}
        </Section>

        {/* COMPANY */}
        <Section id="company" icon="③" title="Company Details" subtitle="Vendor entity & contact information.">
          <Field
            label="Vendor Name" name="vendor_name" required
            value={form.vendor_name}
            onChange={set('vendor_name')}
            error={errors.vendor_name}
            full
          />
          <Textarea
            label="Brief description of service"
            name="description"
            value={form.description}
            onChange={set('description')}
            full
          />
          <Field
            label="Brand Name (if any)" name="brand_name"
            value={form.brand_name}
            onChange={set('brand_name')}
          />
          <Field
            label="POC at Shiprocket" name="poc_name" required
            value={form.poc_name}
            onChange={set('poc_name')}
            error={errors.poc_name}
            help="Single point of contact at Shiprocket for this vendor"
            full
          />
          <Field
            label="POC Phone" name="poc_phone" required
            value={form.poc_phone}
            onChange={set('poc_phone')}
            maxLength={10}
            inputMode="tel"
            error={errors.poc_phone}
          />
          <Field
            label="POC Email" name="poc_email" required
            value={form.poc_email}
            onChange={set('poc_email')}
            type="email"
            error={errors.poc_email}
          />
          <Field
            label="Address" name="address_line"
            value={form.address_line}
            onChange={set('address_line')}
            full
          />
          <Field
            label="Street" name="street"
            value={form.street}
            onChange={set('street')}
          />
          <Field
            label="City" name="city"
            value={form.city}
            onChange={set('city')}
          />
          <Select
            label="State" name="state" required
            value={form.state}
            onChange={set('state')}
            options={STATES}
            error={errors.state}
          />
          <Select
            label="Country" name="country" required
            value={form.country}
            onChange={set('country')}
            options={COUNTRIES}
            error={errors.country}
          />
          <Field
            label="Postal Code" name="postal_code" required
            value={form.postal_code}
            onChange={set('postal_code')}
            maxLength={6}
            inputMode="numeric"
            error={errors.postal_code}
          />
          <Field
            label="Telephone" name="telephone"
            value={form.telephone}
            onChange={set('telephone')}
            inputMode="tel"
          />
          <Field
            label="Fax" name="fax"
            value={form.fax}
            onChange={set('fax')}
          />
          <Field
            label="Mobile" name="mobile" required
            value={form.mobile}
            onChange={set('mobile')}
            maxLength={10}
            inputMode="tel"
            error={errors.mobile}
          />
          <Field
            label="Accounts Email" name="accounts_email" required
            value={form.accounts_email}
            onChange={set('accounts_email')}
            type="email"
            error={errors.accounts_email}
          />
          <Field
            label="Tax Email (if different)" name="tax_email"
            value={form.tax_email}
            onChange={set('tax_email')}
            type="email"
            error={errors.tax_email}
          />
        </Section>

        {/* BANK */}
        <Section
          id="bank"
          icon="④"
          title="Bank Details"
          subtitle="Account information and a supporting bank document."
        >
          <Field
            label="Account Holder Name" name="account_holder_name" required
            value={form.account_holder_name}
            onChange={set('account_holder_name')}
            error={errors.account_holder_name}
            help="Should match the company name on your bank document."
            full
          />
          <Field
            label="Bank Name" name="bank_name"
            value={form.bank_name}
            onChange={set('bank_name')}
          />
          <Field
            label="Branch" name="bank_branch"
            value={form.bank_branch}
            onChange={set('bank_branch')}
          />
          <Field
            label="Bank Street" name="bank_street"
            value={form.bank_street}
            onChange={set('bank_street')}
          />
          <Field
            label="Bank City" name="bank_city"
            value={form.bank_city}
            onChange={set('bank_city')}
          />
          <Field
            label="Account Number" name="account_number" required
            value={form.account_number}
            onChange={set('account_number')}
            inputMode="numeric"
            error={errors.account_number}
          />
          <Field
            label="IFSC Code" name="ifsc_code" required
            value={form.ifsc_code}
            onChange={(v) => set('ifsc_code')(v.toUpperCase())}
            placeholder="SBIN0123456"
            maxLength={11}
            error={errors.ifsc_code}
          />
          <Field
            label="Swift Code (10 digits, if intl)" name="swift_code"
            value={form.swift_code}
            onChange={(v) => set('swift_code')(v.toUpperCase())}
            maxLength={11}
          />

          <FileField
            label="Bank Document (with company name)"
            required
            file={files.bank_document_file}
            onChange={(f) => setFiles((s) => ({ ...s, bank_document_file: f }))}
            accept="image/*,application/pdf"
            error={errors.bank_document_file}
            full
            help="Cancelled cheque, bank statement, passbook front page, or bank letter — anything that shows the company name."
          />
        </Section>

        {/* DOCS */}
        <Section
          id="docs"
          icon="⑤"
          title="Documents"
          subtitle="Upload supporting scans (PDF or image)."
        >
          <FileField
            label="PAN Card scan" required
            file={files.pan_file}
            onChange={(f) => setFiles((s) => ({ ...s, pan_file: f }))}
            accept="image/*,application/pdf"
            error={errors.pan_file}
          />
          {form.has_gst === true && (
            <FileField
              label="GST Registration Certificate"
              required
              file={files.gst_file}
              onChange={(f) => setFiles((s) => ({ ...s, gst_file: f }))}
              accept="image/*,application/pdf"
              error={errors.gst_file}
            />
          )}
          <FileField
            label="Certificate of Incorporation / Registration"
            file={files.registration_file}
            onChange={(f) => setFiles((s) => ({ ...s, registration_file: f }))}
            accept="image/*,application/pdf"
            help="Certificate of Incorporation in case of Company"
          />
          <FileField
            label="Signed VRF (Vendor Registration Form)"
            file={files.signed_vrf_file}
            onChange={(f) => setFiles((s) => ({ ...s, signed_vrf_file: f }))}
            accept="image/*,application/pdf"
          />
        </Section>

        {/* SIGN */}
        <Section
          id="sign"
          icon="⑥"
          title="Authorised Signatory"
          subtitle="The person authorised to sign on behalf of the vendor."
        >
          <Field
            label="Name of Authorised Signatory"
            name="authorised_signatory"
            value={form.authorised_signatory}
            onChange={set('authorised_signatory')}
            full
          />
        </Section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="text-sm text-slate-600">
            By submitting, you confirm the information above is accurate.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all fields?')) {
                  setForm(initialForm);
                  setFiles({
                    pan_file: null, gst_file: null, msme_file: null,
                    bank_document_file: null,
                    registration_file: null, signed_vrf_file: null,
                  });
                  setErrors({});
                }
              }}
              className="btn-ghost"
            >
              Reset
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Submit Registration'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
