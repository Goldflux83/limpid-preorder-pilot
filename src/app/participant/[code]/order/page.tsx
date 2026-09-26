import Link from "next/link";
import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getProducts, getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
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
        <PageHeader eyebrow={ui.order.eyebrow} title={ui.order.title} />
        <Panel title={ui.order.station}>
          {stations.map((station) => (
            <div className="list-item" key={station.id}>
              <strong>{station.name}</strong>
              <span>{station.code}</span>
              <em>
                {station.ordering_enabled ? ui.order.open : ui.order.closed}
              </em>
            </div>
          ))}
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
        </Panel>
        <Panel title={ui.order.drink}>
          <div className="choice-row">
            {products.map((product) => (
              <button className="secondary" key={product.id}>
                {product.name}
              </button>
            ))}
          </div>
          {!products.length && <EmptyState>{ui.catalog.noProducts}</EmptyState>}
        </Panel>
        <Panel title={ui.order.slot}>
          <p>{ui.order.slotsUnavailable}</p>
        </Panel>
        <Link href={`/k/${code}`} className="button-link secondary-link">
          {ui.order.back}
        </Link>
      </main>
      <Footer />
    </PilotShell>
  );
}
