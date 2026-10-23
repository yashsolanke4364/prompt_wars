import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarshipSaathi AI — Intelligent Scholarship Matching for Indian Students",
  description:
    "AI-powered scholarship eligibility checker and application tracker. Find scholarships matching your profile, get personalized guidance, and track your applications.",
  keywords: [
    "scholarship",
    "India",
    "AI",
    "eligibility",
    "students",
    "education",
    "financial aid",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
