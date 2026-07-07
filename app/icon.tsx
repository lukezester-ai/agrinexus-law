import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 120,
          background:
            "linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(79, 70, 229) 100%)",
          color: "white",
          fontSize: 220,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { width: 512, height: 512 },
  );
}
