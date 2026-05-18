"use client";

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export function GlassPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={clsx(
        'terminal-panel rounded-[2rem] border border-slate-700/60 bg-slate-950/80 shadow-glow backdrop-blur-xl',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function Button({
  className,
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
}) {
  const base =
    'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-accent text-slate-950 hover:bg-accentSoft',
    ghost: 'bg-slate-900/75 text-slate-100 hover:bg-slate-800',
    outline: 'border border-slate-700 text-slate-100 hover:border-accent hover:text-white',
    danger: 'bg-rose-500/90 text-white hover:bg-rose-500',
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-2xl border border-slate-700/90 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20',
        className
      )}
      {...props}
    />
  );
}

export function TagPill({
  label,
  active,
  href,
}: {
  label: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition',
        active ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'
      )}
    >
      {href ? <a href={href}>{label}</a> : label}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-700/70 bg-slate-950/75 p-10 text-center text-slate-400">
      <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{title}</p>
      <p className="mt-4 text-base leading-7">{description}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 rounded-[1.75rem] bg-slate-800/90" />
      <div className="h-6 w-3/4 rounded-full bg-slate-800/90" />
      <div className="h-4 w-full rounded-full bg-slate-800/90" />
      <div className="h-4 w-5/6 rounded-full bg-slate-800/90" />
    </div>
  );
}
