import "./globals.css";

export const metadata = {
  title: "20-Point Inspection",
  description: "Field solar inspection checklist",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
