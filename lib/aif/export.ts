// //lib/aif/export.ts
// import ctx from './context.json';
// import { prisma } from '@/lib/prismaclient';

// type Json = Record<string, any>;

// function N(type: string, id: string, extra: Json = {}) {
//   return { '@id': id, '@type': type, ...extra };
// }
// function E(from: string, to: string, role: string) {
//   return { '@id': `:e_${from.replace(':','|')}_${role}_${to.replace(':','|')}`, '@type': 'aif:Edge', role, from, to };
// }

// const idI  = (cid: string) => `:I|${cid}`;
// const idRA = (aid: string) => `:RA|${aid}`;
// const idCA = (cid: string) => `:CA|${cid}`;
// const idPA = (pid: string) => `:PA|${pid}`;
// const idPM = (wid: string) => `:PM|${wid}`;      // Pascal meta bundle per Work(=theoryWork)


// export async function exportDeliberationAsAifJSONLD(deliberationId: string) {
  
//   const [ moves] = await Promise.all([
//     prisma.claim.findMany({ where: { deliberationId } }),
//     prisma.argument.findMany({
//       where: { deliberationId },
//       include: { scheme: true, premises: true, conclusion: true }
//     }),
//     prisma.argumentEdge.findMany({ where: { deliberationId } }),
//     prisma.dialogueMove.findMany({ where: { deliberationId } })
//   ]);

// function n(type: string, id: string, extra: any = {}) {
//   return { '@id': `:${id}`, '@type': type, ...extra };
// }
// function edge(from: string, to: string, role: 'premise'|'conclusion'|'conflictingElement'|'conflictedElement'|'preferredElement'|'dispreferredElement') {
//   return { '@id': `:e_${from}_${role}_${to}`, '@type': 'aif:Edge', role, from: `:${from}`, to: `:${to}` };
// }
//   const N: any[] = [];
//   const E: any[] = [];


// const claims = await prisma.claim.findMany({ where:{ deliberationId }, select:{ id:true, text:true } });
// const args   = await prisma.argument.findMany({ where:{ deliberationId }, include:{ premises:{ select:{ claimId:true } }, conclusion:true, scheme:true } });
// const cas    = await prisma.conflictApplication.findMany({ where:{ deliberationId }, include:{ scheme:true } });
// const pas    = await prisma.preferenceApplication.findMany({ where:{ deliberationId }, include:{ scheme:true } });

// const idI  = (cid:string)=>`I|${cid}`;
// const idRA = (aid:string)=>`RA|${aid}`;
// const idCA = (cid:string)=>`CA|${cid}`;
// const idPA = (pid:string)=>`PA|${pid}`;

// const nodes:any[] = [];
// const edges:any[] = [];


// // const nodes:any[] = [];
// // const edges:any[] = [];

// // // I-nodes (Claims)
// // for (const c of claims) nodes.push(n('aif:InformationNode', `I_${c.id}`, { text: c.text ?? '' }));

// // // RA-nodes (Arguments)
// // for (const a of args) nodes.push(n('aif:RA', `RA_${a.id}`, { schemeKey: a.schemeId ?? null }));

// // // Premises & conclusion edges
// // for (const a of args) {
// //   for (const p of a.premises) edges.push(edge(`I_${p.claimId}`, `RA_${a.id}`, 'premise'));
// //   edges.push(edge(`RA_${a.id}`, `I_${a.conclusionClaimId}`, 'conclusion'));
// // }

// // CA-nodes
// for (const ca of conflictApps) {
//   const caId = `CA_${ca.id}`; nodes.push(n('aif:CA', caId, { schemeKey: ca.schemeKey ?? null }));
//   const confFrom = ca.conflictingArgumentId ? `RA_${ca.conflictingArgumentId}` : `I_${ca.conflictingClaimId}`;
//   const confTo   = ca.conflictedArgumentId  ? `RA_${ca.conflictedArgumentId}`  : `I_${ca.conflictedClaimId}`;
//   edges.push(edge(confFrom, caId, 'conflictingElement'));
//   edges.push(edge(caId, confTo, 'conflictedElement'));
// }

