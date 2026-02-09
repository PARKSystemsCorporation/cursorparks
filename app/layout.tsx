import "./globals.css";

export const metadata = {
  title: "GARI.MMO",
  description: "Real-time MMO day-trading simulator"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
