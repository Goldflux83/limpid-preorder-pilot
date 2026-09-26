import { PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { requireStoreSession } from "@/modules/store/session";
import { getOpenStoreOrders } from "@/modules/store/orders";
import { StoreAutoRefresh } from "@/components/store-auto-refresh";
import { closeOrder, pauseOrders } from "./actions";
export const dynamic = "force-dynamic";
export default async function StorePage({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station: code } = await params;
  const session = await requireStoreSession(code);
  const stations = await getStations();
  const orders = await getOpenStoreOrders(session.stationId);
  const station = stations.find((item) => item.code === code.toUpperCase());
  return (
    <PilotShell>
      <main className="store-screen">
        <StoreAutoRefresh />
        <div className="store-top">
          <p>{station?.name ?? code}</p>
          <span className="connection">
            <i /> {ui.store.connected}
          </span>
        </div>
        {orders.length ? (
          orders.map((order) => (
            <article className="empty-ticket" key={order.id}>
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
        <form action={pauseOrders}>
          <input type="hidden" name="station" value={code} />
          <button className="pause-button" type="submit">
            {ui.store.pause}
          </button>
        </form>
      </main>
    </PilotShell>
  );
}
