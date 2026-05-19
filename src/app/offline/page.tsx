import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Offline mode
        </p>
        <h1 className="mt-4 text-3xl font-serif">You are temporarily offline.</h1>
        <p className="mt-4 text-muted-foreground">
          Suits & Stories has cached the app shell, but this page needs a connection to
          refresh the latest work.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
