import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "IMS · Intelligent Learning Management System",
  description:
    "Your accessible learning workspace for lessons, study tools, quizzes and focused learning.",
  icons: { icon: "/book.svg" },
};
export const viewport: Viewport = {
  themeColor: "#f8f9fc",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body>{children}</body>
    </html>
  );
}
