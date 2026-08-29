"use client";

import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import EmailRow from "@/components/EmailRow";

interface Email {
  id: string;
  recipient: string;
  recipientName: string | null;
  subject: string;
  body: string;
  status: string;
  scheduledTime: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, []);

  async function fetchEmails() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/test-emails");
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }

  const scheduledEmails = emails.filter((e) => e.status === "scheduled");
  const sentEmails = emails.filter(
    (e) => e.status === "sent" || e.status === "failed",
  );

  const visibleEmails =
    activeTab === "scheduled" ? scheduledEmails : sentEmails;

  return (
    <div className="flex">
      <Sidebar
        activeTab={activeTab}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
        onComposeClick={() => alert("Compose modal coming next!")}
        onTabChange={setActiveTab}
      />

      <main className="flex-1">
        <div className="flex items-center gap-3 border-b border-surface-border p-4">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface-muted px-4 py-2.5">
            <Search size={18} className="text-text-secondary" />
            <input
              placeholder="Search"
              className="w-full bg-transparent text-sm outline-none placeholder:text-text-secondary"
            />
          </div>
          <Filter size={18} className="text-text-secondary" />
          <button onClick={fetchEmails}>
            <RefreshCw size={18} className="text-text-secondary" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-text-secondary">Loading...</div>
        ) : visibleEmails.length === 0 ? (
          <div className="p-6 text-sm text-text-secondary">
            No {activeTab} emails yet.
          </div>
        ) : (
          <div>
            {visibleEmails.map((email) => (
              <EmailRow
                key={email.id}
                recipient={email.recipientName || email.recipient}
                subject={email.subject}
                bodyPreview={email.body.slice(0, 60)}
                statusLabel={
                  email.status === "scheduled"
                    ? new Date(email.scheduledTime).toLocaleString()
                    : email.status
                }
                statusVariant={email.status as "scheduled" | "sent" | "failed"}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
