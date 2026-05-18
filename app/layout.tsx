import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Running Schedule & Tracking",
  description: "Created by batibatii",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "w-[380px] flex items-center gap-3 rounded-full px-4 py-3 font-sans text-sm shadow-[var(--shadow-md)] [&>[data-icon]]:shrink-0 [&>[data-icon]]:flex [&>[data-icon]]:h-9 [&>[data-icon]]:w-9 [&>[data-icon]]:items-center [&>[data-icon]]:justify-center [&>[data-icon]]:rounded-full [&>svg]:h-4 [&>svg]:w-4",
              title: "font-semibold text-[var(--foreground)] text-[13px]",
              description: "text-[11px] text-[var(--ink-soft)] mt-0.5",
              actionButton:
                "ml-auto shrink-0 rounded-full bg-white/50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)] cursor-pointer transition-colors hover:bg-white/70",
              success:
                "bg-[#d4f5e4] [&>[data-icon]]:bg-[var(--mint-deep)] [&>[data-icon]]:text-white",
              error:
                "bg-[#ffd4d1] [&>[data-icon]]:bg-[var(--destructive)] [&>[data-icon]]:text-white",
              warning:
                "bg-[#fff0d4] [&>[data-icon]]:bg-[var(--peach)] [&>[data-icon]]:text-[var(--foreground)]",
              info: "bg-[#e0edff] [&>[data-icon]]:bg-[var(--coral-deep)] [&>[data-icon]]:text-white",
            },
          }}
        />
      </body>
    </html>
  );
}
