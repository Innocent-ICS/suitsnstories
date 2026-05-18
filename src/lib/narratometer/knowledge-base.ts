import { db } from "@/lib/db";
import type { KnowledgeSnippet } from "./types";
import { normalizeExtractedText } from "./security";

const STATIC_PITCH_KNOWLEDGE: KnowledgeSnippet[] = [
  {
    id: "fractal-clarity",
    title: "Fractal Narrative Clarity",
    source: "Suits & Stories Methodology",
    content:
      "A strong pitch should preserve the same core decision logic at every level: one sentence, one minute, one slide, or a full deck. Each section should mirror and reinforce the larger story.",
  },
  {
    id: "decision-oriented",
    title: "Decision-Oriented Pitching",
    source: "Suits & Stories Methodology",
    content:
      "The deck should answer the questions a funder or executive needs resolved before saying yes: why this problem matters now, why this team, why this wedge, why this market, and why this ask.",
  },
  {
    id: "problem-stakes-proof",
    title: "Problem, Stakes, Proof",
    source: "Pitch Coaching Framework",
    content:
      "Most weak pitches describe features before making the audience feel the problem. Strong decks quantify urgency, show who is hurt by the status quo, then earn claims with traction, evidence, and credible execution proof.",
  },
  {
    id: "slide-economy",
    title: "Slide Economy",
    source: "Pitch Coaching Framework",
    content:
      "Each slide needs one job. Dense slides, unclear hierarchy, weak chart labeling, or decorative visuals dilute attention and slow investor comprehension.",
  },
  {
    id: "ask-and-next-step",
    title: "Ask and Next Step",
    source: "Pitch Coaching Framework",
    content:
      "A pitch should make the next decision easy. The ask, use of funds or support, milestones, and expected investor or partner action should be explicit.",
  },
];

export async function retrievePitchKnowledge(query: string, limit = 7): Promise<KnowledgeSnippet[]> {
  const dynamicSnippets = await loadCourseSnippets();
  const allSnippets = [...STATIC_PITCH_KNOWLEDGE, ...dynamicSnippets];
  const queryTerms = tokenize(query);

  return allSnippets
    .map((snippet) => ({ snippet, score: scoreSnippet(snippet, queryTerms) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.snippet);
}

async function loadCourseSnippets(): Promise<KnowledgeSnippet[]> {
  const lessons = await db.lesson.findMany({
    where: {
      content: { not: null },
      module: { course: { status: "PUBLISHED" } },
    },
    take: 80,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      module: { select: { title: true, course: { select: { title: true } } } },
    },
  });

  return lessons
    .map((lesson) => {
      const content = normalizeExtractedText(stripRichText(lesson.content || "")).slice(0, 2200);
      return {
        id: lesson.id,
        title: lesson.title,
        source: `${lesson.module.course.title} / ${lesson.module.title}`,
        content,
      };
    })
    .filter((snippet) => snippet.content.length > 80);
}

function stripRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2)
  );
}

function scoreSnippet(snippet: KnowledgeSnippet, queryTerms: Set<string>) {
  const haystack = `${snippet.title} ${snippet.content}`.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (haystack.includes(term)) score += 1;
  }
  if (/pitch|deck|investor|problem|traction|ask|story|narrative/i.test(snippet.content)) score += 2;
  return score;
}
