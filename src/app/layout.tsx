import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import SessionProvider from '@/providers/SessionProvider';
import { ToastProvider } from '@/components/common';
import GlobalPipelinePill from '@/components/common/GlobalPipelinePill';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduVi - Nền tảng bài giảng thông minh',
  description: 'Tạo bài giảng chất lượng cao với EduVi. Công cụ tạo slide và video bài giảng thế hệ mới.',
  keywords: ['bài giảng', 'slide', 'giáo dục', 'EduVi', 'Next.js'],
  icons: {
    icon: '/tab-logo.png',
    shortcut: '/tab-logo.png',
    apple: '/tab-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <QueryProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
          <ToastProvider />
          <GlobalPipelinePill />
        </QueryProvider>
      </body>
    </html>
  );
}
