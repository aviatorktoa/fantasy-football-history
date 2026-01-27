'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo / Title */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 mb-6 shadow-lg glow-gold">
            <svg
              className="w-10 h-10 text-midnight"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="font-display text-6xl md:text-7xl tracking-wide text-white mb-4">
            DYNASTY
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Fantasy Football League History & Analytics
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="card p-4">
            <div className="text-gold-400 text-2xl mb-2">🏆</div>
            <h3 className="font-semibold text-white mb-1">Championships</h3>
            <p className="text-sm text-gray-400">Track dynasty leaders</p>
          </div>
          <div className="card p-4">
            <div className="text-emerald-400 text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white mb-1">20+ Years</h3>
            <p className="text-sm text-gray-400">Complete league history</p>
          </div>
          <div className="card p-4">
            <div className="text-crimson-400 text-2xl mb-2">⚔️</div>
            <h3 className="font-semibold text-white mb-1">Head-to-Head</h3>
            <p className="text-sm text-gray-400">Rivalry records</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-crimson-500/10 border border-crimson-500/30 rounded-lg text-crimson-400">
            {error === 'auth_failed'
              ? 'Authentication failed. Please try again.'
              : error === 'no_code'
              ? 'No authorization code received.'
              : `Error: ${error}`}
          </div>
        )}

        {/* Login button */}
        <a href="/api/auth/login" className="btn-primary inline-flex items-center gap-3 text-lg">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 12.5c0-.78-.07-1.53-.2-2.25H12v4.26h6.45c-.28 1.48-1.14 2.73-2.42 3.58v2.97h3.92c2.29-2.11 3.55-5.22 3.55-8.56z" />
            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.01c-1.08.72-2.46 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.11C3.26 21.43 7.31 24 12 24z" />
            <path d="M5.27 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.11z" />
            <path d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.45-3.45C18.11 1.19 15.4 0 12 0 7.31 0 3.26 2.57 1.29 6.38l3.98 3.11c.95-2.85 3.6-4.72 6.73-4.72z" />
          </svg>
          Connect with Yahoo
        </a>

        <p className="mt-6 text-sm text-gray-500">
          Securely connects to your Yahoo Fantasy account
        </p>

        {/* Instructions */}
        <div className="mt-16 card p-6 text-left">
          <h2 className="font-display text-2xl text-white mb-4">SETUP INSTRUCTIONS</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-sm font-mono">1</span>
              <span>Go to <a href="https://developer.yahoo.com/apps/create/" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">developer.yahoo.com/apps/create</a></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-sm font-mono">2</span>
              <span>Create an app with "Fantasy Sports" API permissions (read only)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-sm font-mono">3</span>
              <span>Set callback URL to: <code className="text-emerald-400 bg-slate-750 px-2 py-0.5 rounded text-sm">your-domain.com/api/auth/callback</code></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center text-sm font-mono">4</span>
              <span>Add Client ID and Secret to your environment variables</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="loading-shimmer w-32 h-32 rounded-xl" />
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
