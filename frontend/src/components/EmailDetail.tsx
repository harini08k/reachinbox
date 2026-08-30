"use client";

import { ArrowLeft, Star, Archive, Trash2 } from "lucide-react";

interface Attachment {
  filename: string;
  contentBase64: string;
  mimeType: string;
}

interface EmailDetailProps {
  email: {
    subject: string;
    recipient: string;
    recipientName: string | null;
    body: string;
    status: string;
    scheduledTime: string;
    attachments: Attachment[] | null;
  };
  onBack: () => void;
}

export default function EmailDetail({ email, onBack }: EmailDetailProps) {
  const displayName = email.recipientName || email.recipient;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-text-primary">
            {email.subject}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-text-secondary">
          <Star size={18} />
          <Archive size={18} />
          <Trash2 size={18} />
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-medium text-white">
            {initial}
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">
              {displayName}{" "}
              <span className="font-normal text-text-secondary">
                &lt;{email.recipient}&gt;
              </span>
            </div>
            <div className="text-xs text-text-secondary">
              {new Date(email.scheduledTime).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="whitespace-pre-wrap text-sm text-text-primary">
          {email.body}
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {email.attachments.map((a, i) => (
              <a
                key={i}
                href={`data:${a.mimeType};base64,${a.contentBase64}`}
                download={a.filename}
                className="rounded-xl border border-surface-border bg-surface-muted p-3 text-sm transition hover:bg-surface"
              >
                <div className="font-medium text-brand-green">{a.filename}</div>
                <div className="text-xs text-text-secondary">{a.mimeType}</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
