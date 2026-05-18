import { db } from "@/lib/db";
import { InquiryActions } from "./inquiry-actions";

export default async function AdminInquiriesPage() {
  const inquiries = await db.inquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  const statusCounts = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    reviewed: inquiries.filter((i) => i.status === "reviewed").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    closed: inquiries.filter((i) => i.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Inquiries</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage contact form submissions.
        </p>
      </div>

      {/* Status filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={statusCounts.total} />
        <StatCard label="New" value={statusCounts.new} accent="blue" />
        <StatCard label="Reviewed" value={statusCounts.reviewed} accent="amber" />
        <StatCard label="Contacted" value={statusCounts.contacted} accent="green" />
        <StatCard label="Closed" value={statusCounts.closed} accent="gray" />
      </div>

      {/* Inquiries list */}
      <div className="space-y-3">
        {inquiries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No inquiries yet.</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-medium text-foreground">{inquiry.name}</h3>
                    <StatusBadge status={inquiry.status} />
                    {inquiry.company && (
                      <span className="text-xs text-muted-foreground">
                        {inquiry.company}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <a href={`mailto:${inquiry.email}`} className="hover:text-primary transition-colors">
                      {inquiry.email}
                    </a>
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {inquiry.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <InquiryActions inquiryId={inquiry.id} currentStatus={inquiry.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const accentColors: Record<string, string> = {
    blue: "border-blue-500/20",
    amber: "border-amber-500/20",
    green: "border-emerald-500/20",
    gray: "border-border",
  };

  return (
    <div className={`p-4 rounded-xl border bg-card ${accentColors[accent || "gray"] || "border-border"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-600",
    reviewed: "bg-amber-500/10 text-amber-600",
    contacted: "bg-emerald-500/10 text-emerald-600",
    closed: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
