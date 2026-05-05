export default function SuccessScreen({ vendorId, onReset }) {
  return (
    <div className="card mx-auto max-w-2xl p-10 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-accent-50 text-accent-600">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-ink-900">Registration submitted</h1>
      <p className="mt-2 text-slate-600">
        Your details have been received. Our team will review and get back to you.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm">
        <span className="text-slate-500">Vendor ID:</span>
        <code className="font-mono font-semibold text-ink-900">{vendorId}</code>
      </div>
      <div className="mt-8">
        <button onClick={onReset} className="btn-ghost">
          Register another vendor
        </button>
      </div>
    </div>
  );
}
