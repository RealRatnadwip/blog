import type { Metadata } from "next";
import { AutoLogout } from "@/components/admin/AutoLogout";

export const metadata: Metadata = {
  title: "Blog Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root">
      <AutoLogout />
      {children}
    </div>
  );
}
