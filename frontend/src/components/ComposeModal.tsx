"use client";

import { useState, useRef } from "react";
import {
  X,
  Paperclip,
  Clock,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";
import Papa from "papaparse";

interface ComposeModalProps {
  onClose: () => void;
  onScheduled: () => void;
}

interface Recipient {
  email: string;
  name?: string;
}

export default function ComposeModal({
  onClose,
  onScheduled,
}: ComposeModalProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [subject, setSubject] = useState("");
  const [delayBetween, setDelayBetween] = useState("");
  const [hourlyLimit, setHourlyLimit] = useState("");
  const [showSendLater, setShowSendLater] = useState(false);
  const [sendLaterTime, setSendLaterTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addRecipientFromInput() {
    const value = recipientInput.trim();
    if (value && value.includes("@")) {
      setRecipients((prev) => [...prev, { email: value }]);
      setRecipientInput("");
    }
  }

  function removeRecipient(index: number) {
    setRecipients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const parsed: Recipient[] = [];
        for (const row of result.data as string[][]) {
          const email = row[0]?.trim();
          const name = row[1]?.trim();
          if (email && email.includes("@")) {
            parsed.push({ email, name: name || undefined });
          }
        }
        setRecipients((prev) => [...prev, ...parsed]);
      },
    });
  }

  function applyFormat(command: string) {
    document.execCommand(command, false);
    bodyRef.current?.focus();
  }

  async function handleSubmit() {
    if (recipients.length === 0) {
      alert("Add at least one recipient");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:4000/schedule-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          subject,
          body: bodyRef.current?.innerText || "",
          startTime: sendLaterTime || undefined,
          delayBetweenEmailsMs: delayBetween
            ? Number(delayBetween) * 1000
            : undefined,
          hourlyLimit: hourlyLimit ? Number(hourlyLimit) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to schedule: ${err.error || "unknown error"}`);
        return;
      }

      onScheduled();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong scheduling this email.");
    } finally {
      setSubmitting(false);
    }
  }

  const quickTimes = [
    { label: "Tomorrow, 10:00 AM", hoursFromNow: 24 },
    { label: "Tomorrow, 11:00 AM", hoursFromNow: 25 },
    { label: "Tomorrow, 3:00 PM", hoursFromNow: 29 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-8 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-text-primary">
              Compose New Email
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={18} className="text-text-secondary" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <button onClick={() => setShowSendLater((s) => !s)}>
              <Clock size={18} className="text-brand-green" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full border border-brand-green px-5 py-2 font-medium text-brand-green transition hover:bg-brand-greenLight disabled:opacity-50"
            >
              {sendLaterTime ? "Send Later" : "Send"}
            </button>
          </div>
        </div>

        {/* Send Later popover */}
        {showSendLater && (
          <div className="absolute right-8 top-20 z-10 w-72 rounded-2xl border border-surface-border bg-white p-5 shadow-lg">
            <h3 className="mb-4 font-semibold text-text-primary">Send Later</h3>

            <div className="relative mb-4">
              {!sendLaterTime && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                  Pick date & time
                </span>
              )}
              <input
                type="datetime-local"
                className="w-full rounded-xl bg-surface-muted px-3 py-2 text-sm text-transparent focus:text-text-primary"
                style={sendLaterTime ? {} : { color: "transparent" }}
                onChange={(e) =>
                  setSendLaterTime(new Date(e.target.value).toISOString())
                }
              />
            </div>

            {quickTimes.map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  const d = new Date(
                    Date.now() + t.hoursFromNow * 60 * 60 * 1000,
                  );
                  setSendLaterTime(d.toISOString());
                }}
                className="block w-full py-2 text-left text-sm text-text-primary hover:text-brand-green"
              >
                {t.label}
              </button>
            ))}
            <div className="mt-3 flex justify-end gap-3">
              <button
                onClick={() => setShowSendLater(false)}
                className="text-sm text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSendLater(false)}
                className="text-sm font-medium text-brand-green"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          <div className="mb-4 flex items-center gap-3 border-b border-surface-border pb-3">
            <label className="w-16 text-sm text-text-secondary">From</label>
            <span className="rounded-xl bg-surface-muted px-3 py-1.5 text-sm text-text-primary">
              sender1@reachinbox.ai
            </span>
          </div>

          <div className="mb-4 flex items-start gap-3 border-b border-surface-border pb-3">
            <label className="w-16 pt-1.5 text-sm text-text-secondary">
              To
            </label>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {recipients.map((r, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full border border-brand-green px-3 py-1 text-sm text-brand-green"
                >
                  {r.name || r.email}
                  <button onClick={() => removeRecipient(i)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipientFromInput();
                  }
                }}
                placeholder="recipient@example.com"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="whitespace-nowrap text-sm font-medium text-brand-green"
            >
              Upload List
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3 border-b border-surface-border pb-3">
            <label className="w-16 text-sm text-text-secondary">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
          </div>

          <div className="mb-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">
                Delay between 2 emails (s)
              </label>
              <input
                value={delayBetween}
                onChange={(e) => setDelayBetween(e.target.value)}
                placeholder="00"
                className="w-16 rounded-xl bg-surface-muted px-3 py-2 text-center text-sm focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">
                Hourly Limit
              </label>
              <input
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                placeholder="00"
                className="w-16 rounded-xl bg-surface-muted px-3 py-2 text-center text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Rich text editor */}
          <div className="rounded-xl bg-surface-muted p-4">
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              className="min-h-[200px] text-sm text-text-primary focus:outline-none"
              data-placeholder="Type Your Reply..."
            />
            <div className="mt-4 flex items-center gap-3 border-t border-surface-border pt-3 text-text-secondary">
              <button onClick={() => applyFormat("bold")}>
                <Bold size={16} />
              </button>
              <button onClick={() => applyFormat("italic")}>
                <Italic size={16} />
              </button>
              <button onClick={() => applyFormat("underline")}>
                <Underline size={16} />
              </button>
              <button onClick={() => applyFormat("insertUnorderedList")}>
                <List size={16} />
              </button>
              <button onClick={() => applyFormat("insertOrderedList")}>
                <ListOrdered size={16} />
              </button>
              <button onClick={() => applyFormat("formatBlock")}>
                <Quote size={16} />
              </button>
              <button onClick={() => applyFormat("strikeThrough")}>
                <Strikethrough size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
