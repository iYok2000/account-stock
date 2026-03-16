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
import {
  Package,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

// Package ยังใช้ใน empty state

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
type ViewMode = "card" | "table";

const STATUS_ACCENT: Record<InventoryStatus, string> = {
  in_stock: "border-t-green-400",
  low_stock: "border-t-amber-400",
  out_of_stock: "border-t-red-400",
};
const STATUS_QTY_COLOR: Record<InventoryStatus, string> = {
  in_stock: "text-green-700",
  low_stock: "text-amber-700",
  out_of_stock: "text-red-600",
};
const STATUS_ICON_COLOR: Record<InventoryStatus, string> = {
  in_stock: "text-green-400",
  low_stock: "text-amber-400",
  out_of_stock: "text-red-300",
};
const STATUS_ICON_BG: Record<InventoryStatus, string> = {
  in_stock: "bg-green-50",
  low_stock: "bg-amber-50",
  out_of_stock: "bg-red-50",
};

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
  const [viewMode, setViewMode] = useState<ViewMode>("card");
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

  const stats = useMemo(
    () => ({
      total: items.length,
      lowStock: items.filter((i) => i.status === "low_stock").length,
      outOfStock: items.filter((i) => i.status === "out_of_stock").length,
    }),
    [items]
  );

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
        (i) =>
          i.id !== editItemId &&
          i.sku.trim().toLowerCase() === sku.toLowerCase()
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
    setForm({ name: row.name, sku: row.sku });
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
            ? { ...i, name: form.name.trim(), sku: form.sku.trim() }
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
    <div className="flex flex-col gap-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-neutral-500">{t("summaryTotal")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-700">{t("summaryLowStock")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900">
            {stats.lowStock}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 shadow-sm">
          <p className="text-xs font-medium text-red-700">{t("summaryOutOfStock")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-900">
            {stats.outOfStock}
          </p>
        </div>
      </div>

      {/* Toolbar: Title + Search + View Toggle + Add button */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 mr-auto">
          {t("title")}
        </h1>

        <input
          type="search"
          placeholder={t("search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-base w-full sm:w-56"
        />

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            title="Card view"
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              viewMode === "card"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            title="Table view"
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              viewMode === "table"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {can("inventory:create") && (
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              setForm({ name: "", sku: "" });
              setFormErrors({});
              setEditItemId(null);
              setEditItemOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>{t("addItem")}</span>
          </button>
        )}
      </div>

      {/* Quick Filter Chips */}
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
                ? "rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                : "rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 &&
        (can("inventory:update") || can("inventory:export")) && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium text-primary">
              {selected.size} รายการที่เลือก
            </span>
            <div className="ml-auto flex gap-2">
              {can("inventory:update") && (
                <button
                  type="button"
                  disabled
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-500 disabled:opacity-50"
                >
                  {t("bulkReorder")}
                </button>
              )}
              {can("inventory:export") && (
                <button
                  type="button"
                  disabled
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-500 disabled:opacity-50"
                >
                  {t("bulkExport")}
                </button>
              )}
            </div>
          </div>
        )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-200">
            <Package className="h-8 w-8 text-neutral-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800">{t("empty")}</h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">{t("emptyDescription")}</p>
          {can("inventory:create") && (
            <button
              type="button"
              className="btn-primary mt-6 flex items-center gap-2"
              onClick={() => {
                setForm({ name: "", sku: "" });
                setFormErrors({});
                setEditItemId(null);
                setEditItemOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t("addFirstProduct")}
            </button>
          )}
        </div>
      ) : viewMode === "card" ? (
        /* ─────────── CARD GRID VIEW ─────────── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {hasRows ? (
            filteredItems.map((row) => {
              const isSelected = selected.has(row.id);
              return (
                <div
                  key={row.id}
                  className={`group flex flex-col rounded-xl border border-t-4 bg-white shadow-sm transition-all hover:shadow-md ${STATUS_ACCENT[row.status]} ${
                    isSelected
                      ? "border-primary/40 ring-2 ring-primary ring-offset-1"
                      : "border-neutral-200"
                  }`}
                >
                  {/* Qty hero — ตัวเลขใหญ่สุด ดูก่อน */}
                  <div
                    className={`mx-3 mt-3 rounded-lg px-3 py-3 ${STATUS_ICON_BG[row.status]}`}
                  >
                    <div className="flex items-end justify-between">
                      <div className="flex items-baseline gap-1 leading-none">
                        <span
                          className={`text-3xl font-bold tabular-nums ${STATUS_QTY_COLOR[row.status]}`}
                        >
                          {row.qty}
                        </span>
                        <span className="text-xs text-neutral-400">ชิ้น</span>
                      </div>
                      <StatusTag type="inventory" status={row.status} />
                    </div>
                  </div>

                  {/* Info + footer */}
                  <div className="flex flex-1 flex-col justify-between px-3 pt-2 pb-2">
                    {/* ชื่อ + SKU */}
                    <div>
                      <p
                        className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-800"
                        title={row.name}
                      >
                        {row.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-400">
                        {row.sku}
                      </p>
                    </div>

                    {/* Footer: checkbox + actions */}
                    <div className="mt-2 flex items-center justify-between">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(row.id)}
                        className="size-4 cursor-pointer rounded border-neutral-300 accent-primary"
                        aria-label={`เลือก ${row.name}`}
                      />
                      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {can("inventory:update") && (
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-primary"
                            title={tCommon("edit")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {can("inventory:delete") && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTargetId(row.id);
                              setDeleteConfirmOpen(true);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500"
                            title={tCommon("delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-sm text-neutral-500">
              {t("noFilterMatch")}
            </div>
          )}
        </div>
      ) : (
        /* ─────────── TABLE VIEW ─────────── */
        <div className="card content-table-wrapper overflow-hidden p-0!">
          {/* Select-all bar */}
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="size-4 rounded border-neutral-300 accent-primary"
              aria-label="Select all"
            />
            <span className="text-xs text-neutral-500">
              {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell w-10" />
                  <th className="table-header-cell text-left text-neutral-700">{t("colName")}</th>
                  <th className="table-header-cell text-left text-neutral-700">{t("colSku")}</th>
                  <th className="table-header-cell w-32 text-right text-neutral-700">{t("colQty")}</th>
                  <th className="table-header-cell text-left text-neutral-700">{t("colStatus")}</th>
                  <th className="table-header-cell w-28 text-right text-neutral-700">Actions</th>
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
                          className="size-4 rounded border-neutral-300 accent-primary"
                          aria-label={`Select row ${row.id}`}
                        />
                      </td>
                      <td className="table-cell font-medium text-neutral-900">{row.name}</td>
                      <td className="table-cell font-mono text-xs text-neutral-500">{row.sku}</td>
                      <td className="table-cell w-32 text-right tabular-nums text-neutral-900">
                        {row.qty}
                      </td>
                      <td className="table-cell">
                        <StatusTag type="inventory" status={row.status} />
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
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
                              className="text-sm font-medium text-danger hover:underline"
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
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-neutral-500">
                      {t("noFilterMatch")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <FormModal
        open={editItemOpen}
        title={editItemId ? t("editItemFormTitle") : t("addItemFormTitle")}
        onClose={closeItemModal}
      >
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
              <p className="mt-1 text-sm text-danger">{formErrors.sku}</p>
            )}
          </div>
          <div className="mt-2 flex justify-end gap-4">
            <button type="button" className="btn-secondary" onClick={closeItemModal}>
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
