import { GlassPanel } from '@/components/ui';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
        <GlassPanel className="p-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">loading</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Loading content…</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">Preparing the terminal-inspired experience and fetching the latest posts.</p>
        </GlassPanel>
      </div>
    </main>
  );
}
