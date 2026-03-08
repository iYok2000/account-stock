"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ConfirmModal, FormModal } from "@/components/ui/Modal";
import StatusTag, { type InventoryStatus } from "@/components/ui/StatusTag";
import { useToast } from "@/contexts/ToastContext";
import { ButtonLoading } from "@/components/ui/Loading";
import { usePermissions, useUserContext } from "@/contexts/AuthContext";
import { loadInventorySnapshot } from "@/lib/inventory/import-snapshot";
import { useInventory } from "@/lib/hooks/use-api";

const LOW_STOCK_THRESHOLD = 5;
function getStatusFromQty(qty: number): InventoryStatus {
  if (qty <= 0) return "out_of_stock";
  if (qty <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  qty: number;
  status: InventoryStatus;
};

type QuickFilter = "all" | "low_stock" | "out_of_stock";

export default function InventoryContent() {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const { showSuccess } = useToast();
  const { can } = usePermissions();
  const user = useUserContext();
  const { data: inventoryData } = useInventory();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", sku: "" });

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const bySearch = term
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(term) ||
            i.sku.toLowerCase().includes(term)
        )
      : items;
    if (quickFilter === "all") return bySearch;
    return bySearch.filter((i) => i.status === quickFilter);
  }, [items, searchTerm, quickFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter((i) => i.status === "low_stock").length,
    outOfStock: items.filter((i) => i.status === "out_of_stock").length,
  }), [items]);

  const hasRows = filteredItems.length > 0;
  const allSelected = hasRows && selected.size === filteredItems.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredItems.map((i) => i.id)));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bootstrap inventory list from latest import snapshot (per shop), if present
  useEffect(() => {
    if (inventoryData?.data?.length) {
      const mapped = inventoryData.data.map((row, idx) => {
        const qty = Math.max(0, Math.round(row.quantity));
        return {
          id: row.id ? Number(idx + 1) : idx + 1,
          name: row.name || row.sku || "N/A",
          sku: row.sku || `SKU-${idx + 1}`,
          qty,
          status: getStatusFromQty(qty),
        };
      });
      setItems(mapped);
      return;
    }
    const snapshot = loadInventorySnapshot(user?.shopId);
    if (!snapshot || !snapshot.items) return;
    const mapped: InventoryItem[] = snapshot.items.map((row, idx) => {
      const qty = Math.max(0, Math.round(row.quantity));
      return {
        id: Number(idx + 1),
        name: row.product_name || row.sku_id,
        sku: row.sku_id,
        qty,
        status: getStatusFromQty(qty),
      };
    });
    setItems(mapped);
  }, [user?.shopId, inventoryData?.data]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = t("validationRequired");
    const sku = form.sku.trim();
    if (!sku) {
      err.sku = t("validationRequired");
    } else {
      const isDuplicate = items.some(
        (i) => i.id !== editItemId && i.sku.trim().toLowerCase() === sku.toLowerCase()
      );
      if (isDuplicate) err.sku = t("validationSkuDuplicate");
    }
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId == null) return;
    setSubmitLoading(true);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== deleteTargetId));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTargetId);
        return next;
      });
      setSubmitLoading(false);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      showSuccess(tCommon("saved"));
    }, 500);
  };

  const openEditModal = (row: InventoryItem) => {
    setFormErrors({});
    setForm({
      name: row.name,
      sku: row.sku,
    });
    setEditItemId(row.id);
    setEditItemOpen(true);
  };

  const closeItemModal = () => {
    setEditItemOpen(false);
    setEditItemId(null);
    setFormErrors({});
  };

  const handleEditItemSubmit = () => {
    if (!validate()) return;
    if (editItemId == null) return;
    setSubmitLoading(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editItemId
            ? {
                ...i,
                name: form.name.trim(),
                sku: form.sku.trim(),
              }
            : i
        )
      );
      setSubmitLoading(false);
      closeItemModal();
      setForm({ name: "", sku: "" });
      showSuccess(tCommon("saved"));
    }, 500);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Summary strip — ภาพรวมสต็อกทันที (ความต้องการขั้นต่ำของ seller) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-hover rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">{t("summaryTotal")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{stats.total}</p>
        </div>
        <div className="card-hover rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-800">{t("summaryLowStock")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900">{stats.lowStock}</p>
        </div>
        <div className="card-hover rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-800">{t("summaryOutOfStock")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-900">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {t("title")}
        </h1>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <input
          type="search"
          placeholder={t("search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-base min-w-[200px] max-w-xs flex-1 sm:flex-initial"
        />
      </div>

      {/* Quick filter chips — โฟกัสสต็อกต่ำ/หมดได้เร็ว */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all" as const, label: t("quickFilterAll") },
            { key: "low_stock" as const, label: t("quickFilterLowStock") },
            { key: "out_of_stock" as const, label: t("quickFilterOutOfStock") },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setQuickFilter(key)}
            className={
              quickFilter === key
                ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                : "rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state เป็นมิตร — ชวนเพิ่มสินค้าแรก */}
      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50/50 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-200 text-3xl">
            📦
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">{t("empty")}</h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-600">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="card content-table-wrapper overflow-hidden p-0!">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell w-12">
                    {hasRows && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="size-5 rounded border-neutral-300"
                        aria-label="Select all"
                      />
                    )}
                  </th>
                  <th className="table-header-cell text-left text-neutral-700">
                    {t("colName")}
                  </th>
                  <th className="table-header-cell text-left text-neutral-700">
                    {t("colSku")}
                  </th>
<th className="table-header-cell w-36 min-w-32 text-right text-neutral-700">
                  {t("colQty")}
                  </th>
                  <th className="table-header-cell text-left text-neutral-700">
                    {t("colStatus")}
                  </th>
                  <th className="table-header-cell w-32 text-right text-neutral-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {hasRows ? (
                  filteredItems.map((row) => (
                    <tr key={row.id} className="table-body-row">
                      <td className="table-cell">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                          className="size-5 rounded border-neutral-300"
                          aria-label={`Select row ${row.id}`}
                        />
                      </td>
                      <td className="table-cell text-neutral-900">{row.name}</td>
                      <td className="table-cell text-neutral-600">{row.sku}</td>
                      <td className="table-cell w-36 min-w-32 text-right align-middle text-neutral-900">
                        {row.qty}
                      </td>
                      <td className="table-cell">
                        <StatusTag type="inventory" status={row.status} />
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {can("inventory:update") && (
                            <button
                              type="button"
                              className="text-sm font-medium text-primary hover:underline"
                              onClick={() => openEditModal(row)}
                            >
                              {tCommon("edit")}
                            </button>
                          )}
                          {can("inventory:delete") && (
                            <button
                              type="button"
                              className="text-xs font-medium text-danger hover:underline md:text-sm"
                              onClick={() => {
                                setDeleteTargetId(row.id);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              {tCommon("delete")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="table-body-row">
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-neutral-500"
                    >
                      {t("noFilterMatch")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormModal open={editItemOpen} title={t("editItemFormTitle")} onClose={closeItemModal}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditItemSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {t("formName")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onBlur={() =>
                form.name.trim() === "" &&
                setFormErrors((e) => ({ ...e, name: t("validationRequired") }))
              }
              className="input-base"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-danger">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {t("formSku")}
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              className="input-base"
            />
            {formErrors.sku && (
              <p className="mt-2 text-sm text-danger">{formErrors.sku}</p>
            )}
          </div>
          <div className="mt-2 flex justify-end gap-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={closeItemModal}
            >
              {tCommon("cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={submitLoading}>
              {submitLoading ? <ButtonLoading /> : tCommon("save")}
            </button>
          </div>
        </form>
      </FormModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title={tCommon("delete")}
        message={t("confirmDeleteItem")}
        confirmLabel={tCommon("delete")}
        danger
        loading={submitLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
