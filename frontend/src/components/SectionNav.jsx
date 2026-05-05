import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'tax',      label: 'Tax & Compliance' },
  { id: 'msme',     label: 'MSME' },
  { id: 'company',  label: 'Company Details' },
  { id: 'bank',     label: 'Bank Details' },
  { id: 'docs',     label: 'Documents' },
  { id: 'sign',     label: 'Authorised Signatory' },
];

export default function SectionNav({ progress }) {
  const [active, setActive] = useState('tax');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <nav className="hidden lg:block">
      <div className="card sticky top-6 p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full bg-brand-gradient transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <ol className="space-y-1">
          {SECTIONS.map((s, i) => {
            const isActive = active === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-brand-50 font-semibold text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-brand-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
