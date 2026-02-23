"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ConfirmModal, FormModal } from "@/components/ui/Modal";
import StatusTag, { type InventoryStatus } from "@/components/ui/StatusTag";
import { useToast } from "@/contexts/ToastContext";
import { ButtonLoading } from "@/components/ui/Loading";
import NumberInput from "@/components/ui/NumberInput";
import { usePermissions } from "@/contexts/AuthContext";

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
  const tStatus = useTranslations("status");
  const { showSuccess } = useToast();
  const { can } = usePermissions();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  /** Draft qty per row while editing; commit on blur. Only show draft when that row is focused. */
  const [editingQty, setEditingQty] = useState<Record<number, string>>({});
  const [editingQtyRowId, setEditingQtyRowId] = useState<number | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", sku: "", qty: "", status: "in_stock" as InventoryStatus });

  const filteredItems = useMemo(() => {
    if (quickFilter === "all") return items;
    return items.filter((i) => i.status === quickFilter);
  }, [items, quickFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter((i) => i.status === "low_stock").length,
    outOfStock: items.filter((i) => i.status === "out_of_stock").length,
  }), [items]);

  const hasRows = filteredItems.length > 0;
  const allSelected = hasRows && selected.size === filteredItems.length;
  const someSelected = selected.size > 0;

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

  const updateItemQty = (id: number, qty: number) => {
    const clamped = Math.max(0, qty);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: clamped, status: getStatusFromQty(clamped) } : i
      )
    );
    setEditingQty((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    showSuccess(tCommon("saved"));
  };

  /** แสดง draft เมื่อมี; ไม่มี draft แสดง row.qty (กดบันทึกก่อนถึงจะ commit จริง) */
  const getRowQtyDisplay = (row: InventoryItem) => {
    if (editingQty[row.id] !== undefined) return editingQty[row.id];
    return String(row.qty);
  };

  const hasUnsavedQty = (row: InventoryItem) => {
    if (editingQty[row.id] === undefined) return false;
    const parsed = Math.max(0, parseInt(editingQty[row.id], 10) || 0);
    return parsed !== row.qty;
  };

  /** ตอนแก้จำนวน → เช็ค checkbox แถวนั้นอัตโนมัติ (บันทึกจะอิงจากที่เลือก) */
  const handleRowQtyChange = (rowId: number, value: string) => {
    setEditingQty((prev) => ({ ...prev, [rowId]: value }));
    setSelected((prev) => new Set(prev).add(rowId));
  };

  const handleRowQtyFocus = (rowId: number) => {
    setEditingQtyRowId(rowId);
  };

  /** Blur ไม่ commit — ต้องกดบันทึกหรือยกเลิกที่แถบรวม */
  const handleRowQtyBlur = () => {
    setEditingQtyRowId(null);
  };

  /** รายการที่เลือกและมีค่าแก้ (จริงๆ ต่างจากเดิม) — บันทึกเฉพาะพวกนี้, ค่าเดิมไม่ส่ง */
  const selectedRowsWithUnsaved = useMemo(
    () => filteredItems.filter((row) => selected.has(row.id) && hasUnsavedQty(row)),
    [filteredItems, selected, editingQty, items]
  );
  const hasAnyUnsavedSelected = selectedRowsWithUnsaved.length > 0;

  /** บันทึกรวม: commit เฉพาะแถวที่เลือกและมีค่าเปลี่ยน (ค่าเดิมไม่ส่ง) */
  const handleSaveEdits = () => {
    selectedRowsWithUnsaved.forEach((row) => {
      const raw = editingQty[row.id] ?? String(row.qty);
      const qty = Math.max(0, parseInt(raw, 10) || 0);
      updateItemQty(row.id, qty);
    });
    setSelected((prev) => {
      const next = new Set(prev);
      selectedRowsWithUnsaved.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  /** ยกเลิกรวม: ทิ้ง draft และเอาแถวที่แก้ออกจาก selection */
  const handleCancelEdits = () => {
    const idsToClear = new Set(selectedRowsWithUnsaved.map((r) => r.id));
    setEditingQty((prev) => {
      const next = { ...prev };
      idsToClear.forEach((id) => delete next[id]);
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      idsToClear.forEach((id) => next.delete(id));
      return next;
    });
    setEditingQtyRowId(null);
  };

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
    const n = parseInt(form.qty, 10);
    if (Number.isNaN(n) || n < 0) err.qty = t("validationRequired");
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleAddItemSubmit = () => {
    if (!validate()) return;
    const qty = Math.max(0, parseInt(form.qty, 10) || 0);
    setSubmitLoading(true);
    setTimeout(() => {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: form.name.trim(),
          sku: form.sku.trim(),
          qty,
          status: getStatusFromQty(qty),
        },
      ]);
      setSubmitLoading(false);
      setAddItemOpen(false);
      setForm({ name: "", sku: "", qty: "", status: "in_stock" });
      setFormErrors({});
      showSuccess(tCommon("saved"));
    }, 500);
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

  const openAddModal = () => {
    setFormErrors({});
    setForm({ name: "", sku: "", qty: "", status: "in_stock" });
    setAddItemOpen(true);
    setEditItemOpen(false);
    setEditItemId(null);
  };

  const openEditModal = (row: InventoryItem) => {
    setFormErrors({});
    setForm({
      name: row.name,
      sku: row.sku,
      qty: String(row.qty),
      status: row.status,
    });
    setEditItemId(row.id);
    setEditItemOpen(true);
    setAddItemOpen(false);
  };

  const closeItemModal = () => {
    setAddItemOpen(false);
    setEditItemOpen(false);
    setEditItemId(null);
    setFormErrors({});
  };

  const handleEditItemSubmit = () => {
    if (!validate()) return;
    if (editItemId == null) return;
    const qty = Math.max(0, parseInt(form.qty, 10) || 0);
    setSubmitLoading(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editItemId
            ? {
                ...i,
                name: form.name.trim(),
                sku: form.sku.trim(),
                qty,
                status: getStatusFromQty(qty),
              }
            : i
        )
      );
      setEditingQty((prev) => {
        const next = { ...prev };
        delete next[editItemId];
        return next;
      });
      setSubmitLoading(false);
      closeItemModal();
      setForm({ name: "", sku: "", qty: "", status: "in_stock" });
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
        {can("inventory:create") && (
          <button type="button" className="btn-primary" onClick={openAddModal}>
            {t("addItem")}
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <input
          type="search"
          placeholder={t("search")}
          className="input-base min-w-[200px] max-w-xs flex-1 sm:flex-initial"
        />
        <select className="input-base w-full max-w-[180px] sm:w-auto">
          <option value="">{t("filterStatus")}</option>
        </select>
        <select className="input-base w-full max-w-[180px] sm:w-auto">
          <option value="">{t("filterCategory")}</option>
        </select>
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

      {/* แถบรวม: เลือกแล้ว + มีการแก้ไข → บันทึก/ยกเลิกที่เดียว (อิงจาก checkbox, ค่าเดิมไม่ส่ง) */}
      {hasAnyUnsavedSelected && can("inventory:update") && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 md:gap-4">
          <span className="text-sm font-medium text-amber-800">
            {t("editedCount", { count: selectedRowsWithUnsaved.length })}
          </span>
          <button type="button" className="btn-primary" onClick={handleSaveEdits}>
            {t("saveEdits")}
          </button>
          <button type="button" className="btn-secondary" onClick={handleCancelEdits}>
            {t("cancelEdits")}
          </button>
        </div>
      )}

      {someSelected && (can("inventory:update") || can("inventory:export")) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:gap-4">
          <span className="text-sm font-medium text-neutral-600">
            {selected.size} selected
          </span>
          {can("inventory:update") && (
            <button type="button" className="btn-secondary" disabled>
              {t("bulkReorder")}
            </button>
          )}
          {can("inventory:export") && (
            <button type="button" className="btn-secondary" disabled>
              {t("bulkExport")}
            </button>
          )}
        </div>
      )}

      {/* Empty state เป็นมิตร — ชวนเพิ่มสินค้าแรก */}
      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50/50 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-200 text-3xl">
            📦
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">{t("empty")}</h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-600">{t("emptyDescription")}</p>
          {can("inventory:create") && (
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={openAddModal}
            >
              {t("addFirstProduct")}
            </button>
          )}
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
                      <td
                        className={`table-cell w-36 min-w-32 text-right align-middle ${hasUnsavedQty(row) ? "ring-2 ring-amber-400 ring-inset rounded-md bg-amber-50/30" : ""}`}
                        title={hasUnsavedQty(row) ? t("unsavedHint") : undefined}
                      >
                        <NumberInput
                          key={`qty-${row.id}`}
                          value={getRowQtyDisplay(row) ?? String(row.qty ?? 0)}
                          onChange={(v) => handleRowQtyChange(row.id, v)}
                          onFocus={() => handleRowQtyFocus(row.id)}
                          onBlur={handleRowQtyBlur}
                          min={0}
                          step={1}
                          className="mx-auto w-full max-w-32"
                          label={t("colQty")}
                        />
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

      <FormModal
        open={addItemOpen || editItemOpen}
        title={editItemOpen ? t("editItemFormTitle") : t("addItemFormTitle")}
        onClose={closeItemModal}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editItemOpen) handleEditItemSubmit();
            else handleAddItemSubmit();
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
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {t("formQty")}
            </label>
            <NumberInput
              value={form.qty}
              onChange={(v) => setForm((f) => ({ ...f, qty: v }))}
              min={0}
              step={1}
              error={!!formErrors.qty}
              label={t("formQty")}
            />
            {formErrors.qty && (
              <p className="mt-2 text-sm text-danger">{formErrors.qty}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              {t("formStatus")}
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as InventoryStatus,
                }))
              }
              className="input-base"
            >
              <option value="in_stock">{tStatus("in_stock")}</option>
              <option value="low_stock">{tStatus("low_stock")}</option>
              <option value="out_of_stock">{tStatus("out_of_stock")}</option>
            </select>
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
