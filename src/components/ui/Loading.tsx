'use client';

/**
 * Loading — Unified loading indicator component for Smart Finance.
 *
 * Variants:
 *   - "page"     : Full center layout with Aloka logo, glow, and progress bar. Ideal for page-level loading.
 *   - "overlay"  : Fixed fullscreen overlay with blur. Ideal for route transition loading.
 *   - "spinner"  : Compact inline animated spinner. Ideal inside buttons, cards, or small sections.
 *   - "bar"      : Slim animated progress bar only. Ideal for top-of-page or section loaders.
 *   - "skeleton" : Simple pulsing placeholder block. Ideal for content placeholders.
 *
 * Usage Examples:
 *   <Loading />                                   — default "page" variant, center layout
 *   <Loading variant="overlay" />                 — fullscreen overlay with blur
 *   <Loading variant="spinner" size="sm" />       — small inline spinner
 *   <Loading variant="bar" />                     — slim animated progress bar
 *   <Loading variant="skeleton" className="h-32 rounded-2xl" />  — pulsing skeleton block
 *   <Loading fullScreen message="Memuat..." />    — page variant that fills entire screen height
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlokaLogo } from '@/components/shared/AlokaLogo';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type LoadingVariant = 'page' | 'overlay' | 'spinner' | 'bar' | 'skeleton';
type LoadingSize = 'xs' | 'sm' | 'md' | 'lg';

interface LoadingProps {
  /** Visual variant. Defaults to "page". */
  variant?: LoadingVariant;
  /** Loading label. Only shown for "page" and "overlay" variants. */
  message?: string;
  /** If true (page/overlay variants), fills full viewport height with bg color. */
  fullScreen?: boolean;
  /** Size for "spinner" variant. Defaults to "md". */
  size?: LoadingSize;
  /** Additional class names applied to the outermost wrapper. */
  className?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function Spinner({ size = 'md', className }: { size?: LoadingSize; className?: string }) {
  const sizeMap: Record<LoadingSize, string> = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-5 w-5 border-2',
    md: 'h-7 w-7 border-2',
    lg: 'h-10 w-10 border-[3px]',
  };
  return (
    <div
      className={cn(
        'rounded-full border-zinc-200 dark:border-zinc-700 border-t-blue-600 animate-spin',
        sizeMap[size],
        className
      )}
    />
  );
}

function ProgressBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-44 h-1.5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-full overflow-hidden relative shadow-inner',
        className
      )}
    >
      <div className="absolute inset-y-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 rounded-full animate-progress-bar" />
    </div>
  );
}

function LogoLayout({
  message = 'Memuat data Aloka...',
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center space-y-5">
      {/* Animated logo with pulsing backlight */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-blue-500/25 dark:bg-blue-400/20 blur-2xl animate-pulse" />
        <div className="relative transition-transform hover:scale-105">
          <AlokaLogo size="xl" showText={false} />
        </div>
      </div>

      {/* Branded label & bar */}
      <div className="flex flex-col items-center space-y-3 text-center max-w-xs">
        <AlokaLogo size="sm" showText />
        <ProgressBar />
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────────────────────────────

export function Loading({
  variant = 'page',
  message = 'Memuat data Aloka...',
  fullScreen = false,
  size = 'md',
  className,
}: LoadingProps) {
  // ── page ──────────────────────────────────────────────────────────────────
  if (variant === 'page') {
    return (
      <div
        className={cn(
          'w-full flex flex-col items-center justify-center p-6 animate-fade-in',
          fullScreen
            ? 'min-h-screen bg-zinc-50 dark:bg-zinc-950'
            : 'min-h-[60vh]',
          className
        )}
      >
        <LogoLayout message={message} />
      </div>
    );
  }

  // ── overlay ───────────────────────────────────────────────────────────────
  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md animate-fade-in',
          className
        )}
      >
        <LogoLayout message={message} />
      </div>
    );
  }

  // ── spinner ───────────────────────────────────────────────────────────────
  if (variant === 'spinner') {
    return <Spinner size={size} className={className} />;
  }

  // ── bar ───────────────────────────────────────────────────────────────────
  if (variant === 'bar') {
    return <ProgressBar className={className} />;
  }

  // ── skeleton ──────────────────────────────────────────────────────────────
  if (variant === 'skeleton') {
    return (
      <div
        className={cn(
          'animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800',
          className
        )}
      />
    );
  }

  return null;
}