// // PA-nodes
// for (const pa of preferenceApps) {
//   const paId = `PA_${pa.id}`; nodes.push(n('aif:PA', paId, { schemeKey: pa.schemeKey ?? null }));
//   const prefFrom = pa.preferredArgumentId ? `RA_${pa.preferredArgumentId}` : `I_${pa.preferredClaimId}`;
//   const prefTo   = pa.dispreferredArgumentId ? `RA_${pa.dispreferredArgumentId}` : `I_${pa.dispreferredClaimId}`;
//   edges.push(edge(prefFrom, paId, 'preferredElement'));
//   edges.push(edge(paId, prefTo, 'dispreferredElement'));
// }
  
//   // I-nodes
//   for (const c of claims) {
//     N.push({ "@id": `I:${c.id}`, "@type": "aif:InformationNode", text: c.text });
//   }

//   // RA-nodes
//   for (const a of args) {
//     N.push({
//       "@id": `S:${a.id}`,
//       "@type": "aif:RA",
//       "usesScheme": a.scheme?.key ?? null
//     });
//     for (const p of a.premises)
//       E.push({ from: `I:${p.claimId}`, to: `S:${a.id}`, role: "aif:Premise" });

//     E.push({ from: `S:${a.id}`, to: `I:${a.conclusionClaimId}`, role: "aif:Conclusion" });
//   }

//   // CA-nodes (one CA node per edge)
//   for (const e of edges) {
//     const caId = `CA:${e.id}`;
//     N.push({
//       "@id": caId, "@type": "aif:CA",
//       "attackType": e.attackType, "targetScope": e.targetScope, "cqKey": e.cqKey ?? null
//     });
//     // premise into CA is the conclusion of the attacking RA
//     const attacker = args.find(a => a.id === e.fromArgumentId)!;
//     E.push({ from: `I:${attacker.conclusionClaimId}`, to: caId, role: "aif:Premise" });

//     if (e.targetScope === 'conclusion' && e.targetClaimId) {
//       E.push({ from: caId, to: `I:${e.targetClaimId}`, role: "aif:Attacks" });
//     } else if (e.targetScope === 'inference' && e.toArgumentId) {
//       E.push({ from: caId, to: `S:${e.toArgumentId}`, role: "aif:Attacks" });
//     } else if (e.targetScope === 'premise' && e.targetPremiseId) {
//       E.push({ from: caId, to: `I:${e.targetPremiseId}`, role: "aif:Attacks" });
//     }
//   }

//   // L-nodes (locutions)
//   for (const m of moves) {
//     N.push({
//       "@id": `L:${m.id}`,
//       "@type": "aif:L",
//       "illocution": m.illocution,
//       "text": m.payload?.expression ?? null
//     });
//     if (m.argumentId) {
//       E.push({ from: `L:${m.id}`, to: `S:${m.argumentId}`, role: "aif:Illocutes" });
//     } else if (m.contentClaimId) {
//       E.push({ from: `L:${m.id}`, to: `I:${m.contentClaimId}`, role: "aif:Illocutes" });
//     }
//     if (m.replyToMoveId) {
//       E.push({ from: `L:${m.replyToMoveId}`, to: `L:${m.id}`, role: "aif:Replies" });
//     }
//   }

// //   return { "@context": ctx["@context"], nodes: N, edges: E };

// // // I-nodes
// // for (const c of claims) nodes.push({ '@id': idI(c.id), '@type':'aif:InformationNode', text: c.text ?? '' });

// // // RA-nodes + role edges
// // for (const a of args) {
// //   nodes.push({ '@id': idRA(a.id), '@type':'aif:RA', scheme: a.scheme?.key ?? null });
// //   for (const p of a.premises) edges.push({ '@type':'aif:Premise',    from: idI(p.claimId), to: idRA(a.id) });
// //   if (a.conclusionClaimId)   edges.push({ '@type':'aif:Conclusion', from: idRA(a.id),     to: idI(a.conclusionClaimId) });
// // }

