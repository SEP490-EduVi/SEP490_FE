import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/common';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduVi - Slide-Based Presentations',
  description: 'Create beautiful, dynamic presentations with EduVi. A next-generation slide-based presentation tool.',
  keywords: ['presentation', 'slides', 'education', 'EduVi', 'Next.js'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
