"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addProgramMember,
  createAcceleratorProgram,
  initAcceleratorProgramPayment,
  removeProgramMember,
} from "@/actions/program";

type CourseOption = {
  id: string;
  title: string;
  price: number;
  currency: string;
};

export function NewProgramButton({ courses }: { courses: CourseOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createAcceleratorProgram({
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      courseId: formData.get("courseId") as string,
      seatsPurchased: Number(formData.get("seatsPurchased") || 1),
      participants: formData.get("participants") as string,
      notes: formData.get("notes") as string,
    });

    setLoading(false);
    if (result.success) {
      form.reset();
      setOpen(false);
      router.refresh();
    } else {
      setMessage(result.error || "Could not create program");
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={courses.length === 0}>
        New Program
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <button
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-border bg-card p-5 shadow-xl sm:max-w-2xl sm:rounded-xl sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-medium text-foreground">Create Accelerator Program</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Buy one course package for a cohort and assign seats to entrepreneurs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="program-name">Program</Label>
                  <Input id="program-name" name="name" required className="mt-1" placeholder="Summer Pitch Camp" />
                </div>
                <div>
                  <Label htmlFor="program-company">Company</Label>
                  <Input id="program-company" name="company" required className="mt-1" placeholder="Accelerator or sponsor" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div>
                  <Label htmlFor="program-course">Course</Label>
                  <select
                    id="program-course"
                    name="courseId"
                    required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} · {formatMoney(course.price, course.currency)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="program-seats">Seats</Label>
                  <Input
                    id="program-seats"
                    name="seatsPurchased"
                    required
                    min={1}
                    max={500}
                    defaultValue={10}
                    type="number"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="program-participants">Entrepreneurs</Label>
                <Textarea
                  id="program-participants"
                  name="participants"
                  rows={6}
                  className="mt-1"
                  placeholder={"Amina Mensah <amina@venture.com>\nkwame@startup.com"}
                />
              </div>

              <div>
                <Label htmlFor="program-notes">Notes</Label>
                <Textarea id="program-notes" name="notes" rows={3} className="mt-1" />
              </div>

              {message && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {message}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Program"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ProgramPaymentButton({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handlePayment() {
    setLoading(true);
    setMessage(null);
    const result = await initAcceleratorProgramPayment(programId);
    setLoading(false);

    if (result.success && result.checkoutUrl) {
      router.push(result.checkoutUrl);
      return;
    }

    setMessage(result.error || "Could not start payment");
  }

  return (
    <div className="space-y-2">
      <Button onClick={handlePayment} disabled={loading} className="w-full">
        {loading ? "Preparing..." : "Pay Package"}
      </Button>
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  );
}

export function AddProgramMemberForm({ programId }: { programId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await addProgramMember({
      programId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    });
    setLoading(false);

    if (result.success) {
      form.reset();
      router.refresh();
    } else {
      setMessage(result.error || "Could not add member");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input name="name" placeholder="Name" />
        <Input name="email" type="email" required placeholder="email@company.com" />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>
      {message && <p className="text-xs text-destructive">{message}</p>}
    </form>
  );
}

export function RemoveProgramMemberButton({
  programId,
  memberId,
}: {
  programId: string;
  memberId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setLoading(true);
    await removeProgramMember(programId, memberId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
    >
      {loading ? "..." : "Remove"}
    </button>
  );
}

function formatMoney(amount: number, currency: string) {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
