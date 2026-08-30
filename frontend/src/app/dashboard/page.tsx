"use client";

import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import EmailRow from "@/components/EmailRow";
import ComposeModal from "@/components/ComposeModal";
import EmailDetail from "@/components/EmailDetail";
import { useSession } from "next-auth/react";

interface Email {
  id: string;
  recipient: string;
  recipientName: string | null;
  subject: string;
  body: string;
  status: string;
  scheduledTime: string;
  attachments:
    | { filename: string; contentBase64: string; mimeType: string }[]
    | null;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: session } = useSession();
  useEffect(() => {
    fetchEmails();
  }, []);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q) {
      fetchEmails();
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:4000/search-emails?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      setEmails(data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }
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
        onComposeClick={() => setShowCompose(true)}
        onTabChange={setActiveTab}
        userName={session?.user?.name || "Guest"}
        userEmail={session?.user?.email || ""}
        userAvatar={session?.user?.image || ""}
      />

      <main className="flex flex-1 flex-col">
        {selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
          />
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-surface-border p-4">
              {
                <input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-secondary"
                />
              }
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
                    statusVariant={
                      email.status as "scheduled" | "sent" | "failed"
                    }
                    onClick={() => setSelectedEmail(email)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onScheduled={fetchEmails}
        />
      )}
    </div>
  );
}
