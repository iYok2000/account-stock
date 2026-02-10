"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmModal, FormModal } from "@/components/ui/Modal";
import StatusTag, { type InventoryStatus } from "@/components/ui/StatusTag";
import { useToast } from "@/contexts/ToastContext";
import { ButtonLoading } from "@/components/ui/Loading";

export default function InventoryContent() {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const { showSuccess, showError } = useToast();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", sku: "", qty: "", status: "in_stock" as InventoryStatus });

  const items: { id: number; name: string; sku: string; qty: number; status: InventoryStatus }[] = [];
  const hasRows = items.length > 0;
  const allSelected = hasRows && selected.size === items.length;
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = t("validationRequired");
    if (!form.sku.trim()) err.sku = t("validationRequired");
    const n = parseInt(form.qty, 10);
    if (Number.isNaN(n) || n < 0) err.qty = t("validationRequired");
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleAddItemSubmit = () => {
    if (!validate()) return;
    setSubmitLoading(true);
    setTimeout(() => {
      setSubmitLoading(false);
      setAddItemOpen(false);
      setForm({ name: "", sku: "", qty: "", status: "in_stock" });
      setFormErrors({});
      showSuccess("Item added (mock)");
    }, 500);
  };

  const handleDeleteConfirm = () => {
    setSubmitLoading(true);
    setTimeout(() => {
      setSubmitLoading(false);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      showSuccess("Item deleted (mock)");
    }, 500);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {t("title")}
        </h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setAddItemOpen(true);
            setFormErrors({});
          }}
        >
          {t("addItem")}
        </button>
      </div>

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

      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:gap-4">
          <span className="text-sm font-medium text-neutral-600">
            {selected.size} selected
          </span>
          <button type="button" className="btn-secondary" disabled>
            {t("bulkReorder")}
          </button>
          <button type="button" className="btn-secondary" disabled>
            {t("bulkExport")}
          </button>
        </div>
      )}

      <div className="card content-table-wrapper overflow-hidden !p-0">
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
                <th className="table-header-cell text-right text-neutral-700">
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
                items.map((row) => (
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
                    <td className="table-cell text-neutral-900">
                      {row.name}
                    </td>
                    <td className="table-cell text-neutral-600">
                      {row.sku}
                    </td>
                    <td className="table-cell text-right tabular-nums text-neutral-900">
                      {row.qty}
                    </td>
                    <td className="table-cell">
                      <StatusTag type="inventory" status={row.status} />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {tCommon("edit")}
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="table-body-row">
                  <td
                    colSpan={6}
                    className="py-16 text-center text-sm text-neutral-500"
                  >
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal
        open={addItemOpen}
        title={t("addItemFormTitle")}
        onClose={() => {
          setAddItemOpen(false);
          setFormErrors({});
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItemSubmit();
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
              onBlur={() => form.name.trim() === "" && setFormErrors((e) => ({ ...e, name: t("validationRequired") }))}
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
            <input
              type="number"
              min={0}
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              className="input-base"
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
              onClick={() => setAddItemOpen(false)}
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
