import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"오늘의 서울 기온 | 진짜 정보판",description:"서울 기온의 실제 조회, KST 일별 기록과 다섯 가지 합성 실패 검사",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