// // // CA-nodes + role edges
// // for (const ca of cas) {
// //   nodes.push({ '@id': idCA(ca.id), '@type':'aif:CA', scheme: ca.scheme?.key ?? null });
// //   const conflicting = ca.conflictingArgumentId ? idRA(ca.conflictingArgumentId) : idI(ca.conflictingClaimId!);
// //   const conflicted  = ca.conflictedArgumentId  ? idRA(ca.conflictedArgumentId)  : idI(ca.conflictedClaimId!);
// //   // NB: S→S allowed; I→I disallowed except via this CA node (we comply)
// //   edges.push({ '@type':'aif:ConflictingElement', from: conflicting, to: idCA(ca.id) });
// //   edges.push({ '@type':'aif:ConflictedElement',  from: idCA(ca.id), to:  conflicted });
// // }

// // // PA-nodes + role edges
// // const ref = (cid?:string, aid?:string, sid?:string) => aid ? idRA(aid) : (cid ? idI(cid) : (sid ? `SCH|${sid}` : ''));
// // for (const pa of pas) {
// //   nodes.push({ '@id': idPA(pa.id), '@type':'aif:PA', scheme: pa.scheme?.key ?? null });
// //   const pref = ref(pa.preferredClaimId, pa.preferredArgumentId, pa.preferredSchemeId);
// //   const disp = ref(pa.dispreferredClaimId, pa.dispreferredArgumentId, pa.dispreferredSchemeId);
// //   edges.push({ '@type':'aif:PreferredElement',    from: pref,   to: idPA(pa.id) });
// //   edges.push({ '@type':'aif:DispreferredElement', from: idPA(pa.id), to: disp   });
// // }


//   // Optional: AIF+ locutions (minimal)
//   for (const m of moves) {
//     const L = `:L|${m.id}`;
//     nodes.push(N('aif:L', L, { illocution: m.illocution ?? null, text: m.payload?.expression ?? null }));
//     if (m.argumentId)      edges.push(E(L, idRA(m.argumentId), 'aif:Illocutes'));
//     else if (m.contentClaimId) edges.push(E(L, idI(m.contentClaimId), 'aif:Illocutes'));
//     if (m.replyToMoveId)   edges.push(E(`:L|${m.replyToMoveId}`, L, 'aif:Replies'));
//   }

//   // OP/Pascal preconditions bundle (if any OP work w/ pascal model exists)
//   const opWithPascal = works.find(w => !!w.pascal);
//   if (opWithPascal?.pascal) {
//     const { propositions, actions, utilities, method, assumption } = opWithPascal.pascal as any;
//     nodes.push(N('aif:PascalMeta', idPM(opWithPascal.id), {
//       workId: opWithPascal.id,
//       method,                                       // 'laplace' | 'minimax' | 'regret'
//       assumption: assumption ?? null,               // TOP2/TOP3 support text
//       propositions, actions, utilities              // matrix to reconstruct expected desirability
//     }));
//     // Link PascalMeta to any OP claims (optional; safe no-op if none)
//     for (const rc of await prisma.theoryWorkClaim.findMany({ where: { workId: opWithPascal.id } })) {
//       edges.push(E(idPM(opWithPascal.id), idI(rc.claimId), 'aif:Annotates'));
//     }
//   }

//   return {
//     "@context": ctx["@context"],
//     "nodes": nodes,
//     "edges": edges
//   };
// }
// lib/aif/export.ts
import ctx from './context.json';
import { prisma } from '@/lib/prismaclient';

type Json = Record<string, any>;

function N(type: string, id: string, extra: Json = {}) {
  return { '@id': id, '@type': type, ...extra };
}
function E(from: string, to: string, role: string) {
  return { '@id': `:e_${from.replace(':','|')}_${role}_${to.replace(':','|')}`, '@type': 'aif:Edge', role, from, to };
}

const idI  = (cid: string) => `:I|${cid}`;
const idRA = (aid: string) => `:RA|${aid}`;
const idCA = (cid: string) => `:CA|${cid}`;
const idPA = (pid: string) => `:PA|${pid}`;
const idPM = (wid: string) => `:PM|${wid}`;      // Pascal meta bundle per Work(=theoryWork)

