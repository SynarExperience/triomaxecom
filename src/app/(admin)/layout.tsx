import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import "@nimbus-ds/styles/dist/index.css";
// depois do Nimbus: sobrescreve os tokens da escala primary
import "./triomax-theme.css";

export const metadata: Metadata = {
  title: "Administração da sua Loja",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
