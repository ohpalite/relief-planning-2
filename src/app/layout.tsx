import './globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'School Relief Planning & Substitute Scheduling System | Evergreen Primary School',
  description:
    'Automated substitute teacher scheduling and relief planning system for Evergreen Primary School enforcing workload limits, free period matching, and Neon serverless postgres sync.',
  keywords: [
    'School Relief Planning',
    'Substitute Teacher Scheduling',
    'Timetable Relief Matcher',
    'Teacher Workload Management',
    'Evergreen Primary School',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
