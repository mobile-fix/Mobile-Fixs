"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/icons";
import { Alert, Badge, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { api, ApiClientError, queryString } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { BrandOption, ModelOption } from "./types";

/**
 * Device selection.
 *
 * The reference experience this improves on made customers scroll a flat list of
 * every device. Here, typing filters across all brands at once (server-side, so
 * it matches model codes and aliases too), while the brand grid stays available
 * for people who prefer to browse. Search wins whenever the box has content.
 */

export function DeviceSelector({
  selectedModel,
  onSelect,
  autoFocusSearch = false,
}: {
  selectedModel: ModelOption | null;
  onSelect: (model: ModelOption | null) => void;
  autoFocusSearch?: boolean;
}) {
  const [brands, setBrands] = useState<BrandOption[] | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);

  const [models, setModels] = useState<ModelOption[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Brands ────────────────────────────────────────────────────────────────
  const loadBrands = useMemo(
    () => async () => {
      setBrandError(null);
      try {
        const data = await api.get<{ brands: BrandOption[] }>("/api/catalog/brands");
        setBrands(data.brands);
      } catch (error) {
        setBrands([]);
        setBrandError(
          error instanceof ApiClientError ? error.message : "Could not load device brands.",
        );
      }
    },
    [],
  );

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  // Debounce the query so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // ── Models ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const searching = debouncedSearch.length >= 2;
    if (!searching && !activeBrandId) {
      setModels(null);
      return;
    }

    const controller = new AbortController();
    setModelsLoading(true);
    setModelError(null);

    const query = queryString(
      searching
        ? { search: debouncedSearch, limit: 40 }
        : { brandId: activeBrandId, limit: 60 },
    );

    api
      .get<{ models: ModelOption[] }>(`/api/catalog/models${query}`, controller.signal)
      .then((data) => setModels(data.models))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setModels([]);
        setModelError(
          error instanceof ApiClientError ? error.message : "Could not load devices.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setModelsLoading(false);
      });

    return () => controller.abort();
  }, [activeBrandId, debouncedSearch]);

  const isSearching = debouncedSearch.length >= 2;

  // ── Selected state ────────────────────────────────────────────────────────
  if (selectedModel) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-brand-600 bg-brand-50 p-4 dark:border-brand-500 dark:bg-brand-950/60">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Icon name="device" size={21} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              Your device
            </p>
            <p className="font-display text-base font-bold text-ink">{selectedModel.label}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconLeft="refresh"
          onClick={() => {
            onSelect(null);
            setSearch("");
            setActiveBrandId(null);
            window.setTimeout(() => searchRef.current?.focus(), 40);
          }}
        >
          Change device
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label htmlFor="device-search" className="sr-only">
          Search for your device by model name or number
        </label>
        <div className="relative">
          <Icon
            name="search"
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <input
            ref={searchRef}
            id="device-search"
            type="search"
            autoFocus={autoFocusSearch}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search: iPhone 15, Galaxy S24, Pixel 9…"
            autoComplete="off"
            aria-describedby="device-search-hint"
            className="h-14 w-full rounded-xl border border-line bg-surface pl-12 pr-11 text-base text-ink shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-line-strong focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-sunken hover:text-ink"
            >
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </div>
        <p id="device-search-hint" className="mt-2 text-sm text-ink-subtle">
          Type at least 2 characters, or pick a brand below.
        </p>
      </div>

      {/* Brand grid */}
      {!isSearching ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Choose your brand</p>

          {brandError ? (
            <Alert
              tone="danger"
              title="Could not load brands"
              action={
                <Button size="sm" variant="outline" onClick={() => void loadBrands()}>
                  Retry
                </Button>
              }
            >
              {brandError}
            </Alert>
          ) : brands === null ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-[4.5rem] rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {brands.map((brand) => {
                const active = brand.id === activeBrandId;
                return (
                  <li key={brand.id}>
                    <button
                      type="button"
                      onClick={() => setActiveBrandId(active ? null : brand.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex h-[4.5rem] w-full flex-col items-start justify-center gap-0.5 rounded-xl border-2 px-4 text-left transition-[border-color,background-color,box-shadow] duration-200",
                        active
                          ? "border-brand-600 bg-brand-50 shadow-md dark:border-brand-500 dark:bg-brand-950/60"
                          : "border-line bg-surface hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30",
                      )}
                    >
                      <span className="font-display text-sm font-bold text-ink">{brand.name}</span>
                      <span className="text-xs text-ink-subtle">
                        {brand.modelCount} {brand.modelCount === 1 ? "model" : "models"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* Models */}
      {isSearching || activeBrandId ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">
            {isSearching ? (
              <>
                Results for <span className="text-brand-700 dark:text-accent-300">“{debouncedSearch}”</span>
              </>
            ) : (
              "Select your model"
            )}
          </p>

          {modelError ? (
            <Alert tone="danger" title="Could not load devices" live>
              {modelError}
            </Alert>
          ) : modelsLoading ? (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : models && models.length > 0 ? (
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <li key={model.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(model)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-[border-color,background-color,box-shadow] duration-200 hover:border-brand-400 hover:bg-brand-50/60 hover:shadow-md dark:hover:border-brand-600 dark:hover:bg-brand-950/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{model.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-subtle">
                        {model.brandName}
                        {model.releaseYear ? <span aria-hidden="true">·</span> : null}
                        {model.releaseYear ?? null}
                      </span>
                    </span>
                    <Icon
                      name="chevron-right"
                      size={17}
                      className="shrink-0 text-ink-subtle transition-colors group-hover:text-brand-600"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="search"
              title="No devices matched"
              description={
                isSearching
                  ? `We could not find "${debouncedSearch}". Try the model number, or pick "Other" from the brand list and we will identify it during diagnosis.`
                  : "This brand has no active models right now."
              }
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setActiveBrandId(brands?.find((brand) => brand.slug === "other")?.id ?? null);
                  }}
                >
                  Use “Other” device
                </Button>
              }
            />
          )}
        </div>
      ) : null}

      {isSearching && models && models.length > 0 ? (
        <Badge tone="neutral" icon="info">
          {models.length} {models.length === 1 ? "device" : "devices"} found
        </Badge>
      ) : null}
    </div>
  );
}
