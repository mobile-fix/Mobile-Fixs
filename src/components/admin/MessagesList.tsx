"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError, queryString } from "@/lib/api-client";
import { MESSAGE_STATUSES, type MessageStatus } from "@/lib/constants";
import { cn, formatDateTime, formatPhone, formatRelative } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
};

type MessageResult = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Message[];
};

const TONE: Record<MessageStatus, "warning" | "info" | "success"> = {
  NEW: "warning",
  READ: "info",
  RESOLVED: "success",
};

/** Contact enquiries with an inline status workflow. */
export function MessagesList() {
  const toast = useToast();
  const [status, setStatus] = useState<MessageStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<MessageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get<MessageResult>(
        `/api/admin/messages${queryString({ status, page, pageSize: 20 })}`,
        controller.signal,
      )
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResult(null);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load messages.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [status, page, reloadKey]);

  const setMessageStatus = async (message: Message, next: MessageStatus) => {
    setUpdatingId(message.id);
    try {
      await api.patch(`/api/admin/messages/${message.id}`, { status: next });
      // Update in place so the list does not jump under the reader.
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === message.id ? { ...item, status: next } : item,
              ),
            }
          : current,
      );
      toast.success(`Marked as ${next.toLowerCase()}`);
    } catch (cause) {
      toast.error(
        "Could not update message",
        cause instanceof ApiClientError ? cause.message : "Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpanded = (message: Message) => {
    const opening = expandedId !== message.id;
    setExpandedId(opening ? message.id : null);
    // Opening an unread enquiry marks it read, which is what an operator expects.
    if (opening && message.status === "NEW") void setMessageStatus(message, "READ");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...MESSAGE_STATUSES] as const).map((entry) => {
          const active = status === entry;
          return (
            <button
              key={entry}
              type="button"
              onClick={() => {
                setStatus(entry);
                setPage(1);
              }}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors duration-200",
                active
                  ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                  : "border-line text-ink-muted hover:border-brand-300 hover:text-ink",
              )}
            >
              {entry.toLowerCase()}
            </button>
          );
        })}
      </div>

      {error ? (
        <Alert
          tone="danger"
          title="Could not load messages"
          live
          action={
            <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : loading && !result ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">Loading messages</span>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <ul className={cn("space-y-3", loading && "opacity-60")}>
            {result.items.map((message) => {
              const expanded = expandedId === message.id;
              return (
                <li key={message.id}>
                  <Card className={cn("overflow-hidden", message.status === "NEW" && "border-warning-200 dark:border-warning-700")}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(message)}
                      aria-expanded={expanded}
                      aria-controls={`message-${message.id}`}
                      className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-sunken sm:p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={TONE[message.status]} size="sm">
                            {message.status.toLowerCase()}
                          </Badge>
                          <span className="font-semibold text-ink">{message.subject}</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-ink-muted">
                          {message.name} · {message.email}
                          {message.phone ? ` · ${formatPhone(message.phone)}` : ""}
                        </p>
                        {!expanded ? (
                          <p className="mt-1 truncate text-sm text-ink-subtle">{message.message}</p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="block text-xs text-ink-subtle">
                          {formatRelative(message.createdAt)}
                        </span>
                        <Icon
                          name="chevron-down"
                          size={16}
                          className={cn(
                            "mt-1 ml-auto text-ink-subtle transition-transform duration-200",
                            expanded && "rotate-180",
                          )}
                        />
                      </div>
                    </button>

                    <div id={`message-${message.id}`} hidden={!expanded} className="border-t border-line p-4 sm:p-5">
                      <p className="whitespace-pre-line leading-relaxed text-ink-muted">
                        {message.message}
                      </p>
                      <p className="mt-3 text-xs text-ink-subtle">
                        Received {formatDateTime(message.createdAt)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                        <a
                          href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 dark:bg-brand-700 dark:hover:bg-brand-600"
                        >
                          <Icon name="mail" size={14} />
                          Reply by email
                        </a>

                        {message.phone ? (
                          <a
                            href={`tel:+91${message.phone}`}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-sunken"
                          >
                            <Icon name="phone" size={14} />
                            Call
                          </a>
                        ) : null}

                        {message.status !== "RESOLVED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            iconLeft="check"
                            loading={updatingId === message.id}
                            onClick={() => setMessageStatus(message, "RESOLVED")}
                          >
                            Mark resolved
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            iconLeft="refresh"
                            loading={updatingId === message.id}
                            onClick={() => setMessageStatus(message, "READ")}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            onPageChange={setPage}
            itemLabel="messages"
          />
        </>
      ) : (
        <EmptyState
          icon="inbox"
          title={status === "ALL" ? "No messages yet" : `No ${status.toLowerCase()} messages`}
          description="Enquiries submitted through the contact form appear here."
          action={
            status !== "ALL" ? (
              <Button variant="outline" onClick={() => setStatus("ALL")}>
                Show all messages
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
