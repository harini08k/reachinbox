"use client";

import { Clock, Send } from "lucide-react";
import Image from "next/image";

// Placeholder until real Google OAuth session is wired in
const currentUser = {
  name: "Harini Karthikeyan",
  email: "harini@testemail.com",
  avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=doodle-pet",
};

interface SidebarProps {
  activeTab: "scheduled" | "sent";
  scheduledCount: number;
  sentCount: number;
  onComposeClick: () => void;
  onTabChange: (tab: "scheduled" | "sent") => void;
}

export default function Sidebar({
  activeTab,
  scheduledCount,
  sentCount,
  onComposeClick,
  onTabChange,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-surface-border bg-white p-4">
      <div className="mb-6 font-mono text-2xl font-black tracking-tighter text-text-primary">
        ONB
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-muted p-3">
        <Image
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          width={36}
          height={36}
          className="h-9 w-9 flex-shrink-0 rounded-full bg-brand-greenLight"
          unoptimized
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-text-primary">
            {currentUser.name}
          </div>
          <div className="truncate text-xs text-text-secondary">
            {currentUser.email}
          </div>
        </div>
      </div>

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
