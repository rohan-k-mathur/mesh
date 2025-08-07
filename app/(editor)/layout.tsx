import '@/app/globals.css';
import '@/app/article.templates.css';   // <— single import
// import './article.global.scss';
import "./editor.global.css";
export const metadata = { title: 'Write an article' };

export default function EditorLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Tailwind ‘h-screen’ makes the editor fill the viewport */}
      <body className=" justify-center items-center align-center mt-9  p-4 h-full w-full overflow-auto bg-slate-500">
        {children}
      </body>
    </html>
  );
}