import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("participant ordering and review flow", () => {
  it("keeps ordering visible and separates review measurements below it", () => {
    const page = source("src/app/k/[code]/page.tsx");
    expect(page).toContain('<Panel title={ui.participant.preorder}>');
    expect(page).toContain("ui.participant.preorderUnavailable");
    expect(page).toContain('<hr className="section-divider" />');
    expect(page).toContain("ui.participant.review");
    expect(page).toContain("!features.ordering && <Panel title={ui.participant.redemption}>");
  });

  it("collects order feedback on the participant review page", () => {
    const page = source("src/app/k/[code]/page.tsx");
    const actions = source("src/app/k/[code]/actions.ts");
    expect(page).toContain("recordOrderFeedback");
    expect(actions).toContain("?feedback=recorded");
    expect(actions).toContain("recordParticipantOrderFeedback");
  });

  it("uses one final order form after the station choice", () => {
    const page = source("src/app/k/[code]/order/page.tsx");
    const details = source("src/app/k/[code]/order/order-details-form.tsx");
    expect(page).toContain("OrderDetailsForm");
    expect(details).toContain('form action={placeOrder}');
    expect(details).toContain('name="productId"');
    expect(details).toContain('name="option"');
    expect(details).toContain('name="slotStart"');
  });
});
