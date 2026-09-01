import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CSZone Academy — Public Learning Platform',
  description: 'Practical cybersecurity, programming, and technology courses.',
  icons: {
    icon: [
      { url: '/cszone-logo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/cszone-logo.png',
    apple: '/cszone-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
