import Link from "next/link";
import { CalendarDays, LayoutDashboard, ShieldCheck, Users } from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects non-admins out before rendering.
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Admin
            </p>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto">
            <AdminNavLink
              href="/admin"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
            />
            <AdminNavLink
              href="/admin/organizers"
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Organizers"
            />
            <AdminNavLink
              href="/admin/events"
              icon={<CalendarDays className="h-4 w-4" />}
              label="Events"
            />
            <AdminNavLink
              href="/admin/users"
              icon={<Users className="h-4 w-4" />}
              label="Users"
            />
          </nav>
        </div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function AdminNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
      {label}
    </Link>
  );
}
