import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebWatch — Web Monitor',
  description: 'Monitor web pages for changes with AI-powered summaries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}