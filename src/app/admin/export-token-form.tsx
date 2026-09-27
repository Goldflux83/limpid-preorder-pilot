"use client";

import { useState } from "react";
import { createExportTokenAction } from "./actions";
import { ui } from "@/config/content";

export function ExportTokenForm({ datasets }: { datasets: readonly string[] }) {
  const [url, setUrl] = useState<string | null>(null);
  return (
    <form action={async (formData) => setUrl(await createExportTokenAction(formData))}>
      <label>
        {ui.adminManagement.dataset}
        <select name="dataset">{datasets.map((dataset) => <option value={dataset} key={dataset}>{dataset}</option>)}</select>
      </label>
      <button type="submit">{ui.adminManagement.create}</button>
      {url && <p className="hint">{ui.adminManagement.exportUrl}: <a href={url}>{url}</a></p>}
    </form>
  );
}
