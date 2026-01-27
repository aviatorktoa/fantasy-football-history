import type { Metadata } from 'next';
import './globals.css';
import Chat from '@/components/Chat';

export const metadata: Metadata = {
  title: 'Fantasy Football Dynasty | League History & Analytics',
  description: 'Analyze 20+ years of your Yahoo Fantasy Football league history. Track championships, win rates, head-to-head records, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="gradient-dark min-h-screen">
        <div className="noise-overlay" />
        {children}
        <Chat />
      </body>
    </html>
  );
}
