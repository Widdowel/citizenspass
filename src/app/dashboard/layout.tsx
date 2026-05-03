import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  FilePlus,
  Clock,
  LogOut,
  Settings,
  KeyRound,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Mes documents", icon: FileText },
  { href: "/dashboard/request-new", label: "Nouvelle demande", icon: FilePlus },
  { href: "/dashboard/requests", label: "Mes demandes", icon: Clock },
  { href: "/dashboard/verifications", label: "Demandes de vérification", icon: KeyRound },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  const user = session.user as { id?: string; name?: string; cip?: string; nin?: string; role?: string };

  // Compteur de demandes de vérification en attente
  let pendingVerifs = 0;
  if (user.id) {
    pendingVerifs = await prisma.verificationRequest.count({
      where: {
        citizenId: user.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col shrink-0 hidden md:flex">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#008751] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">CitizenPass</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const showBadge = item.href === "/dashboard/verifications" && pendingVerifs > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-sm"
              >
                <item.icon className="w-5 h-5 text-white/70" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {pendingVerifs}
                  </span>
                )}
              </Link>
            );
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-sm"
            >
              <Settings className="w-5 h-5 text-[#FCD116]" />
              <span className="text-[#FCD116]">Administration</span>
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm mb-3">
            <p className="font-medium">{user.name}</p>
            <p className="text-white/50 text-xs font-mono">CIP {user.cip}</p>
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

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
