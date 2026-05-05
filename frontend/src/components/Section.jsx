export default function Section({ id, title, subtitle, icon, children, accent }) {
  return (
    <section id={id} className="card p-6 sm:p-8 scroll-mt-24">
      <header className="mb-6 flex items-start gap-4">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base font-semibold ${
            accent === 'brand'
              ? 'bg-brand-gradient text-white shadow-sm'
              : 'bg-brand-50 text-brand-700'
          }`}
          aria-hidden
        >
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
