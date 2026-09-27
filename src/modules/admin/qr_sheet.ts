import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ui } from "@/config/content";
import { participantPageUrl } from "@/lib/app_url";

export async function createQrSheetPdf(entries: { code: string; variant: string }[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let index = 0; index < entries.length; index += 1) {
    if (index % 6 === 0) pdf.addPage([595, 842]);
    const page = pdf.getPages()[pdf.getPageCount() - 1];
    const item = entries[index];
    const dataUrl = await QRCode.toDataURL(participantPageUrl(item.code), { width: 240, margin: 1, color: { dark: "#003082", light: "#FFFFFF" } });
    const image = await pdf.embedPng(Buffer.from(dataUrl.split(",")[1], "base64"));
    const column = index % 2;
    const row = Math.floor((index % 6) / 2);
    const x = 48 + column * 270;
    const y = 580 - row * 250;
    page.drawRectangle({ x, y, width: 230, height: 215, borderColor: rgb(0, 0.188, 0.51), borderWidth: 1 });
    page.drawText(ui.pdf.pilot, { x: x + 14, y: y + 190, size: 9, font, color: rgb(0, 0.188, 0.51) });
    page.drawText(item.variant, { x: x + 14, y: y + 174, size: 11, font, color: rgb(0, 0.188, 0.51) });
    page.drawImage(image, { x: x + 55, y: y + 45, width: 120, height: 120 });
    page.drawText(`${ui.pdf.participantCode}: ${item.code}`, { x: x + 14, y: y + 20, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
  }
  return pdf.save();
}
