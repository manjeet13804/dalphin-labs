import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plinko Lab - Provably Fair Game',
  description: 'Interactive Plinko game with provably-fair commit-reveal protocol',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
