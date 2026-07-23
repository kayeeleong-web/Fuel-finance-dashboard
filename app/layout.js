import { ClerkProvider } from '@clerk/nextjs';
import { clientConfig } from '@/config/client.config';
import './globals.css';

// NOTE: this is a proposed baseline — merge with whatever is already in your existing
// layout.js (ClerkProvider options, fonts, etc.). The only two things that must survive
// the merge: the ClerkProvider wrap (auth gate is enforced by middleware.js, but the
// provider still needs to wrap the tree) and the `import './globals.css'` line.
export const metadata = {
  title: `${clientConfig.name} — Fuel Finance`,
  description: 'Client financial dashboard',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
