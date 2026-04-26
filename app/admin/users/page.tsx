import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { asOrganizerStatus } from "@/lib/auth/organizer";
import { requireAdmin } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  const { data: users } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, city, organizer_status, is_admin, created_at, telegram_handle, twitter_handle, whatsapp_number, instagram_handle",
    )
    .order("created_at", { ascending: false });

  const total = users?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground">
            Everyone who&apos;s signed up. Most recent first.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </header>

      {!users || users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-muted-foreground">
          No users yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Contacts</th>
                <th className="px-5 py-3 font-medium">Roles</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        {u.avatar_url ? (
                          <AvatarImage src={u.avatar_url} alt={u.full_name} />
                        ) : null}
                        <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                          {u.full_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {u.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {u.city ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <ContactDots user={u} />
                  </td>
                  <td className="px-5 py-3">
                    <RolePills
                      organizerStatus={asOrganizerStatus(u.organizer_status)}
                      isAdmin={u.is_admin}
                    />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {users.map((u) => (
              <li key={u.id} className="flex items-start gap-3 px-5 py-4">
                <Avatar className="h-10 w-10 shrink-0 border border-border">
                  {u.avatar_url ? (
                    <AvatarImage src={u.avatar_url} alt={u.full_name} />
                  ) : null}
                  <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                    {u.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {u.full_name}
                    </p>
                    <RolePills
                      organizerStatus={asOrganizerStatus(u.organizer_status)}
                      isAdmin={u.is_admin}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {u.city ?? "no city"} · joined {formatDate(u.created_at)}
                  </p>
                  <ContactDots user={u} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function ContactDots({
  user,
}: {
  user: {
    telegram_handle: string | null;
    twitter_handle: string | null;
    whatsapp_number: string | null;
    instagram_handle: string | null;
  };
}) {
  const items = [
    { key: "telegram", set: !!user.telegram_handle },
    { key: "whatsapp", set: !!user.whatsapp_number },
    { key: "twitter", set: !!user.twitter_handle },
    { key: "instagram", set: !!user.instagram_handle },
  ];
  return (
    <div className="flex gap-1.5 text-[10px] text-muted-foreground">
      {items.map((i) => (
        <span
          key={i.key}
          title={i.key}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[9px] uppercase",
            i.set
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border text-muted-foreground/50",
          )}
        >
          {i.key[0]}
        </span>
      ))}
    </div>
  );
}

function RolePills({
  organizerStatus,
  isAdmin,
}: {
  organizerStatus: ReturnType<typeof asOrganizerStatus>;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isAdmin ? (
        <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background">
          Admin
        </span>
      ) : null}
      {organizerStatus === "verified" ? (
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
          Organizer
        </span>
      ) : null}
      {organizerStatus === "pending" ? (
        <span className="rounded-full bg-cat-college/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cat-college">
          Pending
        </span>
      ) : null}
      {organizerStatus === "rejected" ? (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-destructive">
          Rejected
        </span>
      ) : null}
      {!isAdmin && organizerStatus === "none" ? (
        <span className="text-[10px] text-muted-foreground">—</span>
      ) : null}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
