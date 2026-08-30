"use client";

import { Clock, Send } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  activeTab: "scheduled" | "sent";
  scheduledCount: number;
  sentCount: number;
  onComposeClick: () => void;
  onTabChange: (tab: "scheduled" | "sent") => void;
  userName: string;
  userEmail: string;
  userAvatar: string;
}

export default function Sidebar({
  activeTab,
  scheduledCount,
  sentCount,
  onComposeClick,
  onTabChange,
  userName,
  userEmail,
  userAvatar,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-surface-border bg-white p-4">
      <div className="mb-6 font-mono text-2xl font-black tracking-tighter text-text-primary">
        ONB
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
        <Image
          src={
            userAvatar ||
            "https://api.dicebear.com/7.x/notionists/svg?seed=doodle-pet"
          }
          alt={userName}
          width={36}
          height={36}
          className="h-9 w-9 flex-shrink-0 rounded-full bg-brand-greenLight"
          unoptimized
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-text-primary">
            {userName}
          </div>
          <div className="truncate text-xs text-text-secondary">
            {userEmail}
          </div>
        </div>
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_URL}/slack/oauth/authorize?senderId=35c966a9-1771-4658-801f-bfa97dc6669e`}
        className="mb-4 block rounded-xl border border-surface-border px-3 py-2 text-center text-sm text-text-secondary transition hover:bg-surface-muted"
      >
        Connect Slack
      </a>

      <button
        onClick={onComposeClick}
        className="mb-6 w-full rounded-xl border border-brand-green py-2.5 font-medium text-brand-green transition hover:bg-brand-greenLight"
      >
        Compose
      </button>

      <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
        Core
      </div>

      <nav className="flex flex-col gap-1">
        <button
          onClick={() => onTabChange("scheduled")}
          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
            activeTab === "scheduled"
              ? "bg-brand-greenLight font-medium text-text-primary"
              : "text-text-secondary hover:bg-surface-muted"
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock size={16} />
            Scheduled
          </span>
          <span>{scheduledCount}</span>
        </button>

        <button
          onClick={() => onTabChange("sent")}
          className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
            activeTab === "sent"
              ? "bg-brand-greenLight font-medium text-text-primary"
              : "text-text-secondary hover:bg-surface-muted"
          }`}
        >
          <span className="flex items-center gap-2">
            <Send size={16} />
            Sent
          </span>
          <span>{sentCount}</span>
        </button>
      </nav>
    </aside>
  );
}
