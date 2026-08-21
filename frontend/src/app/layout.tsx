import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CSZone LMS — Public Learning Platform',
  description: 'Practical cybersecurity, programming, and technology courses.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
