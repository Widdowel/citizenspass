import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Scale,
  ScanLine,
  ShieldCheck,
  LogOut,
  Building2,
} from "lucide-react";
import { TricolorLogo, TricolorBar } from "@/components/tricolor";

const ADMIN_ROLES = ["ADMIN", "ADMIN_GREFFE", "ADMIN_MAIRIE", "ADMIN_DGI"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { name?: string; cip?: string; role?: string } | undefined;

  if (!session?.user || !ADMIN_ROLES.includes(user?.role ?? "")) {
    redirect("/dashboard");
  }

  const role = user?.role ?? "";
  const isGlobal = role === "ADMIN";

  // Liens visibles selon le rôle
  const navItems: { href: string; label: string; icon: typeof LayoutDashboard; roles: string[] }[] = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, roles: ["ADMIN"] },
    { href: "/admin/requests", label: "Demandes", icon: ClipboardList, roles: ["ADMIN"] },
    { href: "/admin/extractions", label: "Numérisations (Mairie)", icon: ScanLine, roles: ["ADMIN", "ADMIN_MAIRIE"] },
    { href: "/admin/greffe", label: "Greffe — Revues", icon: Scale, roles: ["ADMIN", "ADMIN_GREFFE"] },
    { href: "/admin/security", label: "Sécurité", icon: ShieldCheck, roles: ["ADMIN"] },
  ];

  const visibleItems = navItems.filter((i) => i.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col shrink-0 hidden md:flex">
        <TricolorBar variant="vertical" thickness="thin" />
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <TricolorLogo size="sm" />
            <div>
              <div className="font-bold text-sm">CitizenPass</div>
              <div className="text-xs text-white/60">
                {isGlobal && "Administration"}
                {role === "ADMIN_GREFFE" && "Espace Greffe"}
                {role === "ADMIN_MAIRIE" && "Espace Mairie"}
                {role === "ADMIN_DGI" && "Espace DGI"}
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-sm"
            >
              <item.icon className="w-5 h-5 text-white/70" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm mb-3">
            <p className="font-medium">{user?.name}</p>
            <p className="text-white/50 text-xs font-mono">{user?.cip}</p>
            <p className="text-[#FCD116] text-xs mt-1">{role}</p>
          </div>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/lib/auth");
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
