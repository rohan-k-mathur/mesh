export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="max-w-[720px] mx-auto py-8">
      {/* tab nav placeholder */}
      {children}
    </section>
  );
}
