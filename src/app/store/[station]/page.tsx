import { PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { requireStoreSession } from "@/modules/store/session";
import { getActiveQuickPause, getOpenStoreOrders } from "@/modules/store/orders";
import { dailyLogHref, isOrderOverdue } from "@/modules/store/policy";
import { StoreAutoRefresh } from "@/components/store-auto-refresh";
import { StorePauseCountdown } from "@/components/store-pause-countdown";
import { closeOrder, pauseOrders, redeemVoucher, resumeOrders } from "./actions";
export const dynamic = "force-dynamic";
export default async function StorePage({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station: code } = await params;
  const session = await requireStoreSession(code);
  const stations = await getStations();
  const [orders, quickPause] = await Promise.all([getOpenStoreOrders(session.stationId), getActiveQuickPause(session.stationId)]);
  const station = stations.find((item) => item.code === code.toUpperCase());
  return (
    <PilotShell>
      <main className="store-screen">
        <StoreAutoRefresh soundEnabled={station?.sound_enabled ?? false} openOrderCount={orders.length} />
        <div className="store-top">
          <p>{station?.name ?? code}</p>
          <span className="connection">
            <i /> {ui.store.connected}
          </span>
        </div>
        {orders.length ? (
          orders.map((order) => (
            <article className="empty-ticket" style={isOrderOverdue(order.slot_start) ? { borderColor: "#f79009", background: "#fff7ed" } : undefined} key={order.id}>
              <h1>{order.participant?.first_name}</h1>
              <p>
                {order.product?.name} · {order.number}
              </p>
              <p>
                {ui.store.due}:{" "}
                {new Intl.DateTimeFormat("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Amsterdam",
                }).format(new Date(order.slot_start))}
              </p>
              <form action={closeOrder}>
                <input type="hidden" name="station" value={code} />
                <input type="hidden" name="order" value={order.id} />
                <button name="status" value="collected">
                  {ui.store.collected}
                </button>
                <button
                  className="secondary"
                  name="status"
                  value="not_collected"
                >
                  {ui.store.noShow}
                </button>
              </form>
            </article>
          ))
        ) : (
          <div className="empty-ticket">
            <h1>{ui.store.empty}</h1>
            <p>{ui.store.emptyHint}</p>
          </div>
        )}
        {quickPause ? (
          <form action={resumeOrders}>
            <input type="hidden" name="station" value={code} />
            <StorePauseCountdown endsAt={quickPause.ends_at} label={ui.store.pauseUntil} />
            <button className="pause-button" type="submit">{ui.store.resume}</button>
          </form>
        ) : <form action={pauseOrders}><input type="hidden" name="station" value={code} /><button className="pause-button" type="submit">{ui.store.pause}</button></form>}
        <form action={redeemVoucher}>
          <input type="hidden" name="station" value={code} />
          <label>{ui.store.voucherCode}<input name="voucherCode" required /></label>
          <button type="submit">{ui.store.voucherSubmit}</button>
        </form>
        {station?.daily_log_url && <a className="log-link" href={dailyLogHref(station.daily_log_url, station.code)}>{ui.store.log}</a>}
      </main>
    </PilotShell>
  );
}
