"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { ui } from "@/config/content";
import type { Product } from "@/modules/catalog/server";
import type { SlotState } from "@/modules/orders/policy";
import { placeOrder } from "./actions";

type OrderDetailsFormProps = {
  code: string;
  stationId: string;
  products: Product[];
  slots: string[];
  slotStates: Record<string, SlotState>;
  selectedProductId?: string;
  selectedSlot?: string;
  hasOpenOrder: boolean;
};

function localSlot(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function OrderDetailsForm({ code, stationId, products, slots, slotStates, selectedProductId, selectedSlot, hasOpenOrder }: OrderDetailsFormProps) {
  const [productId, setProductId] = useState(selectedProductId && products.some((product) => product.id === selectedProductId) ? selectedProductId : "");
  const product = products.find((item) => item.id === productId);
  const hasAvailableSlot = slots.some((slot) => slotStates[slot] === "available");
  return <form action={placeOrder}>
    <input type="hidden" name="code" value={code} />
    <input type="hidden" name="stationId" value={stationId} />
    <FormField label={ui.order.chooseDrink}>
      <select name="productId" value={productId} onChange={(event) => setProductId(event.target.value)} required>
        <option value="" disabled>{ui.order.chooseDrink}</option>
        {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </FormField>
    <FormField label={ui.order.option}>
      <select name="option" defaultValue="" disabled={!product}>
        <option value="">{ui.order.noOption}</option>
        {product?.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </FormField>
    <FormField label={ui.order.chooseSlot}>
      <select name="slotStart" required defaultValue={slotStates[selectedSlot ?? ""] === "available" ? selectedSlot : ""}>
        <option value="" disabled>{ui.order.chooseSlot}</option>
        {slots.map((slot) => <option key={slot} value={slot} disabled={slotStates[slot] !== "available"}>{localSlot(slot)} · {slotStates[slot] === "full" ? ui.order.slotFull : slotStates[slot] === "closed" ? ui.order.closed : ui.order.slotAvailable}</option>)}
      </select>
    </FormField>
    {!products.length && <EmptyState>{ui.order.noProducts}</EmptyState>}
    {!slots.length && <EmptyState>{ui.order.noSlots}</EmptyState>}
    <button type="submit" disabled={!product || !hasAvailableSlot || hasOpenOrder}>{ui.order.submit}</button>
  </form>;
}
