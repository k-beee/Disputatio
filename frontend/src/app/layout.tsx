import type { Metadata } from 'next';
import './globals.css';
import { InteractiveBackground } from '@/components/InteractiveBackground';

export const metadata: Metadata = {
  title: 'Disputatio — Scholastic AI Coliseum',
  description: 'A decentralized debate terminal governed by GenLayer intelligent validator consensus.',
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        <InteractiveBackground />
        {children}
      </body>
    </html>
  );
}
