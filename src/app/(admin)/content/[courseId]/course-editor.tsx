"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/actions/course";
import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  PuzzlePieceIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

// ── Types ──────────────────────────────────────────────────────────────

interface LessonData {
  id: string;
  title: string;
  type: string;
  content: string | null;
  videoUrl: string | null;
  quizData: any;
  order: number;
  isFree: boolean;
}

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: LessonData[];
}

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  price: number;
  currency: string;
  enrollmentCount: number;
  modules: ModuleData[];
}

interface CourseEditorProps {
  course: CourseData;
}

// ── Main Editor ────────────────────────────────────────────────────────

export function CourseEditor({ course }: CourseEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(course.modules.map((m) => m.id))
  );
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  // ── Course metadata save ─────────────────────────────────────────

  async function handleSaveCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    try {
      await updateCourse(course.id, {
        title: formData.get("title") as string,
        slug: formData.get("slug") as string,
        description: formData.get("description") as string,
        price: Math.round(parseFloat(formData.get("price") as string || "0") * 100),
        status: formData.get("status") as any,
      });
      setMessage("Course saved");
      router.refresh();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCourse() {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    await deleteCourse(course.id);
    router.push("/content");
  }

  // ── Thumbnail upload ─────────────────────────────────────────────

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "course-thumbnails");
      formData.append("path", `${course.id}/thumbnail.${file.name.split(".").pop()}`);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (result.url) {
        await updateCourse(course.id, { thumbnail: result.url } as any);
        router.refresh();
      }
    } catch {
      setMessage("Upload failed");
    } finally {
      setSaving(false);
    }
  }

  // ── Module actions ───────────────────────────────────────────────

  async function handleAddModule() {
    try {
      await createModule({ courseId: course.id, title: "New Module" });
      router.refresh();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    await deleteModule(moduleId);
    router.refresh();
  }

  async function handleModuleTitleBlur(moduleId: string, title: string) {
    await updateModule(moduleId, { title });
  }

  // ── Lesson actions ───────────────────────────────────────────────

  async function handleAddLesson(moduleId: string, type: string) {
    try {
      const result = await createLesson({
        moduleId,
        title: `New ${type.toLowerCase()} lesson`,
        type: type as any,
      });
      if (result.success) {
        setEditingLesson(result.lessonId!);
        router.refresh();
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    await deleteLesson(lessonId);
    setEditingLesson(null);
    router.refresh();
  }

  function toggleModule(id: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const lessonIcons: Record<string, typeof DocumentTextIcon> = {
    TEXT: DocumentTextIcon,
    VIDEO: PlayCircleIcon,
    QUIZ: PuzzlePieceIcon,
  };

  return (
    <div className="space-y-8">
      {/* Course Metadata */}
      <form onSubmit={handleSaveCourse} className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-serif text-foreground">{course.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {course.enrollmentCount} enrollments · /{course.slug}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              name="status"
              defaultValue={course.status}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <Label>Thumbnail</Label>
          <div className="mt-1.5 flex items-center gap-4">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt="Thumbnail"
                className="h-20 w-32 object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="h-20 w-32 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center">
                <PhotoIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <label className="cursor-pointer">
              <span className="text-sm text-primary hover:underline">
                {course.thumbnail ? "Change" : "Upload"} thumbnail
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
            </label>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={course.title} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={course.slug} required className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={course.description || ""}
            rows={3}
            className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="w-48">
          <Label htmlFor="price">Price (GHS) — 0 for free</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(course.price / 100).toFixed(2)}
            className="mt-1"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>
            {message}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Course"}
          </Button>
          <button
            type="button"
            onClick={handleDeleteCourse}
            className="text-sm text-destructive hover:underline"
          >
            Delete course
          </button>
        </div>
      </form>

      {/* Modules & Lessons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-foreground">Modules & Lessons</h2>
          <Button variant="outline" onClick={handleAddModule}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>

        {course.modules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No modules yet. Click &ldquo;Add Module&rdquo; to start building your curriculum.
            </p>
          </div>
        ) : (
          course.modules.map((mod, modIndex) => {
            const isExpanded = expandedModules.has(mod.id);
            return (
              <div
                key={mod.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Module header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground font-medium">
                    M{modIndex + 1}
                  </span>
                  <input
                    defaultValue={mod.title}
                    onBlur={(e) => handleModuleTitleBlur(mod.id, e.target.value)}
                    className="flex-1 font-medium text-foreground bg-transparent border-none outline-none focus:bg-muted/50 px-2 py-1 rounded"
                  />
                  <span className="text-xs text-muted-foreground">
                    {mod.lessons.length} lessons
                  </span>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
                    title="Delete module"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Lessons */}
                {isExpanded && (
                  <div>
                    {mod.lessons.map((lesson) => {
                      const Icon = lessonIcons[lesson.type] || DocumentTextIcon;
                      const isEditing = editingLesson === lesson.id;

                      return (
                        <div key={lesson.id} className="border-b border-border last:border-0">
                          {/* Lesson row */}
                          <div
                            className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                            onClick={() => setEditingLesson(isEditing ? null : lesson.id)}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground flex-1">{lesson.title}</span>
                            {lesson.isFree && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                                free
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground capitalize">
                              {lesson.type.toLowerCase()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Inline lesson editor */}
                          {isEditing && (
                            <LessonEditor
                              lesson={lesson}
                              onClose={() => setEditingLesson(null)}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Add lesson buttons */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-muted/10">
                      <span className="text-xs text-muted-foreground mr-2">Add:</span>
                      <button
                        onClick={() => handleAddLesson(mod.id, "TEXT")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                        Text
                      </button>
                      <button
                        onClick={() => handleAddLesson(mod.id, "VIDEO")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <PlayCircleIcon className="h-3.5 w-3.5" />
                        Video
                      </button>
                      <button
                        onClick={() => handleAddLesson(mod.id, "QUIZ")}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <PuzzlePieceIcon className="h-3.5 w-3.5" />
                        Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Inline Lesson Editor ───────────────────────────────────────────────

function LessonEditor({
  lesson,
  onClose,
}: {
  lesson: LessonData;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content || "");
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || "");
  const [isFree, setIsFree] = useState(lesson.isFree);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      await updateLesson(lesson.id, {
        title,
        content: lesson.type === "TEXT" ? content : undefined,
        videoUrl: lesson.type === "VIDEO" ? videoUrl : undefined,
        isFree,
      });
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 py-4 bg-muted/10 border-t border-border space-y-4">
      <div>
        <Label htmlFor={`lesson-title-${lesson.id}`}>Lesson Title</Label>
        <Input
          id={`lesson-title-${lesson.id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1"
        />
      </div>

      {lesson.type === "TEXT" && (
        <div>
          <Label>Content</Label>
          <div className="mt-1">
            <RichTextEditor content={content} onChange={setContent} />
          </div>
        </div>
      )}

      {lesson.type === "VIDEO" && (
        <div>
          <Label htmlFor={`video-url-${lesson.id}`}>Video URL</Label>
          <Input
            id={`video-url-${lesson.id}`}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-1"
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          />
          {videoUrl && (
            <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black max-w-md">
              <iframe
                src={getYouTubeEmbedUrl(videoUrl)}
                title="Lesson video preview"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          )}
        </div>
      )}

      {lesson.type === "QUIZ" && (
        <div className="rounded-lg border border-border p-4 bg-card">
          <p className="text-sm text-muted-foreground">
            Quiz editor — edit quiz data as JSON for now. A visual quiz builder is coming in a future update.
          </p>
          <textarea
            defaultValue={JSON.stringify(lesson.quizData || { questions: [], passingScore: 70 }, null, 2)}
            rows={10}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onBlur={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateLesson(lesson.id, { quizData: parsed });
              } catch {
                // Invalid JSON — ignore
              }
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="accent-primary"
          />
          Free preview (accessible without enrollment)
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save Lesson"}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Video URL Helper ───────────────────────────────────────────────────

function getYouTubeEmbedUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  const rawYouTubeId = url.match(/^[a-zA-Z0-9_-]{11}$/)?.[0];

  if (rawYouTubeId) return getYouTubeEmbedSrc(rawYouTubeId);

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const id = pathParts[0];
      if (id) return getYouTubeEmbedSrc(id);
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const id =
        parsed.searchParams.get("v") ||
        (["embed", "shorts", "live", "v"].includes(pathParts[0]) ? pathParts[1] : null);

      if (id) return getYouTubeEmbedSrc(id);
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = host === "player.vimeo.com" ? pathParts[1] : pathParts[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // Leave direct video or invalid URLs untouched for validation elsewhere.
  }

  return url;
}

function getYouTubeEmbedSrc(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}
