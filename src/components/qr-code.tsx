import Image from "next/image";
import QRCode from "qrcode";
export async function QrCode({ value, alt }: { value: string; alt: string }) {
  const src = await QRCode.toDataURL(value, {
    margin: 1,
    width: 224,
    color: { dark: "#003082", light: "#FFFFFF" },
  });
  return <Image className="qr" src={src} alt={alt} width={140} height={140} unoptimized />;
}
