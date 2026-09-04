"use client";

import { useEffect, useState } from "react";

import { Icon, serviceIcon } from "@/components/icons";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, Badge, Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Disclosure";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError, queryString } from "@/lib/api-client";
import {
  DEVICE_TIERS,
  PART_GRADES,
  PART_GRADE_META,
  type DeviceTier,
  type PartGrade,
} from "@/lib/constants";
import { formatDuration, formatMoney, formatWarranty } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/lib/errors";

/**
 * Catalogue and pricing management.
 *
 * Everything a customer can select — brands, models, services and prices — is
 * editable here, which is what makes the claim "an admin can change pricing
 * without touching code" literally true. Deletes that would orphan historical
 * bookings deactivate instead, and the API reports which happened.
 */

type Brand = {
  id: string;
  name: string;
  slug: string;
  logoKey: string | null;
  isActive: boolean;
  sortOrder: number;
  modelCount: number;
};

type Model = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  releaseYear: number | null;
  isActive: boolean;
  brandId: string;
  brandName: string;
  label: string;
};

type Service = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  symptoms: string[];
  iconKey: string;
  defaultDurationMinutes: number;
  defaultWarrantyMonths: number;
  isActive: boolean;
  sortOrder: number;
};

type PriceRow = {
  id: string;
  price: number;
  compareAtPrice: number | null;
  partGrade: PartGrade;
  durationMinutes: number;
  warrantyMonths: number;
  isAvailable: boolean;
  modelId: string;
  serviceId: string;
  modelName: string;
  brandName: string;
  brandSlug: string;
  serviceName: string;
  serviceSlug: string;
  serviceIconKey: string;
};

type PriceResult = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: PriceRow[];
};

export function CatalogManager({ canWrite }: { canWrite: boolean }) {
  return (
    <Tabs
      label="Catalogue sections"
      items={[
        { id: "prices", label: "Prices", content: <PricesPanel canWrite={canWrite} /> },
        { id: "brands", label: "Brands", content: <BrandsPanel canWrite={canWrite} /> },
        { id: "models", label: "Devices", content: <ModelsPanel canWrite={canWrite} /> },
        { id: "services", label: "Services", content: <ServicesPanel canWrite={canWrite} /> },
      ]}
    />
  );
}

// ── Prices ──────────────────────────────────────────────────────────────────

