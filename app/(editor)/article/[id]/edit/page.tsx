export const metadata = { title: 'Write an article' };

export default function EditorLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Tailwind ‘h-screen’ makes the editor fill the viewport */}
      <body className="h-screen overflow-hidden bg-slate-100">
        {children}
      </body>
    </html>
  );
}
