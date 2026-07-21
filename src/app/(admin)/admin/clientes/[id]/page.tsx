import { notFound } from "next/navigation";
import ClienteDetalhe from "@/components/admin/ClienteDetalhe";
import { CLIENTES } from "@/data/admin-clientes";

export function generateStaticParams() {
  return CLIENTES.map((c) => ({ id: c.id }));
}

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = CLIENTES.find((c) => c.id === id);
  if (!cliente) notFound();
  return <ClienteDetalhe cliente={cliente} />;
}
