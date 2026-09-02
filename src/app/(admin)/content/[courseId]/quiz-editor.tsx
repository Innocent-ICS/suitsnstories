"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  TrashIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  CheckIcon,
} from "@/components/icons/app-icons";

// ── Types ──────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizEditorProps {
  initialData: QuizData;
  onChange: (data: QuizData) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

let idCounter = 0;
function generateId() {
  return `q_${Date.now()}_${++idCounter}`;
}

function createEmptyQuestion(): QuizQuestion {
  return {
    id: generateId(),
    question: "",
    options: ["", ""],
    correctAnswer: "",
  };
}

// ── Main Component ─────────────────────────────────────────────────────

export function QuizEditor({ initialData, onChange }: QuizEditorProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialData.questions.length > 0 ? initialData.questions : []
  );
  const [passingScore, setPassingScore] = useState(initialData.passingScore ?? 70);

  const emit = useCallback(
    (updatedQuestions: QuizQuestion[], updatedScore?: number) => {
      onChange({
        questions: updatedQuestions,
        passingScore: updatedScore ?? passingScore,
      });
    },
    [onChange, passingScore]
  );

  // ── Question operations ───────────────────────────────────────────

  function addQuestion() {
    const updated = [...questions, createEmptyQuestion()];
    setQuestions(updated);
    emit(updated);
  }

  function removeQuestion(index: number) {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    emit(updated);
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    const updated = questions.map((q, i) =>
      i === index ? { ...q, ...patch } : q
    );
    setQuestions(updated);
    emit(updated);
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setQuestions(updated);
    emit(updated);
  }

  // ── Option operations ─────────────────────────────────────────────

  function addOption(questionIndex: number) {
    const q = questions[questionIndex];
    updateQuestion(questionIndex, { options: [...q.options, ""] });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const q = questions[questionIndex];
    if (q.options.length <= 2) return; // minimum 2 options
    const newOptions = q.options.filter((_, i) => i !== optionIndex);
    const patch: Partial<QuizQuestion> = { options: newOptions };
    // Clear correctAnswer if the removed option was the correct one
    if (q.correctAnswer === q.options[optionIndex]) {
      patch.correctAnswer = "";
    }
    updateQuestion(questionIndex, patch);
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const q = questions[questionIndex];
    const newOptions = q.options.map((o, i) => (i === optionIndex ? value : o));
    const patch: Partial<QuizQuestion> = { options: newOptions };
    // Keep correctAnswer in sync if the text of the correct option changed
    if (q.correctAnswer === q.options[optionIndex]) {
      patch.correctAnswer = value;
    }
    updateQuestion(questionIndex, patch);
  }

  function setCorrectAnswer(questionIndex: number, option: string) {
    updateQuestion(questionIndex, { correctAnswer: option });
  }

  // ── Passing score ─────────────────────────────────────────────────

  function handleScoreChange(value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    setPassingScore(clamped);
    emit(questions, clamped);
  }

  // ── Validation summary ────────────────────────────────────────────

  const issues: string[] = [];
  questions.forEach((q, i) => {
    if (!q.question.trim()) issues.push(`Q${i + 1}: missing question text`);
    if (q.options.some((o) => !o.trim())) issues.push(`Q${i + 1}: has empty options`);
    if (!q.correctAnswer) issues.push(`Q${i + 1}: no correct answer selected`);
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Quiz Builder</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {questions.length === 0
              ? "No questions yet — add one to get started"
              : `${questions.length} question${questions.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Add Question
        </Button>
      </div>

      {/* Questions */}
      {questions.map((q, qIndex) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={qIndex}
          total={questions.length}
          onUpdateQuestion={(text) => updateQuestion(qIndex, { question: text })}
          onRemove={() => removeQuestion(qIndex)}
          onMoveUp={() => moveQuestion(qIndex, -1)}
          onMoveDown={() => moveQuestion(qIndex, 1)}
          onAddOption={() => addOption(qIndex)}
          onRemoveOption={(optIdx) => removeOption(qIndex, optIdx)}
          onUpdateOption={(optIdx, val) => updateOption(qIndex, optIdx, val)}
          onSetCorrect={(option) => setCorrectAnswer(qIndex, option)}
        />
      ))}

      {/* Passing score */}
      {questions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Label htmlFor="passing-score" className="text-sm font-medium">
            Passing Score
          </Label>
          <div className="flex items-center gap-4">
            <input
              id="passing-score"
              type="range"
              min={0}
              max={100}
              step={5}
              value={passingScore}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              className="flex-1 accent-primary h-2"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                className="w-16 text-center text-sm h-8"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Students must score at least {passingScore}% to pass this quiz.
          </p>
        </div>
      )}

      {/* Validation warnings */}
      {issues.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
          <p className="text-xs font-medium text-amber-600">
            {issues.length} issue{issues.length !== 1 ? "s" : ""} to fix before publishing:
          </p>
          <ul className="space-y-0.5">
            {issues.map((issue, i) => (
              <li key={i} className="text-xs text-amber-600/80">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Question Card ──────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  onUpdateQuestion,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onSetCorrect,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onUpdateQuestion: (text: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
  onSetCorrect: (option: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground min-w-[2rem]">
          Q{index + 1}
        </span>

        {/* Reorder buttons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <ChevronUpIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Correct answer indicator */}
        {question.correctAnswer ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            Answer set
          </span>
        ) : (
          <span className="text-xs text-amber-500">No answer selected</span>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors"
          title="Delete question"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-4">
        {/* Question text */}
        <div>
          <Label className="text-xs text-muted-foreground">Question</Label>
          <Input
            value={question.question}
            onChange={(e) => onUpdateQuestion(e.target.value)}
            placeholder="Enter your question…"
            className="mt-1"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Options — click the radio to mark the correct answer
          </Label>
          {question.options.map((option, optIndex) => (
            <div key={optIndex} className="flex items-center gap-2 group">
              {/* Correct answer radio */}
              <button
                type="button"
                onClick={() => option.trim() && onSetCorrect(option)}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  question.correctAnswer === option && option.trim()
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-border hover:border-primary"
                }`}
                title={
                  question.correctAnswer === option
                    ? "Correct answer"
                    : "Mark as correct"
                }
              >
                {question.correctAnswer === option && option.trim() && (
                  <CheckIcon className="w-3 h-3 text-white" strokeWidth={2.2} />
                )}
              </button>

              {/* Option text */}
              <Input
                value={option}
                onChange={(e) => onUpdateOption(optIndex, e.target.value)}
                placeholder={`Option ${optIndex + 1}`}
                className="flex-1 h-9 text-sm"
              />

              {/* Remove option */}
              <button
                type="button"
                onClick={() => onRemoveOption(optIndex)}
                disabled={question.options.length <= 2}
                className="p-1 text-muted-foreground hover:text-destructive rounded opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-all"
                title="Remove option"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddOption}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-dashed border-border hover:border-primary/40 transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            Add option
          </button>
        </div>
      </div>
    </div>
  );
}
