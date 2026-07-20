import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { PreferenceProvider } from '@/context/PreferenceContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartLearn LMS — AI-powered LMS & Exam Platform',
  description: 'A realistic, full-stack educational workspace where students learn, practice timed exams, and receive AI study support.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
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
