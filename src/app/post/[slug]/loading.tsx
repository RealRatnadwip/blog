export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-16 rounded-[2rem] bg-slate-900/90" />
        <div className="space-y-4">
          <div className="h-6 w-3/4 rounded-full bg-slate-900/90" />
          <div className="h-6 rounded-full bg-slate-900/90" />
          <div className="h-80 rounded-[2rem] bg-slate-900/90" />
        </div>
      </div>
    </div>
  );
}
