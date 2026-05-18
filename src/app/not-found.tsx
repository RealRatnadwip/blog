import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-700/80 bg-slate-950/80 p-10 text-center shadow-glow">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">404</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Page not found</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            The route you requested could not be found. Head back to the homepage and continue exploring the terminal feed.
          </p>
          <Link href="/" className="mt-8 inline-flex rounded-full border border-slate-700/80 bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-slate-800">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
