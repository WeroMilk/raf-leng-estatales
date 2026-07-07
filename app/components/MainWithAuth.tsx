"use client";

import { usePathname } from "next/navigation";
import SuppressNoisyLogs from "@/app/components/SuppressNoisyLogs";

export default function MainWithAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  return (
    <main className={isLogin ? "app-main app-main--no-nav" : "app-main"}>
      <SuppressNoisyLogs />
      <div className={isLogin ? "login-shell" : "page-container"}>{children}</div>
    </main>
  );
}
