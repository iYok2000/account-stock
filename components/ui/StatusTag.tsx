"use client";

import { useTranslations } from "next-intl";

/** Inventory: In Stock (เขียว), Low Stock (เหลือง), Out of Stock (แดง) — ตาม DESIGN_UX_UI.md */
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

/** Orders: Pending, Confirmed, Shipped, Delivered — สีต่างกัน */
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

const inventoryStyle: Record<InventoryStatus, Record<string, string>> = {
  in_stock: {
    background: "var(--color-green-100)",
    color: "var(--color-green-800)",
    borderColor: "var(--color-green-200)",
  },
  low_stock: {
    background: "var(--color-amber-100)",
    color: "var(--color-amber-800)",
    borderColor: "var(--color-amber-200)",
  },
  out_of_stock: {
    background: "var(--color-red-100)",
    color: "var(--color-red-800)",
    borderColor: "var(--color-red-200)",
  },
};

const orderStyle: Record<OrderStatus, Record<string, string>> = {
  pending: {
    background: "var(--color-amber-100)",
    color: "var(--color-amber-800)",
    borderColor: "var(--color-amber-200)",
  },
  confirmed: {
    background: "var(--color-blue-100)",
    color: "var(--color-blue-800)",
    borderColor: "var(--color-blue-200)",
  },
  shipped: {
    background: "var(--color-purple-100)",
    color: "var(--color-purple-800)",
    borderColor: "var(--color-purple-200)",
  },
  delivered: {
    background: "var(--color-green-100)",
    color: "var(--color-green-800)",
    borderColor: "var(--color-green-200)",
  },
};

type Props =
  | { type: "inventory"; status: InventoryStatus }
  | { type: "order"; status: OrderStatus };

export default function StatusTag(props: Props) {
  const t = useTranslations("status");
  const key = props.status;
  const label = t(key);
  const inlineStyle =
    props.type === "inventory"
      ? inventoryStyle[props.status]
      : orderStyle[props.status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium"
      style={inlineStyle}
    >
      <span className="size-1.5 rounded-full" style={{ background: inlineStyle.color }} />
      {label}
    </span>
  );
}
