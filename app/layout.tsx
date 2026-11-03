import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tip splitter",
  description: "Split a bill and its tip between friends.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="footer">
          <p>
            Tip splitter v{process.env.NEXT_PUBLIC_APP_VERSION}
            {process.env.NEXT_PUBLIC_COMMIT ? ` · ${process.env.NEXT_PUBLIC_COMMIT}` : ""}
          </p>
        </footer>
      </body>
    </html>
  );
}
