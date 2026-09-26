import QRCode from "qrcode";
export async function QrCode({ value }: { value: string }) { const src = await QRCode.toDataURL(value, { margin: 1, width: 224, color: { dark: "#003082", light: "#FFFFFF" } }); return <img className="qr" src={src} alt="QR-code naar je persoonlijke pilotpagina" />; }
