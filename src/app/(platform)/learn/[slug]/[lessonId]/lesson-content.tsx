"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markLessonComplete, submitQuiz } from "@/actions/enrollment";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface LessonContentProps {
  lesson: {
    id: string;
    type: string;
    content: string | null;
    videoUrl: string | null;
    quizData: {
      questions: {
        id: string;
        question: string;
        options: string[];
        correctAnswer: string;
      }[];
      passingScore: number;
    } | null;
  };
  isCompleted: boolean;
  isEnrolled: boolean;
  nextLessonHref?: string;
}

export function LessonContent({ lesson, isCompleted, isEnrolled, nextLessonHref }: LessonContentProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const router = useRouter();

  async function handleMarkComplete() {
    setLoading(true);
    try {
      const result = await markLessonComplete(lesson.id);
      if (result.success) {
        setCompleted(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitQuiz() {
    setLoading(true);
    try {
      const result = await submitQuiz(lesson.id, quizAnswers);
      if (result.success) {
        setQuizResult({ score: result.score!, passed: result.passed! });
        if (result.passed) setCompleted(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Text content */}
      {lesson.type === "TEXT" && lesson.content && (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-7 sm:text-base"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}

      {/* Video content */}
      {lesson.type === "VIDEO" && lesson.videoUrl && (
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-sm">
            <VideoEmbed url={lesson.videoUrl} />
          </div>
        </div>
      )}

      {/* Quiz content */}
      {lesson.type === "QUIZ" && lesson.quizData && (
        <div className="space-y-6">
          {quizResult ? (
            <div className={`rounded-xl border p-6 ${quizResult.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <h3 className={`text-lg font-medium ${quizResult.passed ? "text-emerald-600" : "text-red-500"}`}>
                {quizResult.passed ? "You passed." : "Not quite — try again"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Score: {Math.round(quizResult.score)}%
                (passing: {lesson.quizData.passingScore}%)
              </p>
              {quizResult.passed && nextLessonHref && (
                <Button
                  className="mt-4"
                  onClick={() => router.push(nextLessonHref)}
                >
                  Continue
                </Button>
              )}
              {!quizResult.passed && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuizResult(null);
                    setQuizAnswers({});
                  }}
                >
                  Retry Quiz
                </Button>
              )}
            </div>
          ) : (
            <>
              {lesson.quizData.questions.map((q, index) => (
                <div key={q.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <p className="font-medium text-foreground">
                    {index + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          quizAnswers[q.id] === option
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option}
                          checked={quizAnswers[q.id] === option}
                          onChange={() =>
                            setQuizAnswers((prev) => ({ ...prev, [q.id]: option }))
                          }
                          className="accent-primary"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSubmitQuiz}
                disabled={loading || Object.keys(quizAnswers).length < lesson.quizData.questions.length}
              >
                {loading ? "Submitting..." : "Submit Quiz"}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Mark complete button */}
      {isEnrolled && lesson.type !== "QUIZ" && (
        <div className="flex items-center gap-4 pt-4">
          {completed ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Lesson completed</span>
              </div>
              {nextLessonHref && (
                <Button onClick={() => router.push(nextLessonHref)} size="sm">
                  Continue
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={handleMarkComplete} disabled={loading} variant="outline">
              {loading ? "Saving..." : "Mark complete"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Video Embed Helper ─────────────────────────────────────────────────

function getEmbedUrl(rawUrl: string): { type: "iframe" | "video"; src: string } {
  const url = rawUrl.trim();
  const rawYouTubeId = url.match(/^[a-zA-Z0-9_-]{11}$/)?.[0];

  if (rawYouTubeId) {
    return { type: "iframe", src: getYouTubeEmbedSrc(rawYouTubeId) };
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const id = pathParts[0];
      if (id) return { type: "iframe", src: getYouTubeEmbedSrc(id) };
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const id =
        parsed.searchParams.get("v") ||
        (["embed", "shorts", "live", "v"].includes(pathParts[0]) ? pathParts[1] : null);

      if (id) return { type: "iframe", src: getYouTubeEmbedSrc(id) };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = host === "player.vimeo.com" ? pathParts[1] : pathParts[0];
      if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
  } catch {
    // Fall through to direct video; admins may paste hosted mp4 URLs.
  }

  return { type: "video", src: url };
}

function getYouTubeEmbedSrc(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

function VideoEmbed({ url }: { url: string }) {
  const { type, src } = getEmbedUrl(url);

  if (type === "iframe") {
    return (
      <iframe
        src={src}
        title="Lesson video"
        className="h-full w-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return <video src={src} controls className="h-full w-full" />;
}
