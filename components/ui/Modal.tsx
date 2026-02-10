"use client";

import { useTranslations } from "next-intl";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  const t = useTranslations("common");

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="card w-full max-w-md shadow-lg">
        <h2 id="confirm-title" className="text-lg font-semibold text-neutral-900">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">{message}</p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            {loading ? t("loading") : confirmLabel ?? t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

type FormModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function FormModal({ open, title, onClose, children }: FormModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="form-modal-title" className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
