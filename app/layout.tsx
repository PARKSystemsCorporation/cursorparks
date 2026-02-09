import "./globals.css";

export const metadata = {
  title: "PARKSYSTEMS — Day Trading MMO",
  description: "Real-time local market simulator"
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
