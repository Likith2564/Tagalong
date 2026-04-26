import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizerActions } from "@/components/admin/organizer-actions";
import { asOrganizerStatus } from "@/lib/auth/organizer";
import { requireAdmin } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";

const STATUS_ORDER = ["pending", "verified", "rejected"] as const;
type Status = (typeof STATUS_ORDER)[number];

export default async function AdminOrganizersPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, city, organizer_status, organizer_applied_at, organizer_verified_at",
    )
    .neq("organizer_status", "none")
    .order("organizer_applied_at", { ascending: false, nullsFirst: false });

  const grouped = STATUS_ORDER.reduce<Record<Status, typeof rows>>(
    (acc, key) => {
      acc[key] = (rows ?? []).filter(
        (r) => asOrganizerStatus(r.organizer_status) === key,
      );
      return acc;
    },
    { pending: [], verified: [], rejected: [] },
  );

  const sectionMeta: Record<Status, { title: string; subtitle: string }> = {
    pending: {
      title: "Pending review",
      subtitle: "Applied to organize. Verify or reject.",
    },
    verified: {
      title: "Verified organizers",
      subtitle: "Can publish their own events.",
    },
    rejected: {
      title: "Rejected",
      subtitle: "Previously rejected. Reset to clear the record.",
    },
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
      <header className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Organizers
        </h1>
        <p className="text-muted-foreground">
          Verification gate. Verified organizers can publish events directly.
        </p>
      </header>

      <div className="space-y-10">
        {STATUS_ORDER.map((status) => {
          const items = grouped[status] ?? [];
          if (items.length === 0 && status !== "pending") return null;

          return (
            <section key={status} className="space-y-4">
              <header>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {sectionMeta[status].title}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({items.length})
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sectionMeta[status].subtitle}
                </p>
              </header>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center text-sm text-muted-foreground">
                  Nothing here.
                </div>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {items.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          {row.avatar_url ? (
                            <AvatarImage
                              src={row.avatar_url}
                              alt={row.full_name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                            {row.full_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {row.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.city ?? "no city set"}
                            {row.organizer_applied_at
                              ? ` · applied ${formatRelative(row.organizer_applied_at)}`
                              : ""}
                            {row.organizer_verified_at
                              ? ` · verified ${formatRelative(row.organizer_verified_at)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill status={status} />
                        <OrganizerActions
                          profileId={row.id}
                          status={status}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        status === "pending" && "bg-cat-college/10 text-cat-college",
        status === "verified" && "bg-accent/10 text-accent",
        status === "rejected" && "bg-destructive/10 text-destructive",
      )}
    >
      {status}
    </span>
  );
}

function formatRelative(iso: string): string {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
