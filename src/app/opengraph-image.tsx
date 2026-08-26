import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/**
 * Generated Open Graph card, served at /opengraph-image. Next.js wires it into
 * the og:image and twitter:image tags automatically, so there is no static PNG
 * to keep in sync when you change your name or pitch.
 *
 * Deliberately font-free: loading a webfont here means an extra network fetch
 * on every card render, and the built-in sans is perfectly legible at this size.
 */
export const runtime = "edge";
export const alt = `${site.name} — ${site.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080b14 0%, #101733 55%, #0d1a3a 100%)",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#60a5fa",
            fontWeight: 600,
          }}
        >
          {site.location}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            color: "#eaf0fa",
            marginTop: 24,
            lineHeight: 1.05,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            color: "#60a5fa",
            marginTop: 12,
          }}
        >
          {site.title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#91a0ba",
            marginTop: 32,
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {site.pitch}
        </div>
      </div>
    ),
    size
  );
}
