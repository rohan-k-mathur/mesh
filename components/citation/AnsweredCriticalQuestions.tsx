import { CheckCircle2, HelpCircle, ExternalLink } from "lucide-react";

/**
 * One answered critical question with its canonical answer, assembled in the
 * argument page from the attestation aggregate (question text + status) joined
 * to the canonical `CQResponse` (the answer body + sources).
 */
export type AnsweredCriticalQuestion = {
  cqKey: string;
  question: string;
  answer: string;
  sourceUrls: string[];
  schemeKey: string | null;
  answeredAt: string | null;
};

/**
 * Public-page section that surfaces the critical questions this argument has
 * satisfied. Critical questions are the literature-required challenges a
 * scheme must withstand; a *satisfied* one carries a canonical answer. Renders
 * nothing when the argument has no answered CQs, so it stays invisible until it
 * has something to say.
 */
export default function AnsweredCriticalQuestions({
  items,
}: {
  items: AnsweredCriticalQuestion[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-2xl p-6 mb-6 panelv2">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/15 text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-[12px] font-bold tracking-[0.1em] uppercase text-slate-700">
          Answered critical questions ({items.length})
        </h3>
      </div>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Critical questions are the challenges this argument&rsquo;s reasoning
        pattern must withstand. 
      </p>

      <ul className="flex flex-col gap-3">
        {items.map((cq) => (
          <li
            key={cq.cqKey}
            className="border border-emerald-200/70 bg-emerald-50/30 rounded-xl overflow-hidden"
          >
            <div className="flex items-start gap-2 px-4 py-3 bg-emerald-50/60 border-b border-emerald-200/60">
              <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-slate-800 leading-snug flex-1">
                {cq.question}
              </span>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-emerald-700">
                  Answer
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {cq.answer}
              </p>
              {cq.sourceUrls.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-1 pt-2.5 border-t border-emerald-200/50">
                  {cq.sourceUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-mono break-all"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
