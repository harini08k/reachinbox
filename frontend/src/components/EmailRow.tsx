"use client";

import { Star, Clock } from "lucide-react";

interface EmailRowProps {
  recipient: string;
  subject: string;
  bodyPreview: string;
  statusLabel: string;
  statusVariant: "scheduled" | "sent" | "failed";
}

export default function EmailRow({
  recipient,
  subject,
  bodyPreview,
  statusLabel,
  statusVariant,
}: EmailRowProps) {
  const badgeStyles = {
    scheduled: "bg-orange-100 text-orange-600",
    sent: "bg-status-sentBg text-status-sent",
    failed: "bg-red-100 text-red-600",
  }[statusVariant];

  return (
    <div className="flex items-center gap-4 border-b border-surface-border px-6 py-4 hover:bg-surface-muted">
      <div className="w-40 flex-shrink-0 truncate text-sm text-text-primary">
        To: {recipient}
      </div>

      <span
        className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${badgeStyles}`}
      >
        {statusVariant === "scheduled" && <Clock size={12} />}
        {statusLabel}
      </span>

      <div className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-text-primary">{subject}</span>
        <span className="text-text-secondary"> - {bodyPreview}</span>
      </div>

      <Star size={18} className="flex-shrink-0 text-text-secondary" />
    </div>
  );
}
