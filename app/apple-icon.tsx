import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 42,
          background:
            "linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(79, 70, 229) 100%)",
          color: "white",
          fontSize: 78,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
