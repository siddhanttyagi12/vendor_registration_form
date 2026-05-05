/**
 * Inline declaration card with a required-acceptance checkbox.
 * Used when the vendor declines GST or MSME registration.
 */
export default function Declaration({
  title,
  subject,        // "GST Act" | "MSME Act"
  vendorName,     // string for the {NAME OF THE COMPANY} placeholder
  accepted,
  onChange,
  error,
  downloadHref,
}) {
  const company = vendorName?.trim() || '[your company name]';
  return (
    <div className="md:col-span-2">
      <div
        className={`rounded-xl border bg-gradient-to-br from-brand-50 via-white to-accent-50/40 p-5 shadow-sm ${
          error ? 'border-blue-300' : 'border-brand-200/70'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-400" />
              Declaration required
            </div>
            <h3 className="mt-1 text-base font-semibold text-ink-900">{title}</h3>
          </div>
          {downloadHref && (
            <a
              href={downloadHref}
              download
              className="pill bg-white text-brand-700 border border-brand-200 hover:bg-brand-50"
            >
              ⤓ Download template
            </a>
          )}
        </div>

        <div className="rounded-lg bg-white/70 p-4 text-sm leading-relaxed text-ink-800">
          <p className="mb-2 text-slate-500 text-xs">To: The Management, Shiprocket Pvt. Ltd</p>
          <p>
            We <span className="rounded bg-brand-50 px-1 font-semibold text-brand-800">
              {company}
            </span>{' '}
            hereby declare that we are <strong>not registered</strong> under the {subject}.
          </p>
          <p className="mt-2">
            We further assure that, if in future we get registered under the {subject},
            we will inform you immediately.
          </p>
          <p className="mt-2">
            We declare that the information furnished above is true and correct
            to the best of our knowledge and belief. In case there is any change
            in the information furnished, we will inform you accordingly.
          </p>
        </div>

        <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!accepted}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-400 text-brand-700
              focus:ring-2 focus:ring-brand-500/30"
          />
          <span className="text-sm font-medium text-ink-900">
            I confirm and accept the above declaration
            <span className="ml-1 font-bold text-brand-700">*</span>
          </span>
        </label>
        {error && <p className="field-error ml-7">{error}</p>}
      </div>
    </div>
  );
}
