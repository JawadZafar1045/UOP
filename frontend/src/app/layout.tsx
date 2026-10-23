import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'School of Information Security — Public Learning Platform',
  description: 'Practical cybersecurity, programming, and technology courses.',
  icons: {
    icon: [
      { url: '/SIS-logo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/SIS-logo.png',
    apple: '/SIS-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#f4f8fb] text-[#021F37] selection:bg-[#0E8696] selection:text-white">
        {children}
      </body>
    </html>
  );
}