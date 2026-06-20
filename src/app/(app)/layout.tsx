import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      <main className="flex-1 px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </>
  );
}
