import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import VendorForm from './components/VendorForm.jsx';
import SuccessScreen from './components/SuccessScreen.jsx';

export default function App() {
  const [submittedId, setSubmittedId] = useState(null);

  return (
    <div className="min-h-screen bg-hero-fade">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            border: '1px solid #e9d8ff',
            background: '#fff',
            color: '#1f1530',
            fontSize: 14,
          },
          success: {
            iconTheme: { primary: '#0aa628', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#1d4ed8', secondary: '#fff' },
          },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/shiprocket_logo.svg"
              alt="Shiprocket"
              className="h-8 w-auto sm:h-9"
            />
            <span className="hidden h-6 w-px bg-brand-100 sm:block" />
            <div className="hidden sm:block">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                Vendor Portal
              </div>
              <div className="text-[11px] text-slate-500">Registration & onboarding</div>
            </div>
          </div>
          <div className="hidden text-xs text-slate-500 lg:block">
            Plot 416, Phase-III, Udyog Vihar, Gurugram, Haryana – 122002
          </div>
        </div>
      </header>

      {/* Hero */}
      {!submittedId && (
        <section className="mx-auto max-w-6xl px-4 pb-2 pt-8 sm:px-8 sm:pt-12">
          <div className="flex flex-col gap-3">
            <span className="pill w-max bg-brand-50 text-brand-700">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent-400" />
              New vendor
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Vendor Registration Form
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Fill out the details below. Fields marked
              <span className="font-semibold text-brand-700"> * </span>are mandatory.
            </p>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-8">
        {submittedId ? (
          <SuccessScreen
            vendorId={submittedId}
            onReset={() => setSubmittedId(null)}
          />
        ) : (
          <VendorForm onSuccess={(id) => setSubmittedId(id)} />
        )}
      </main>

      <footer className="border-t border-brand-100/70 bg-white py-6 text-center text-xs text-slate-500">
        © Shiprocket Limited · Internal vendor onboarding portal
      </footer>
    </div>
  );
}
