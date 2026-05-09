import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};

export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 44,
          background:
            "linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(79, 70, 229) 100%)",
          color: "white",
          fontSize: 84,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
