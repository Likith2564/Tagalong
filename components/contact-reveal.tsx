"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type ContactKind = "telegram" | "whatsapp" | "twitter" | "instagram";

type Props = {
  kind: ContactKind;
  /**
   * The raw handle from the profile — username for telegram/twitter/instagram,
   * E.164-format number for whatsapp.
   */
  value: string;
};

const KIND_META: Record<
  ContactKind,
  {
    label: string;
    /** How to format the handle for display once revealed. */
    display: (raw: string) => string;
    /** External URL that opens a conversation/profile. */
    href: (raw: string) => string;
  }
> = {
  telegram: {
    label: "Telegram",
    display: (raw) => `@${raw.replace(/^@/, "")}`,
    href: (raw) => `https://t.me/${raw.replace(/^@/, "")}`,
  },
  whatsapp: {
    label: "WhatsApp",
    display: (raw) => raw,
    href: (raw) => `https://wa.me/${raw.replace(/^\+/, "")}`,
  },
  twitter: {
    label: "Twitter",
    display: (raw) => `@${raw.replace(/^@/, "")}`,
    href: (raw) => `https://twitter.com/${raw.replace(/^@/, "")}`,
  },
  instagram: {
    label: "Instagram",
    display: (raw) => `@${raw.replace(/^@/, "")}`,
    href: (raw) => `https://instagram.com/${raw.replace(/^@/, "")}`,
  },
};

export function ContactReveal({ kind, value }: Props) {
  const meta = KIND_META[kind];
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(meta.display(value));
      setCopied(true);
      toast.success(`${meta.label} handle copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Long-press to select.");
    }
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted",
        )}
      >
        {meta.label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 pr-1 pl-3 py-1 text-xs">
      <a
        href={meta.href(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-accent hover:underline"
      >
        {meta.display(value)}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${meta.label} handle`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-accent/70 hover:bg-accent/10 hover:text-accent"
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </span>
  );
}
