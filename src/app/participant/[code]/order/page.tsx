import Link from "next/link";
import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getProducts, getStations } from "@/modules/catalog/server";
export default async function OrderPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const stations = await getStations();
  const products = await getProducts();
  return (
    <PilotShell>
      <main className="page">
        <p className="eyebrow">{ui.order.eyebrow}</p>
        <h1>{ui.order.title}</h1>
        <section>
          <h2>{ui.order.station}</h2>
          {stations.map((station) => (
            <div className="list-item" key={station.id}>
              <strong>{station.name}</strong>
              <span>{station.code}</span>
              <em>
                {station.ordering_enabled ? ui.order.open : ui.order.closed}
              </em>
            </div>
          ))}
          {!stations.length && <p>{ui.catalog.noStations}</p>}
        </section>
        <section>
          <h2>{ui.order.drink}</h2>
          <div className="choice-row">
            {products.map((product) => (
              <button className="secondary" key={product.id}>
                {product.name}
              </button>
            ))}
          </div>
          {!products.length && <p>{ui.catalog.noProducts}</p>}
        </section>
        <section>
          <h2>{ui.order.slot}</h2>
          <p>{ui.order.slotsUnavailable}</p>
        </section>
        <Link href={`/k/${code}`} className="button-link secondary-link">
          {ui.order.back}
        </Link>
      </main>
      <Footer />
    </PilotShell>
  );
}
