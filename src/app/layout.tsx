import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Earthin Website Factory — Automated Newsroom Platform',
  description: 'Enterprise Automated News Website Creation, Deployment and Management Engine for Earthin',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text-primary min-h-screen antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
