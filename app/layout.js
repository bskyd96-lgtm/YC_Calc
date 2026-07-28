import "./globals.css";

export const metadata = {
  title: "워터워크 계산실",
  description: "수처리 실무 계산을 빠르고 명확하게 확인하세요.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
