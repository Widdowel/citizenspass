import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session?.user || user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
