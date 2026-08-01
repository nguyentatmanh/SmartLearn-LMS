import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { PreferenceProvider } from '@/context/PreferenceContext';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'SmartLearn LMS — Nền tảng quản lý học tập',
  description: 'Quản lý khóa học, nội dung, học viên và tiến độ học tập trong một nền tảng thống nhất.',
  openGraph: {
    title: 'SmartLearn LMS — Nền tảng quản lý học tập',
    description: 'Quản lý khóa học, nội dung, học viên và tiến độ học tập trong một nền tảng thống nhất.',
    type: 'website',
    siteName: 'SmartLearn LMS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-primary/25 selection:text-primary" suppressHydrationWarning>
        <PreferenceProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PreferenceProvider>
      </body>
    </html>
  );
}
