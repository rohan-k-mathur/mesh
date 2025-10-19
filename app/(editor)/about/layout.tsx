import '@/app/globals.css';
import '@/app/article.templates.css';   // <— single import
// import './article.global.scss';
// import "@app/editor/editor.global.css";
import '@/app/fonts/fonts.css';
import "@/app/article/type-tokens.css";



export const metadata = { title: 'Write an article' };

export default function EditorLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 m-0 p-0 overflow-auto">
      {children}
    </div>
  );
}

