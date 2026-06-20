import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </>
  );
}