export async function exportDeliberationAsAifJSONLD(deliberationId: string) {
  // Pull graph primitives (+ optional preferences if you have them)
  const [claims, args, cas, pas, moves, works] = await Promise.all([
    prisma.claim.findMany({ where:{ deliberationId }, select:{ id:true, text:true } }),
    prisma.argument.findMany({
      where:{ deliberationId },
      include:{ premises:{ select:{ claimId:true } }, conclusion:true, scheme:true }
    }),
    prisma.conflictApplication.findMany({ where:{ deliberationId }, include:{ scheme:true } }),
    prisma.preferenceApplication.findMany({ where:{ deliberationId }, include:{ scheme:true } }),
    prisma.dialogueMove.findMany({ where:{ deliberationId } }),
    prisma.theoryWork.findMany({
      where: { deliberationId, theoryType: 'OP' },
      include: { pascal: true }
    })
  ]);

  const nodes: any[] = [];
  const edges: any[] = [];

  // I-nodes
  for (const c of claims) nodes.push(N('aif:InformationNode', idI(c.id), { text: c.text ?? '' }));

  // RA-nodes + premise/conclusion edges
  for (const a of args) {
    nodes.push(N('aif:RA', idRA(a.id), { schemeKey: a.scheme?.key ?? null }));
    for (const p of a.premises) edges.push(E(idI(p.claimId), idRA(a.id), 'aif:Premise'));
    if (a.conclusionClaimId) edges.push(E(idRA(a.id), idI(a.conclusionClaimId), 'aif:Conclusion'));
  }

  // CA-nodes (conflicts)
  for (const ca of cas) {
    const thisCA = idCA(ca.id);
    nodes.push(N('aif:CA', thisCA, { schemeKey: ca.scheme?.key ?? null, attackType: ca.attackType ?? null, targetScope: ca.targetScope ?? null }));
    const conflicting = ca.conflictingArgumentId ? idRA(ca.conflictingArgumentId) : idI(ca.conflictingClaimId!);
    const conflicted  = ca.conflictedArgumentId  ? idRA(ca.conflictedArgumentId)  : idI(ca.conflictedClaimId!);
    edges.push(E(conflicting, thisCA, 'aif:ConflictingElement'));
    edges.push(E(thisCA,      conflicted, 'aif:ConflictedElement'));
  }

  // PA-nodes (preferences)
  for (const pa of pas) {
    const thisPA = idPA(pa.id);
    nodes.push(N('aif:PA', thisPA, { schemeKey: pa.scheme?.key ?? null }));
    const preferred     = pa.preferredArgumentId     ? idRA(pa.preferredArgumentId)     : idI(pa.preferredClaimId!);
    const dispreferred  = pa.dispreferredArgumentId  ? idRA(pa.dispreferredArgumentId)  : idI(pa.dispreferredClaimId!);
    edges.push(E(preferred,    thisPA, 'aif:PreferredElement'));
    edges.push(E(thisPA, dispreferred, 'aif:DispreferredElement'));
  }

  // Optional: AIF+ locutions (minimal)
  for (const m of moves) {
    const L = `:L|${m.id}`;
    nodes.push(N('aif:L', L, { illocution: m.illocution ?? null, text: m.payload?.expression ?? null }));
    if (m.argumentId)      edges.push(E(L, idRA(m.argumentId), 'aif:Illocutes'));
    else if (m.contentClaimId) edges.push(E(L, idI(m.contentClaimId), 'aif:Illocutes'));
    if (m.replyToMoveId)   edges.push(E(`:L|${m.replyToMoveId}`, L, 'aif:Replies'));
  }

  // OP/Pascal preconditions bundle (if any OP work w/ pascal model exists)
  const opWithPascal = works.find(w => !!w.pascal);
  if (opWithPascal?.pascal) {
    const { propositions, actions, utilities, method, assumption } = opWithPascal.pascal as any;
    nodes.push(N('aif:PascalMeta', idPM(opWithPascal.id), {
      workId: opWithPascal.id,
      method,                                       // 'laplace' | 'minimax' | 'regret'
      assumption: assumption ?? null,               // TOP2/TOP3 support text
      propositions, actions, utilities              // matrix to reconstruct expected desirability
    }));
    // Link PascalMeta to any OP claims (optional; safe no-op if none)
    for (const rc of await prisma.theoryWorkClaim.findMany({ where: { workId: opWithPascal.id } })) {
      edges.push(E(idPM(opWithPascal.id), idI(rc.claimId), 'aif:Annotates'));
    }
  }

  return {
    "@context": ctx["@context"],
    "nodes": nodes,
    "edges": edges
  };
}
