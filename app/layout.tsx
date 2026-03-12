import { ReactNode } from "react";

// Root layout is a thin wrapper — all locale-specific logic is in app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
