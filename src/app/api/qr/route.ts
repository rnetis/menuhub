import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { json, apiError } from "@/lib/api-helpers";

// POST { text, size } → { svg, png }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = String(body.text || "").slice(0, 1000);
  if (!text) return apiError("text is required");
  const size = Math.min(Math.max(Number(body.size) || 512, 128), 2048);
  const dark = String(body.dark || "#134E4A");
  const light = String(body.light || "#FFFFFF");

  try {
    const svg = await QRCode.toString(text, {
      type: "svg",
      width: size,
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: "M",
    });
    const png = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: { dark, light },
      errorCorrectionLevel: "M",
    });
    return json({ svg, png });
  } catch (e) {
    console.error("qr error", e);
    return apiError("QR generation failed", 500);
  }
}
