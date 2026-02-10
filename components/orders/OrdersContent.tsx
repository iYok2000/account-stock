"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmModal, FormModal } from "@/components/ui/Modal";
import StatusTag, { type OrderStatus } from "@/components/ui/StatusTag";
import { useToast } from "@/contexts/ToastContext";

export default function OrdersContent() {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const { showSuccess } = useToast();

  const [placeOrderOpen, setPlaceOrderOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const orders: { id: string; date: string; status: OrderStatus; amount: string }[] = [];
  const hasRows = orders.length > 0;

  const handlePlaceOrderSubmit = () => {
    setPlaceOrderOpen(false);
    setConfirmSubmitOpen(true);
  };

  const handleConfirmSubmit = () => {
    setSubmitLoading(true);
    setTimeout(() => {
      setSubmitLoading(false);
      setConfirmSubmitOpen(false);
      showSuccess("Order submitted (mock)");
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
          onClick={() => setPlaceOrderOpen(true)}
        >
          {t("placeOrder")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-3">
        <input
          type="search"
          placeholder={t("search")}
          className="input-base min-w-[200px] max-w-xs flex-1 sm:flex-initial"
        />
        <input
          type="date"
          className="input-base w-full max-w-[160px] sm:w-auto"
          aria-label={t("filterDateFrom")}
          placeholder={t("filterDateFrom")}
        />
        <input
          type="date"
          className="input-base w-full max-w-[160px] sm:w-auto"
          aria-label={t("filterDateTo")}
          placeholder={t("filterDateTo")}
        />
        <select className="input-base w-full max-w-[180px] sm:w-auto">
          <option value="">{t("filterStatus")}</option>
        </select>
      </div>

      <div className="card content-table-wrapper overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-header-cell text-left text-neutral-700">
                  {t("colId")}
                </th>
                <th className="table-header-cell text-left text-neutral-700">
                  {t("colDate")}
                </th>
                <th className="table-header-cell text-left text-neutral-700">
                  {t("colStatus")}
                </th>
                <th className="table-header-cell text-right text-neutral-700">
                  {t("colAmount")}
                </th>
                <th className="table-header-cell w-12" />
              </tr>
            </thead>
            <tbody>
              {hasRows ? (
                orders.map((row) => (
                  <tr key={row.id} className="table-body-row">
                    <td className="table-cell text-neutral-900">
                      {row.id}
                    </td>
                    <td className="table-cell text-neutral-600">
                      {row.date}
                    </td>
                    <td className="table-cell">
                      <StatusTag type="order" status={row.status} />
                    </td>
                    <td className="table-cell text-right tabular-nums text-neutral-900">
                      {row.amount}
                    </td>
                    <td className="table-cell" />
                  </tr>
                ))
              ) : (
                <tr className="table-body-row">
                  <td
                    colSpan={5}
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
        open={placeOrderOpen}
        title={t("placeOrderFormTitle")}
        onClose={() => setPlaceOrderOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            Form fields for order (mock) — ready for API.
          </p>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPlaceOrderOpen(false)}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handlePlaceOrderSubmit}
            >
              {tCommon("confirm")}
            </button>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirmSubmitOpen}
        title={t("placeOrderFormTitle")}
        message={t("confirmSubmitOrder")}
        confirmLabel={tCommon("confirm")}
        loading={submitLoading}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmSubmitOpen(false)}
      />
    </div>
  );
}
