import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polygon Fusion Planner",
  description:
    "Interactive tool that connects disjoint polygons using minimum distance connectors and unions them into a single footprint."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
