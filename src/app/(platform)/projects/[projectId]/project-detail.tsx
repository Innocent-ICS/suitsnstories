"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  updateProject,
  addComment,
  addDeliverable,
  approveDeliverable,
  assignCoach,
} from "@/actions/project";
import {
  CheckCircleIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface ProjectDetailProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    brief: string | null;
    feedback: string | null;
    dueDate: string | null;
    client: { id: string; name: string | null; image: string | null; email: string | null };
    coach: { id: string; name: string | null; image: string | null } | null;
    deliverables: {
      id: string;
      title: string;
      fileUrl: string | null;
      fileType: string | null;
      version: number;
      approved: boolean;
      createdAt: string;
    }[];
    comments: {
      id: string;
      content: string;
      createdAt: string;
      author: { id: string; name: string | null; image: string | null; role: string };
    }[];
  };
  currentUserId: string;
  userRole: string;
  coaches: { id: string; name: string | null }[];
}

const statusStyles: Record<string, string> = {
  BRIEF: "bg-blue-500/10 text-blue-600",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  REVIEW: "bg-purple-500/10 text-purple-600",
  REVISION: "bg-orange-500/10 text-orange-600",
  COMPLETED: "bg-emerald-500/10 text-emerald-600",
  ARCHIVED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  BRIEF: "Brief",
  IN_PROGRESS: "In Progress",
  REVIEW: "In Review",
  REVISION: "Revision",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function ProjectDetail({ project, currentUserId, userRole, coaches }: ProjectDetailProps) {
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const isClient = project.client.id === currentUserId;
  const isCoach = project.coach?.id === currentUserId;
  const isAdmin = userRole === "ADMIN";

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setSaving(true);
    try {
      await addComment({ projectId: project.id, content: commentText });
      setCommentText("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: string) {
    await updateProject(project.id, { status });
    router.refresh();
  }

  async function handleAssignCoach(coachId: string) {
    await assignCoach(project.id, coachId);
    router.refresh();
  }

  async function handleApprove(deliverableId: string) {
    await approveDeliverable(deliverableId);
    router.refresh();
  }

  async function handleAddDeliverable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await addDeliverable(project.id, fd.get("title") as string);
    form.reset();
    router.refresh();
  }

  async function handleSaveFeedback(feedback: string) {
    await updateProject(project.id, { feedback });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-4">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to projects
        </a>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif text-foreground">{project.title}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[project.status]}`}>
                {statusLabels[project.status]}
              </span>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>

          {/* Status controls for coach/admin */}
          {(isCoach || isAdmin) && (
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(statusLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brief */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground mb-3">Pitch Brief</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {project.brief || "No brief provided yet."}
            </p>
          </section>

          {/* Coach Feedback */}
          {(isCoach || isAdmin || project.feedback) && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-medium text-foreground mb-3">Coach Feedback</h2>
              {(isCoach || isAdmin) ? (
                <FeedbackEditor
                  initial={project.feedback || ""}
                  onSave={handleSaveFeedback}
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.feedback || "No feedback yet."}
                </p>
              )}
            </section>
          )}

          {/* Deliverables */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <PaperClipIcon className="h-4 w-4" />
              Deliverables ({project.deliverables.length})
            </h2>

            {project.deliverables.length > 0 && (
              <div className="space-y-2 mb-4">
                {project.deliverables.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <div className="flex items-center gap-3">
                      <PaperClipIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          v{d.version} · {new Date(d.createdAt).toLocaleDateString()}
                          {d.fileUrl && (
                            <> · <a href={d.fileUrl} target="_blank" className="text-primary hover:underline">Download</a></>
                          )}
                        </p>
                      </div>
                    </div>
                    {d.approved ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        Approved
                      </span>
                    ) : (isCoach || isAdmin) ? (
                      <Button size="sm" variant="outline" onClick={() => handleApprove(d.id)}>
                        Approve
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending review</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add deliverable (client only) */}
            {isClient && (
              <form onSubmit={handleAddDeliverable} className="flex gap-2">
                <input
                  name="title"
                  required
                  placeholder="Deliverable name..."
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">Add</Button>
              </form>
            )}
          </section>

          {/* Comments */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              Discussion ({project.comments.length})
            </h2>

            <div className="space-y-4 mb-4">
              {project.comments.map((c) => {
                const roleColor = c.author.role === "ADMIN" || c.author.role === "COACH"
                  ? "text-primary"
                  : "text-foreground";
                return (
                  <div key={c.id} className="flex gap-3">
                    <UserAvatar src={c.author.image} name={c.author.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${roleColor}`}>
                          {c.author.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })}
              {project.comments.length === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder="Write a comment..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button onClick={handleAddComment} disabled={saving || !commentText.trim()} size="sm" className="self-end">
                {saving ? "..." : "Send"}
              </Button>
            </div>
          </section>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-4">
          {/* Project info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Client</p>
              <div className="flex items-center gap-2 mt-1.5">
                <UserAvatar src={project.client.image} name={project.client.name} />
                <div>
                  <p className="text-sm font-medium">{project.client.name}</p>
                  <p className="text-xs text-muted-foreground">{project.client.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Coach</p>
              {project.coach ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <UserAvatar src={project.coach.image} name={project.coach.name} />
                  <p className="text-sm font-medium">{project.coach.name}</p>
                </div>
              ) : isAdmin ? (
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && handleAssignCoach(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>Assign a coach...</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground mt-1.5">Not assigned yet</p>
              )}
            </div>

            {project.dueDate && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</p>
                <p className="text-sm mt-1.5">
                  {new Date(project.dueDate).toLocaleDateString("en-US", {
                    weekday: "short", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feedback Editor ────────────────────────────────────────────────────

function FeedbackEditor({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
        rows={4}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Write feedback for the client..."
      />
      {dirty && (
        <Button size="sm" onClick={() => { onSave(value); setDirty(false); }}>
          Save Feedback
        </Button>
      )}
    </div>
  );
}