function PricesPanel({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const [result, setResult] = useState<PriceResult | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [brand, setBrand] = useState("");
  const [service, setService] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<PriceRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState("-10");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ brands: Brand[] }>("/api/admin/brands"),
      api.get<{ services: Service[] }>("/api/admin/services"),
    ])
      .then(([brandData, serviceData]) => {
        setBrands(brandData.brands);
        setServices(serviceData.services);
      })
      .catch(() => {
        // Filter dropdowns are a convenience; the table still loads without them.
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get<PriceResult>(
        `/api/admin/prices${queryString({
          brand: brand || undefined,
          service: service || undefined,
          search: debouncedSearch || undefined,
          page,
          pageSize: 25,
        })}`,
        controller.signal,
      )
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResult(null);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load prices.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [brand, service, debouncedSearch, page, reloadKey]);

  const applyBulk = async () => {
    if (!result || result.items.length === 0) return;
    setBusy(true);
    try {
      const data = await api.post<{ updated: number }>("/api/admin/prices/bulk", {
        ids: result.items.map((item) => item.id),
        adjustPercent: Number(bulkPercent),
      });
      toast.success("Prices updated", `${data.updated} prices adjusted by ${bulkPercent}%.`);
      setBulkOpen(false);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      toast.error(
        "Bulk update failed",
        cause instanceof ApiClientError ? cause.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label htmlFor="price-admin-search" className="sr-only">
              Search prices
            </label>
            <Input
              id="price-admin-search"
              type="search"
              iconLeft="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search device or service…"
            />
          </div>
          <div className="lg:col-span-3">
            <label htmlFor="price-admin-brand" className="sr-only">
              Filter by brand
            </label>
            <Select
              id="price-admin-brand"
              value={brand}
              onChange={(event) => {
                setBrand(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All brands</option>
              {brands.map((entry) => (
                <option key={entry.id} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-4">
            <label htmlFor="price-admin-service" className="sr-only">
              Filter by service
            </label>
            <Select
              id="price-admin-service"
              value={service}
              onChange={(event) => {
                setService(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All services</option>
              {services.map((entry) => (
                <option key={entry.id} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {canWrite && result && result.items.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-sm text-ink-subtle">
              {result.total} price{result.total === 1 ? "" : "s"} match these filters
            </p>
            <Button size="sm" variant="outline" iconLeft="tag" onClick={() => setBulkOpen(true)}>
              Adjust this page by %
            </Button>
          </div>
        ) : null}
      </Card>

      {error ? (
        <Alert
          tone="danger"
          title="Could not load prices"
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
          <span className="sr-only">Loading prices</span>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <>
          <Card className={cn("overflow-hidden", loading && "opacity-60")}>
            <div className="scroll-x">
              <table className="w-full min-w-[52rem] text-sm">
                <caption className="sr-only">Repair prices</caption>
                <thead>
                  <tr className="border-b border-line bg-sunken text-left">
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Device</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Service</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Grade</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Time</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-ink">Warranty</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">Price</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {result.items.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-sunken">
                      <th scope="row" className="px-4 py-3 text-left">
                        <span className="block font-medium text-ink">{row.modelName}</span>
                        <span className="block text-xs font-normal text-ink-subtle">
                          {row.brandName}
                        </span>
                      </th>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-ink-muted">
                          <Icon name={serviceIcon(row.serviceIconKey)} size={15} />
                          {row.serviceName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            row.partGrade === "ORIGINAL"
                              ? "accent"
                              : row.partGrade === "PREMIUM"
                                ? "brand"
                                : "neutral"
                          }
                          size="sm"
                        >
                          {PART_GRADE_META[row.partGrade].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {formatDuration(row.durationMinutes)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {formatWarranty(row.warrantyMonths)}
                      </td>
                      <td className="tabular px-4 py-3 text-right font-semibold text-ink">
                        {row.price === 0 ? "Free" : formatMoney(row.price)}
                        {!row.isAvailable ? (
                          <span className="ml-2 text-xs font-normal text-danger-600">disabled</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canWrite ? (
                          <IconButton
                            icon="edit"
                            label={`Edit ${row.modelName} ${row.serviceName} price`}
                            size="sm"
                            onClick={() => setEditing(row)}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            onPageChange={setPage}
            itemLabel="prices"
          />
        </>
      ) : (
        <EmptyState
          icon="tag"
          title="No prices match"
          description="Adjust the filters, or add prices for a newly created device."
        />
      )}

      {/* Edit price */}
      <PriceEditModal
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setReloadKey((key) => key + 1);
        }}
      />

      {/* Bulk adjust */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Adjust prices in bulk"
        description={`Applies a percentage change to all ${result?.items.length ?? 0} prices on this page.`}
        size="sm"
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={applyBulk} loading={busy} loadingLabel="Applying…">
              Apply adjustment
            </Button>
          </>
        }
      >
        <Field
          label="Adjustment"
          htmlFor="bulk-percent"
          required
          hint="Negative reduces prices, e.g. −10 for a 10% cut. Results are rounded to the nearest ₹10."
        >
          <Input
            id="bulk-percent"
            type="number"
            min={-90}
            max={300}
            value={bulkPercent}
            onChange={(event) => setBulkPercent(event.target.value)}
            data-autofocus
          />
        </Field>
      </Modal>
    </div>
  );
}

function PriceEditModal({
  row,
  onClose,
  onSaved,
}: {
  row: PriceRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [warranty, setWarranty] = useState("");
  const [available, setAvailable] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!row) return;
    setPrice(String(row.price));
    setDuration(String(row.durationMinutes));
    setWarranty(String(row.warrantyMonths));
    setAvailable(row.isAvailable);
    setErrors({});
  }, [row]);

  const save = async () => {
    if (!row) return;
    setBusy(true);
    setErrors({});
    try {
      await api.patch(`/api/admin/prices/${row.id}`, {
        price: Number(price),
        durationMinutes: Number(duration),
        warrantyMonths: Number(warranty),
        isAvailable: available,
      });
      toast.success("Price updated", `${row.modelName} · ${row.serviceName}`);
      onSaved();
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        if (cause.fieldErrors) setErrors(cause.fieldErrors);
        toast.error("Could not save price", cause.message);
      } else {
        toast.error("Could not save price", "Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={row !== null}
      onClose={onClose}
      title="Edit price"
      description={row ? `${row.brandName} ${row.modelName} · ${row.serviceName}` : undefined}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy} loadingLabel="Saving…">
            Save price
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {row ? (
          <Badge tone="brand" size="sm">
            {PART_GRADE_META[row.partGrade].label}
          </Badge>
        ) : null}

        <Field label="Price" htmlFor="edit-price" required hint="Whole rupees. 0 means free." error={errors.price}>
          <Input
            id="edit-price"
            type="number"
            min={0}
            prefix="₹"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            hasError={Boolean(errors.price)}
            data-autofocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Repair time"
            htmlFor="edit-duration"
            required
            hint="In minutes."
            error={errors.durationMinutes}
          >
            <Input
              id="edit-duration"
              type="number"
              min={5}
              max={2880}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              hasError={Boolean(errors.durationMinutes)}
            />
          </Field>

          <Field
            label="Warranty"
            htmlFor="edit-warranty"
            required
            hint="In months."
            error={errors.warrantyMonths}
          >
            <Input
              id="edit-warranty"
              type="number"
              min={0}
              max={36}
              value={warranty}
              onChange={(event) => setWarranty(event.target.value)}
              hasError={Boolean(errors.warrantyMonths)}
            />
          </Field>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={available}
            onChange={(event) => setAvailable(event.target.checked)}
            className="mt-0.5 h-5 w-5 rounded-md border-2 border-line-strong accent-brand-700"
          />
          <span className="text-sm">
            <span className="font-medium text-ink">Available for booking</span>
            <span className="mt-0.5 block text-ink-subtle">
              Uncheck to hide this option from customers without deleting the price.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
}

// ── Brands ──────────────────────────────────────────────────────────────────

function BrandsPanel({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<Brand | null>(null);

  useEffect(() => {
    setError(null);
    api
      .get<{ brands: Brand[] }>("/api/admin/brands")
      .then((data) => setBrands(data.brands))
      .catch((cause: unknown) => {
        setBrands([]);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load brands.");
      });
  }, [reloadKey]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setName(brand.name);
    setErrors({});
    setFormOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      if (editing) {
        await api.patch(`/api/admin/brands/${editing.id}`, { name });
        toast.success("Brand updated");
      } else {
        await api.post("/api/admin/brands", { name, isActive: true, sortOrder: 50 });
        toast.success("Brand created", `${name} is now selectable.`);
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        if (cause.fieldErrors) setErrors(cause.fieldErrors);
        toast.error("Could not save brand", cause.message);
      } else {
        toast.error("Could not save brand", "Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (brand: Brand) => {
    try {
      await api.patch(`/api/admin/brands/${brand.id}`, { isActive: !brand.isActive });
      toast.success(brand.isActive ? "Brand hidden" : "Brand enabled");
      setReloadKey((key) => key + 1);
    } catch (cause) {
      toast.error(
        "Could not update brand",
        cause instanceof ApiClientError ? cause.message : "Please try again.",
      );
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const data = await api.delete<{ deactivated: boolean }>(
        `/api/admin/brands/${confirmDelete.id}`,
      );
      toast.success(
        data.deactivated ? "Brand deactivated" : "Brand deleted",
        data.deactivated
          ? "It has models attached, so it was hidden rather than removed."
          : undefined,
      );
      setConfirmDelete(null);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      toast.error(
        "Could not delete brand",
        cause instanceof ApiClientError ? cause.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {canWrite ? (
        <div className="flex justify-end">
          <Button size="sm" iconLeft="plus" onClick={openCreate}>
            Add brand
          </Button>
        </div>
      ) : null}

      {error ? (
        <Alert tone="danger" title="Could not load brands" live>
          {error}
        </Alert>
      ) : brands === null ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">Loading brands</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <EmptyState icon="package" title="No brands yet" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Card className={cn("p-4", !brand.isActive && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-ink">{brand.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {brand.modelCount} model{brand.modelCount === 1 ? "" : "s"} ·{" "}
                      <span className="font-mono">{brand.slug}</span>
                    </p>
                  </div>
                  <Badge tone={brand.isActive ? "success" : "neutral"} size="sm">
                    {brand.isActive ? "Active" : "Hidden"}
                  </Badge>
                </div>

                {canWrite ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    <Button size="sm" variant="ghost" iconLeft="edit" onClick={() => openEdit(brand)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft={brand.isActive ? "eye-off" : "eye"}
                      onClick={() => toggleActive(brand)}
                    >
                      {brand.isActive ? "Hide" : "Show"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft="trash"
                      className="text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/40"
                      onClick={() => setConfirmDelete(brand)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit brand" : "Add brand"}
        size="sm"
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy} loadingLabel="Saving…">
              {editing ? "Save brand" : "Create brand"}
            </Button>
          </>
        }
      >
        <Field label="Brand name" htmlFor="brand-name" required error={errors.name}>
          <Input
            id="brand-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            hasError={Boolean(errors.name)}
            placeholder="e.g. Asus"
            data-autofocus
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${confirmDelete?.name ?? "brand"}?`}
        message={
          confirmDelete && confirmDelete.modelCount > 0
            ? `${confirmDelete.name} has ${confirmDelete.modelCount} models. It will be hidden from customers rather than deleted, so existing bookings keep working.`
            : "This brand has no models and will be permanently deleted."
        }
        confirmLabel="Delete brand"
      />
    </div>
  );
}

// ── Models ──────────────────────────────────────────────────────────────────

function ModelsPanel({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const [models, setModels] = useState<Model[] | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandFilter, setBrandFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [form, setForm] = useState({ brandId: "", name: "", tier: "MID" as DeviceTier, releaseYear: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const [cloneTarget, setCloneTarget] = useState<Model | null>(null);
  const [cloneSource, setCloneSource] = useState("");

  useEffect(() => {
    api
      .get<{ brands: Brand[] }>("/api/admin/brands")
      .then((data) => setBrands(data.brands))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    api
      .get<{ models: Model[] }>(
        `/api/admin/models${queryString({
          brand: brandFilter || undefined,
          search: search.trim() || undefined,
          limit: 100,
        })}`,
        controller.signal,
      )
      .then((data) => setModels(data.models))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setModels([]);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load devices.");
      });

    return () => controller.abort();
  }, [brandFilter, search, reloadKey]);

  const openCreate = () => {
    setEditing(null);
    setForm({ brandId: brands[0]?.id ?? "", name: "", tier: "MID", releaseYear: "" });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (model: Model) => {
    setEditing(model);
    setForm({
      brandId: model.brandId,
      name: model.name,
      tier: model.tier as DeviceTier,
      releaseYear: model.releaseYear ? String(model.releaseYear) : "",
    });
    setErrors({});
    setFormOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setErrors({});
    const payload = {
      brandId: form.brandId,
      name: form.name,
      tier: form.tier,
      ...(form.releaseYear ? { releaseYear: Number(form.releaseYear) } : {}),
    };
    try {
      if (editing) {
        await api.patch(`/api/admin/models/${editing.id}`, payload);
        toast.success("Device updated");
      } else {
        await api.post("/api/admin/models", { ...payload, isActive: true, sortOrder: 0 });
        toast.success(
          "Device created",
          "Add prices for it, or copy a price book from a similar device.",
        );
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        if (cause.fieldErrors) setErrors(cause.fieldErrors);
        toast.error("Could not save device", cause.message);
      } else {
        toast.error("Could not save device", "Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const clonePrices = async () => {
    if (!cloneTarget || !cloneSource) return;
    setBusy(true);
    try {
      const data = await api.post<{ created: number; skipped: number }>(
        `/api/admin/models/${cloneTarget.id}/clone-prices`,
        { sourceModelId: cloneSource },
      );
      toast.success(
        "Prices copied",
        `${data.created} prices added${data.skipped > 0 ? `, ${data.skipped} already existed` : ""}.`,
      );
      setCloneTarget(null);
      setCloneSource("");
    } catch (cause) {
      toast.error(
        "Could not copy prices",
        cause instanceof ApiClientError ? cause.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-7">
            <label htmlFor="model-search" className="sr-only">
              Search devices
            </label>
            <Input
              id="model-search"
              type="search"
              iconLeft="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search devices…"
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="model-brand-filter" className="sr-only">
              Filter by brand
            </label>
            <Select
              id="model-brand-filter"
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
            >
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          {canWrite ? (
            <div className="sm:col-span-2">
              <Button size="md" fullWidth iconLeft="plus" onClick={openCreate}>
                Add
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {error ? (
        <Alert tone="danger" title="Could not load devices" live>
          {error}
        </Alert>
      ) : models === null ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">Loading devices</span>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState icon="device" title="No devices match" />
      ) : (
        <Card className="overflow-hidden">
          <div className="scroll-x">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Device models</caption>
              <thead>
                <tr className="border-b border-line bg-sunken text-left">
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">Model</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">Brand</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">Tier</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">Year</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {models.map((model) => (
                  <tr key={model.id} className={cn("transition-colors hover:bg-sunken", !model.isActive && "opacity-60")}>
                    <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                      {model.name}
                    </th>
                    <td className="px-4 py-3 text-ink-muted">{model.brandName}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral" size="sm">
                        {model.tier}
                      </Badge>
                    </td>
                    <td className="tabular px-4 py-3 text-ink-muted">{model.releaseYear ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={model.isActive ? "success" : "neutral"} size="sm">
                        {model.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canWrite ? (
                        <div className="flex justify-end gap-1">
                          <IconButton
                            icon="copy"
                            label={`Copy prices to ${model.name}`}
                            size="sm"
                            onClick={() => setCloneTarget(model)}
                          />
                          <IconButton
                            icon="edit"
                            label={`Edit ${model.name}`}
                            size="sm"
                            onClick={() => openEdit(model)}
                          />
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / edit model */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit device" : "Add device"}
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy} loadingLabel="Saving…">
              {editing ? "Save device" : "Create device"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Brand" htmlFor="model-brand" required error={errors.brandId}>
            <Select
              id="model-brand"
              value={form.brandId}
              onChange={(event) => setForm({ ...form, brandId: event.target.value })}
              hasError={Boolean(errors.brandId)}
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Model name" htmlFor="model-name" required error={errors.name}>
            <Input
              id="model-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              hasError={Boolean(errors.name)}
              placeholder="e.g. Zenfone 11"
              data-autofocus
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Price tier"
              htmlFor="model-tier"
              required
              hint="Used to estimate a price when no explicit one exists."
            >
              <Select
                id="model-tier"
                value={form.tier}
                onChange={(event) => setForm({ ...form, tier: event.target.value as DeviceTier })}
              >
                {DEVICE_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Release year" htmlFor="model-year" error={errors.releaseYear}>
              <Input
                id="model-year"
                type="number"
                min={2005}
                max={new Date().getFullYear() + 1}
                value={form.releaseYear}
                onChange={(event) => setForm({ ...form, releaseYear: event.target.value })}
                hasError={Boolean(errors.releaseYear)}
                placeholder="2024"
              />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Clone prices */}
      <Modal
        open={cloneTarget !== null}
        onClose={() => setCloneTarget(null)}
        title="Copy prices from another device"
        description={
          cloneTarget
            ? `Copies every price, duration and warranty onto ${cloneTarget.name}. Existing prices are left untouched.`
            : undefined
        }
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setCloneTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={clonePrices} loading={busy} loadingLabel="Copying…" disabled={!cloneSource}>
              Copy prices
            </Button>
          </>
        }
      >
        <Field label="Copy prices from" htmlFor="clone-source" required>
          <Select
            id="clone-source"
            value={cloneSource}
            onChange={(event) => setCloneSource(event.target.value)}
            data-autofocus
          >
            <option value="">Choose a device…</option>
            {(models ?? [])
              .filter((model) => model.id !== cloneTarget?.id)
              .map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}

// ── Services ────────────────────────────────────────────────────────────────

function ServicesPanel({ canWrite }: { canWrite: boolean }) {
  const toast = useToast();
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    defaultDurationMinutes: "60",
    defaultWarrantyMonths: "6",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
    api
      .get<{ services: Service[] }>("/api/admin/services")
      .then((data) => setServices(data.services))
      .catch((cause: unknown) => {
        setServices([]);
        setError(cause instanceof ApiClientError ? cause.message : "Could not load services.");
      });
  }, [reloadKey]);

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      shortDescription: service.shortDescription,
      description: service.description,
      defaultDurationMinutes: String(service.defaultDurationMinutes),
      defaultWarrantyMonths: String(service.defaultWarrantyMonths),
    });
    setErrors({});
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErrors({});
    try {
      await api.patch(`/api/admin/services/${editing.id}`, {
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        defaultDurationMinutes: Number(form.defaultDurationMinutes),
        defaultWarrantyMonths: Number(form.defaultWarrantyMonths),
      });
      toast.success("Service updated");
      setEditing(null);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        if (cause.fieldErrors) setErrors(cause.fieldErrors);
        toast.error("Could not save service", cause.message);
      } else {
        toast.error("Could not save service", "Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      await api.patch(`/api/admin/services/${service.id}`, { isActive: !service.isActive });
      toast.success(service.isActive ? "Service disabled" : "Service enabled");
      setReloadKey((key) => key + 1);
    } catch (cause) {
      toast.error(
        "Could not update service",
        cause instanceof ApiClientError ? cause.message : "Please try again.",
      );
    }
  };

  return (
    <div className="space-y-5">
      {error ? (
        <Alert tone="danger" title="Could not load services" live>
          {error}
        </Alert>
      ) : services === null ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <span className="sr-only">Loading services</span>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {services.map((service) => (
            <li key={service.id}>
              <Card className={cn("p-4", !service.isActive && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                    <Icon name={serviceIcon(service.iconKey)} size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-ink">{service.name}</h3>
                      <Badge tone={service.isActive ? "success" : "neutral"} size="sm">
                        {service.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-ink-muted">
                      {service.shortDescription}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-ink-subtle">
                      <span>{formatDuration(service.defaultDurationMinutes)}</span>
                      <span>{formatWarranty(service.defaultWarrantyMonths)}</span>
                    </p>
                  </div>
                </div>

                {canWrite ? (
                  <div className="mt-3 flex gap-2 border-t border-line pt-3">
                    <Button size="sm" variant="ghost" iconLeft="edit" onClick={() => openEdit(service)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft={service.isActive ? "eye-off" : "eye"}
                      onClick={() => toggleActive(service)}
                    >
                      {service.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit service"
        size="lg"
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy} loadingLabel="Saving…">
              Save service
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Service name" htmlFor="service-name" required error={errors.name}>
            <Input
              id="service-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              hasError={Boolean(errors.name)}
              data-autofocus
            />
          </Field>

          <Field
            label="Short description"
            htmlFor="service-short"
            required
            hint="One line, shown on cards and in the picker."
            error={errors.shortDescription}
          >
            <Input
              id="service-short"
              value={form.shortDescription}
              onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
              hasError={Boolean(errors.shortDescription)}
            />
          </Field>

          <Field
            label="Full description"
            htmlFor="service-description"
            required
            hint="Shown on the service page."
            error={errors.description}
          >
            <Textarea
              id="service-description"
              rows={5}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              hasError={Boolean(errors.description)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default repair time"
              htmlFor="service-duration"
              required
              hint="In minutes."
              error={errors.defaultDurationMinutes}
            >
              <Input
                id="service-duration"
                type="number"
                min={5}
                max={2880}
                value={form.defaultDurationMinutes}
                onChange={(event) =>
                  setForm({ ...form, defaultDurationMinutes: event.target.value })
                }
                hasError={Boolean(errors.defaultDurationMinutes)}
              />
            </Field>

            <Field
              label="Default warranty"
              htmlFor="service-warranty"
              required
              hint="In months."
              error={errors.defaultWarrantyMonths}
            >
              <Input
                id="service-warranty"
                type="number"
                min={0}
                max={36}
                value={form.defaultWarrantyMonths}
                onChange={(event) => setForm({ ...form, defaultWarrantyMonths: event.target.value })}
                hasError={Boolean(errors.defaultWarrantyMonths)}
              />
            </Field>
          </div>

          <Alert tone="info">
            These defaults apply to newly created prices. Existing prices keep their own values —
            edit them on the Prices tab.
          </Alert>
        </div>
      </Modal>
    </div>
  );
}
