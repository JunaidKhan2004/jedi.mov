import { ImageResponse } from "next/og";

export const alt = "jedi.mov — Everything Media. One Simple Place.";
export const size = {
  width: 1200,
  height: 630,
};
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.15) 0%, rgba(9, 9, 11, 1) 70%)",
          fontFamily: "system-ui, sans-serif",
          color: "#fafafa",
          padding: "48px",
          textAlign: "center",
        }}
      >
        {/* Brand Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "8px 20px",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#38bdf8" }} />
          <span style={{ fontSize: "18px", letterSpacing: "2px", textTransform: "uppercase", color: "#94a3b8" }}>
            Privacy-First Media Suite
          </span>
        </div>

        {/* Main Title */}
        <div
          style={{
            display: "flex",
            fontSize: "76px",
            fontWeight: "800",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          <span>jedi</span>
          <span style={{ color: "#38bdf8" }}>.mov</span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            maxWidth: "800px",
            lineHeight: "1.4",
            margin: "0 0 40px 0",
          }}
        >
          Download, Convert, Compress, Crop, and Inspect Media with Zero Uploads & 100% Privacy.
        </p>

        {/* Feature Badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["Video Downloader", "MP3 Extractor", "Video Converter", "Compressor", "Canvas Cropper"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  padding: "10px 22px",
                  borderRadius: "12px",
                  fontSize: "18px",
                  color: "#e2e8f0",
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
