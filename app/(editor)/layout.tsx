 import "../globals.css";
// import './article.global.scss';
import './editor.global.css';
export const metadata = { title: 'Write an article' };

export default function EditorLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Tailwind ‘h-screen’ makes the editor fill the viewport */}
      <body className="justify-center items-center p-4 h-[500px] w-[90%] overflow-auto bg-slate-500">
        {children}
      </body>
    </html>
  );
}