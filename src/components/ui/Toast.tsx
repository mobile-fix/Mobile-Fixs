"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Toast notifications.
 *
 * Rendered into an `aria-live` region so screen-reader users hear the same
 * confirmation sighted users see. Errors use `assertive` (they interrupt);
 * successes use `polite`. Auto-dismiss pauses while the pointer is over the
 * stack, so a toast can never disappear mid-read.
 */

export type ToastTone = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>. Wrap the layout in one.");
  }
  return context;
}

const TONE_CONFIG: Record<ToastTone, { icon: IconName; classes: string; iconClass: string }> = {
  success: {
    icon: "check-circle",
    classes: "border-success-100 bg-success-50 text-success-900 dark:border-success-700 dark:bg-success-900 dark:text-success-50",
    iconClass: "text-success-600 dark:text-success-100",
  },
  error: {
    icon: "alert-circle",
    classes: "border-danger-100 bg-danger-50 text-danger-900 dark:border-danger-700 dark:bg-danger-900 dark:text-danger-50",
    iconClass: "text-danger-600 dark:text-danger-100",
  },
  warning: {
    icon: "alert-triangle",
    classes: "border-warning-100 bg-warning-50 text-warning-900 dark:border-warning-700 dark:bg-warning-900 dark:text-warning-50",
    iconClass: "text-warning-600 dark:text-warning-100",
  },
  info: {
    icon: "info",
    classes: "border-info-100 bg-info-50 text-info-900 dark:border-info-700 dark:bg-info-900 dark:text-info-50",
    iconClass: "text-info-600 dark:text-info-100",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef(new Map<string, number>());
  const paused = useRef(false);

  useEffect(() => {
    setMounted(true);
    const map = timers.current;
    return () => {
      map.forEach((timer) => window.clearTimeout(timer));
      map.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;
      const timer = window.setTimeout(() => {
        if (paused.current) {
          // Re-check shortly rather than dismissing under the user's pointer.
          scheduleDismiss(id, 1200);
          return;
        }
        dismiss(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = input.duration ?? (input.tone === "error" ? 7000 : 4500);

      setToasts((current) => {
        // Cap the stack so a burst of failures cannot bury the page.
        const next = [...current, { ...input, id }];
        return next.slice(-4);
      });
      scheduleDismiss(id, duration);
      return id;
    },
    [scheduleDismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ tone: "success", title, description }),
      error: (title, description) => toast({ tone: "error", title, description }),
      info: (title, description) => toast({ tone: "info", title, description }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end sm:p-6"
              onMouseEnter={() => (paused.current = true)}
              onMouseLeave={() => (paused.current = false)}
            >
              <div aria-live="polite" aria-atomic="false" className="contents">
                {toasts
                  .filter((item) => item.tone !== "error")
                  .map((item) => (
                    <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
                  ))}
              </div>
              <div aria-live="assertive" aria-atomic="false" className="contents">
                {toasts
                  .filter((item) => item.tone === "error")
                  .map((item) => (
                    <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
                  ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = TONE_CONFIG[toast.tone];

  return (
    <div
      className={cn(
        "animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg sm:animate-scale-in",
        config.classes,
      )}
    >
      <Icon name={config.icon} size={20} className={cn("mt-0.5 shrink-0", config.iconClass)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm opacity-90">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss: ${toast.title}`}
        className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100"
      >
        <Icon name="close" size={15} />
      </button>
    </div>
  );
}
