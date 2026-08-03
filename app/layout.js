import "./globals.css";
import PwaRegister from "./pwa-register";

export const metadata = {
  title: "유천엔바이로 계산식",
  description: "수처리 실무 계산을 빠르고 명확하게 확인하세요.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "유천 계산식",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/pwa-icon-192.png",
    apple: "/pwa-icon-192.png"
  }
};

export const viewport = {
  themeColor: "#183c34",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
