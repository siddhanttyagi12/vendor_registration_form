export function Field({
  label, name, value, onChange, required, error, help, type = 'text',
  placeholder, maxLength, full, readOnly, disabled, rightSlot, autoComplete,
  inputMode,
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`field-input ${error ? 'error' : ''} ${rightSlot ? 'pr-28' : ''}`}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p className="field-error">{error}</p>
      ) : help ? (
        <p className="field-help">{help}</p>
      ) : null}
    </div>
  );
}

export function Select({
  label, name, value, onChange, options, required, error, help, full, disabled,
  placeholder = 'Select…',
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`field-input ${error ? 'error' : ''}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      {error ? <p className="field-error">{error}</p> : help ? <p className="field-help">{help}</p> : null}
    </div>
  );
}

export function YesNo({ label, name, value, onChange, required, help, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
        {[
          { v: true, t: 'Yes' },
          { v: false, t: 'No' },
        ].map(({ v, t }) => {
          const active = value === v;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(v)}
              className={`min-w-[64px] rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-700 text-white shadow'
                  : 'text-ink-800 hover:bg-brand-50'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      {help && <p className="field-help">{help}</p>}
    </div>
  );
}

export function FileField({
  label, required, file, onChange, accept, help, error, full, rightSlot,
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      <div
        className={`flex items-center gap-3 rounded-lg border ${
          error ? 'border-blue-400' : 'border-dashed border-slate-300'
        } bg-slate-50/60 px-3 py-2.5`}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="block w-full text-sm text-ink-800 file:cursor-pointer"
        />
        {file && (
          <span className="pill bg-accent-50 text-accent-700 whitespace-nowrap">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        )}
        {rightSlot}
      </div>
      {error ? (
        <p className="field-error">{error}</p>
      ) : help ? (
        <p className="field-help">{help}</p>
      ) : null}
    </div>
  );
}

export function Textarea({ label, name, value, onChange, required, error, help, rows = 3, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`field-input ${error ? 'error' : ''}`}
      />
      {error ? <p className="field-error">{error}</p> : help ? <p className="field-help">{help}</p> : null}
    </div>
  );
}
