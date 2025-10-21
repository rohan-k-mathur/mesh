// lib/argumentation/schemeInference.ts
import { inferSchemesFromText, type SchemeId } from './criticalQuestions';
import { prisma } from '@/lib/prismaclient';

/**
 * Infers and assigns an argumentation scheme to an argument based on text analysis.
 * Falls back to 'Consequences' if no clear scheme is detected.
 *
 * @param argumentText - The text of the argument
 * @param conclusionText - Optional text of the conclusion claim
 * @returns Scheme ID (database ID) or null if no scheme found
 */
export async function inferAndAssignScheme(
  argumentText: string,
  conclusionText?: string
): Promise<string | null> {
  const combined = [argumentText, conclusionText].filter(Boolean).join(' ');

  // Use existing inference from criticalQuestions.ts
  let schemes = inferSchemesFromText(combined);

  // Default fallback if no scheme detected
  if (schemes.length === 0) {
    schemes.push('Consequences'); // most general scheme
  }

  // Lookup scheme row by key (SchemeId maps to ArgumentationScheme.key)
  const schemeRow = await prisma.argumentationScheme.findFirst({
    where: { key: schemes[0] },
    select: { id: true, key: true }
  });

  if (schemeRow) {
    console.log(`[schemeInference] Assigned scheme "${schemeRow.key}" to argument with text: "${argumentText.slice(0, 50)}..."`);
  } else {
    console.warn(`[schemeInference] No matching scheme found for key "${schemes[0]}", falling back to null`);
  }

  return schemeRow?.id ?? null;
}

/**
 * Batch infer schemes for multiple arguments.
 * Useful for backfilling existing arguments.
 *
 * @param args - Array of { id, text, conclusionText? }
 * @returns Map of argumentId → schemeId
 */
export async function batchInferSchemes(
  args: Array<{ id: string; text: string; conclusionText?: string }>
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  for (const arg of args) {
    const schemeId = await inferAndAssignScheme(arg.text, arg.conclusionText);
    results.set(arg.id, schemeId);
  }

  return results;
}
