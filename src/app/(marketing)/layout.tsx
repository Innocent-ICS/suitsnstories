import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 pt-[calc(5rem+env(safe-area-inset-top))]">{children}</main>
      <Footer />
    </div>
  );
}
