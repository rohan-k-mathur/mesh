// lib/argumentation/ecc.ts
export type DerivationId = string;

export type Arrow<A=string,B=string> = {
  from: A; to: B;
  // finite set of derivation ids (each has its own assumption set, scheme, sources)
  derivs: Set<DerivationId>;
};

// Join (accrual): union of derivations
export function join<A,B>(f: Arrow<A,B>, g: Arrow<A,B>): Arrow<A,B> {
  if (f.from !== g.from || f.to !== g.to) throw new Error('join: type mismatch');
  return { from: f.from, to: f.to, derivs: new Set([...f.derivs, ...g.derivs]) };
}

// Zero: empty set (vacuous support)
export function zero<A,B>(from:A, to:B): Arrow<A,B> {
  return { from, to, derivs: new Set() };
}

// Composition: pointwise compose derivations (pairs)
export function compose<A,B,C>(g: Arrow<B,C>, f: Arrow<A,B>): Arrow<A,C> {
  // semantics: each composed derivation references an ordered pair (d_f, d_g)
  const out = zero<A,C>(f.from, g.to);
  for (const df of f.derivs) for (const dg of g.derivs) {
    out.derivs.add(`${df}∘${dg}`);
  }
  return out;
}
