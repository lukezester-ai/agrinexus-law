import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgriNexus.Law",
    short_name: "AgriNexus",
    description:
      "AI асистенти за български фермери: субсидии, срокове, схеми и практични насоки.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#5f8f72",
    lang: "bg",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
