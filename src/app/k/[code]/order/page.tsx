import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageTemplate } from "@/components/templates/page-template";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { ui } from "@/config/content";
import { getProducts, getStations } from "@/modules/catalog/server";
import { isFeatureEnabled } from "@/modules/settings/features";
import { buildAvailableSlots } from "@/modules/orders/policy";
import { getLatestParticipantOrder, getSlotStates } from "@/modules/orders/server";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode } from "@/modules/participants/server";
import { cancelOrder, placeOrder, recordOrderFeedback } from "./actions";
import { OrderAutoRefresh } from "@/components/order-auto-refresh";

function localSlot(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export const dynamic = "force-dynamic";

export default async function ParticipantOrderPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ station?: string; product?: string; slot?: string; status?: string }> }) {
  const { code: rawCode } = await params;
  const { station: selectedStationId, product: selectedProductId, slot: selectedSlot, status } = await searchParams;
  const code = normalizeParticipantCode(rawCode);
  const participant = await getActiveParticipantByCode(code);
  if (!participant) notFound();
  const [orderingEnabled, stations, latestOrder] = await Promise.all([isFeatureEnabled("ordering"), getStations(), getLatestParticipantOrder(participant.id)]);
  if (!orderingEnabled || !participant.can_preorder) notFound();
  const station = stations.find((item) => item.id === selectedStationId && item.ordering_enabled) ?? null;
  const products = station ? await getProducts(station.id) : [];
  const slots = station ? buildAvailableSlots(station) : [];
  const product = products.find((item) => item.id === selectedProductId) ?? null;
  const slotStates = station ? await getSlotStates(station.id, slots, station.max_per_slot) : {};
  const alternatives = slots.filter((slot) => slotStates[slot] === "available").slice(0, 3);
  return <PublicPageTemplate>
    <PageHeader eyebrow={ui.order.eyebrow} title={ui.order.title} />
    {latestOrder && <Panel title={ui.order.confirmation}>
      {latestOrder.status === "received" && <OrderAutoRefresh />}
      <p><strong>{ui.store.orderNumber}: {latestOrder.number}</strong></p>
      <p>{stations.find((item) => item.id === latestOrder.station_id)?.name} · {latestOrder.product?.name} · {localSlot(latestOrder.slot_start)}</p>
      <p>{ui.order.status}: <StatusBadge>{ui.order.statuses[latestOrder.status]}</StatusBadge></p>
      <p className="muted">{ui.order.pickupInstructions}</p>
      {latestOrder.status === "received" && <form action={cancelOrder}><input type="hidden" name="code" value={code} /><input type="hidden" name="orderId" value={latestOrder.id} /><button type="submit">{ui.order.cancel}</button></form>}
      {latestOrder.status === "collected" && latestOrder.smiley === null && <form action={recordOrderFeedback}><input type="hidden" name="code" value={code} /><input type="hidden" name="orderId" value={latestOrder.id} /><FormField label={ui.order.smiley}><select name="smiley" defaultValue="" required><option value="" disabled>{ui.order.smiley}</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></FormField><FormField label={ui.order.feedbackQuestion}><textarea name="openAnswer" /></FormField><button type="submit">{ui.order.feedbackSubmit}</button></form>}
    </Panel>}
    {status === "unavailable" && <p className="hint">{ui.order.unavailable}</p>}
    {status === "slot-unavailable" && <Panel title={ui.order.alternatives}>
      <p className="hint">{ui.order.slotUnavailable}</p>
      {alternatives.length ? <div className="choice-row">{alternatives.map((slot) => <Link className="secondary-link" key={slot} href={`/k/${code}/order?${new URLSearchParams({ station: station?.id ?? "", product: product?.id ?? "", slot }).toString()}`}>{ui.order.chooseAlternative.replace("{slot}", localSlot(slot))}</Link>)}</div> : <EmptyState>{ui.order.noAlternatives}</EmptyState>}
    </Panel>}
    {status === "cancel-unavailable" && <p className="hint">{ui.order.cancelUnavailable}</p>}
    {status === "feedback-recorded" && <p className="hint">{ui.order.feedbackSaved}</p>}
    <Panel title={ui.order.station}>
      <form action={`/k/${code}/order`}>
        <FormField label={ui.participant.station}><select name="station" defaultValue={station?.id ?? ""} onChange={undefined}><option value="">{ui.participant.chooseStation}</option>{stations.filter((item) => item.ordering_enabled).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
        <button type="submit">{ui.order.station}</button>
      </form>
      {!stations.some((item) => item.ordering_enabled) && <EmptyState>{ui.catalog.noStations}</EmptyState>}
    </Panel>
    {station && <Panel title={ui.order.drink}>
      <form action={`/k/${code}/order`}>
        <input type="hidden" name="station" value={station.id} />
        <FormField label={ui.order.chooseDrink}><select name="product" defaultValue={product?.id ?? ""} required><option value="" disabled>{ui.order.chooseDrink}</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
        <button type="submit" disabled={!products.length}>{ui.order.drink}</button>
      </form>
      {product && <form action={placeOrder}>
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="stationId" value={station.id} />
        <input type="hidden" name="productId" value={product.id} />
        <FormField label={ui.order.option}><select name="option" defaultValue=""><option value="">{ui.order.noOption}</option>{product.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></FormField>
        <FormField label={ui.order.chooseSlot}><select name="slotStart" required defaultValue={slotStates[selectedSlot ?? ""] === "available" ? selectedSlot : ""}><option value="" disabled>{ui.order.chooseSlot}</option>{slots.map((slot) => <option key={slot} value={slot} disabled={slotStates[slot] !== "available"}>{localSlot(slot)} · {slotStates[slot] === "full" ? ui.order.slotFull : slotStates[slot] === "closed" ? ui.order.closed : ui.order.slotAvailable}</option>)}</select></FormField>
        {!products.length && <EmptyState>{ui.order.noProducts}</EmptyState>}
        {!slots.length && <EmptyState>{ui.order.noSlots}</EmptyState>}
        <button type="submit" disabled={!slots.some((slot) => slotStates[slot] === "available") || latestOrder?.status === "received"}>{ui.order.submit}</button>
      </form>}
    </Panel>}
    <Link className="secondary-link" href={`/k/${code}`}>{ui.order.back}</Link>
  </PublicPageTemplate>;
}
