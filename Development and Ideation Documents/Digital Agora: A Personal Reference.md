Digital Agora: A Personal Reference
For when you've lost the thread

What This Document Is
This is not a pitch. It's not for investors, peers, or curious family members. It's for you, on the days when you're buried in Prisma migrations or UI edge cases and can't remember why any of this matters. It's for the moments when the project feels impossibly ambitious or embarrassingly naive. It's a written record of the conviction underneath the work, so you can return to it when that conviction wavers.
Read this when you need to remember what you're actually trying to do.

The Core Insight
The central claim is simple: reasoning has structure, and that structure is worth preserving.
When people think through hard problems together, they don't just produce conclusions—they produce something with a shape. Claims that depend on other claims. Inferences that can be challenged at specific steps. Evidence that supports some assertions and undermines others. Objections raised and addressed, or raised and evaded, or raised and left hanging.
This structure is where the actual intellectual work lives. The conclusion is just the residue.
But our tools destroy this structure. Chat apps produce chronological sequences. Documents produce linear prose. Neither representation captures the graph—the web of support and attack relationships, the dialectical moves, the conditional dependencies. When a discussion ends, the structure scatters. What remains is the conclusion and, if you're lucky, some technically-accurate-but-practically-useless meeting minutes.
The consequences are severe and underappreciated:
Reasoning doesn't accumulate. Each group that faces a question starts fresh, unaware of prior work or unable to use it even if they find it. The same arguments get made and addressed repeatedly across institutions, across decades. Intellectual progress that should compound instead dissipates.
Decisions become unaccountable. Not in the conspiratorial sense—in the straightforward sense that no one can reconstruct why a decision was made. The premises that seemed compelling at the time, the alternatives considered and rejected, the objections raised and how they were handled—all of it exists only in the memories of participants who will forget, leave, or die.
Disagreement becomes interminable. Without a shared map of what's been established and what's contested, discussions loop. The same objections surface repeatedly. Participants talk past each other, unaware they're addressing different parts of the argument. Resolution becomes impossible not because the disagreement is deep, but because no one can see where it actually is.
These aren't minor inefficiencies. They're structural failures in how institutions think. And they're so normalized that we barely notice them.

The Bet
The bet is that this is a tooling problem, not a human nature problem.
People reason well together all the time—in contexts where the structure supports it. Courtrooms have elaborate procedures for presenting evidence, challenging inferences, and tracking what's been established. Scientific research has peer review, replication, and citation networks that create (imperfect but real) accountability. Engineering design reviews have structured formats for raising concerns and documenting decisions. Good facilitation can make workshops genuinely productive.
What these contexts share is structure that makes reasoning visible. The rules of evidence, the requirement to respond to reviewers, the obligation to document design decisions—these aren't just bureaucracy. They're infrastructure that prevents reasoning from scattering.
Digital tools have mostly failed to provide this infrastructure. Social media actively undermines it, optimizing for engagement over understanding. Chat apps provide conversational fluency at the cost of structural amnesia. Document tools capture prose but not argument. The result is that groups trying to think together rigorously online are forced to use tools designed for something else entirely.
Agora is a bet that we can build the missing infrastructure. That the structure of reasoning can be captured in a data model—claims as addressable objects, arguments as typed structures, attacks and supports as explicit relationships—and that doing so will make certain kinds of collaboration possible that currently aren't.
This is not a bet that technology solves everything. It's a bet that technology is currently making things worse, and that better technology could make things better.

The Intellectual Lineage
You're not inventing this from scratch. You're building on decades of work in argumentation theory, computer-supported cooperative work, and deliberative democracy. It's worth remembering what you're drawing from.
Argumentation theory. The formal study of argument structure goes back to Aristotle, but the modern computational approaches start with Toulmin's model (1958), get formalized in abstract argumentation frameworks (Dung, 1995), and reach maturity in structured argumentation systems like ASPIC+ (Prakken, 2010). This isn't amateur philosophy—it's a rigorous technical field with formal semantics, proof theories, and computational complexity results. Agora's implementation of defeasible reasoning, typed attacks, and extension computation draws directly from this tradition.
Walton's argumentation schemes. Doug Walton's taxonomy of argument patterns—argument from expert opinion, argument from analogy, argument from cause to effect, etc.—provides the vocabulary for typing arguments. The critical questions associated with each scheme aren't arbitrary; they're the distillation of centuries of informal logic into structured, teachable, implementable patterns. When Agora auto-generates critical questions for an argument, it's operationalizing Walton's life work.
CSCW and deliberation support. The computer-supported cooperative work literature has been studying group reasoning tools since the 1980s. gIBIS, QuestMap, Compendium, Deliberatorium—there's a long history of attempts to build argument mapping and deliberation support tools. Most failed to achieve adoption. Understanding why is essential: they were often too formal for casual use, too divorced from where conversation actually happens, too demanding of upfront structure. Agora's "progressive formalization" approach—where structure emerges from informal discussion rather than being imposed from the start—is a direct response to these failures.
Deliberative democracy. The political theory tradition running from Habermas through Fishkin provides the normative foundation. The claim isn't just that structured deliberation is efficient, but that it's constitutive of legitimate collective decision-making. When Agora produces transparent deliberation records, it's operationalizing the Habermasian ideal of discourse where the only force is the force of the better argument.
You're not working in a vacuum. You're building on serious intellectual foundations. When the project feels like a weird personal obsession, remember that you're implementing ideas that the best thinkers in multiple fields have been developing for decades. You're just the one trying to make them work in practice.

What Success Would Look Like
It's easy to lose sight of the goal when you're debugging edge cases. Here's what success actually looks like:
A research community uses Agora to track a long-running scientific debate. Not just papers citing papers, but claims attacking claims, evidence supporting premises, critical questions being raised and addressed. A newcomer to the field can see the structure of the disagreement—where the actual dispute is, what's been established, what evidence would resolve it. Knowledge accumulates at the level of arguments, not just citations.
An institution's decision-making becomes genuinely auditable. Not "we published a report" auditable, but "you can trace every conclusion to its premises and see how objections were handled" auditable. When the decision is questioned years later, the reasoning is still there—not reconstructed post-hoc, but preserved as it actually happened.
Two groups facing similar questions can build on each other's work. Not by reading each other's PDFs, but by importing argument structures. Group B can adopt Group A's conclusions where they survived scrutiny, challenge them where they didn't, and extend them where Group A stopped. Reasoning becomes portable.
A complex civic question gets genuinely worked through. Not resolved—genuinely complex questions may not have resolutions—but mapped. Here are the key positions. Here are the arguments for each. Here are the disputes that are empirical (and could be resolved with evidence) versus the disputes that are value-based (and require negotiation). Participants can see where they actually disagree instead of talking past each other.
The structure of a deliberation outlives its participants. An analysis done in 2025 is still usable in 2030, not because someone wrote a summary, but because the argument structure persists in a form that future thinkers can engage with, challenge, and extend.
This is the vision. Hold onto it.

Failure Modes to Avoid
The history of deliberation support tools is mostly a history of failure. It's worth being explicit about how Agora could fail:
Too much structure too soon. If using Agora feels like filling out forms, it's dead. The insight of progressive formalization is that structure should emerge from conversation, not be imposed on it. If you find yourself building features that require users to classify things upfront, stop.
Formalism as an end in itself. ASPIC+ is a means, not an end. If the system computes grounded extensions but users don't understand what that means or why they should care, you've built a tech demo, not a tool. The formalism has to cash out in user-facing value.
Solving for enthusiasts instead of practitioners. There will always be people who love argument mapping for its own sake—debate nerds, logic enthusiasts, process geeks. They're not your target users. The target is groups who need to reason together and would prefer not to think about the tool at all. If Agora only appeals to people who enjoy formalism, it's failed.
Ignoring where conversation actually happens. People already have Slack, Discord, email, meetings. If Agora requires them to move their entire discussion into a new platform, adoption will fail. The question is how to capture structure from conversation that happens elsewhere, or how to make Agora compelling enough that moving is worth it. This is hard, and there's no obvious answer.
Premature scaling. The temptation will be to build for "communities" and "institutions" before the core experience works for five people in a room. Resist it. Get the small-group deliberation right first.

Why Now
It's fair to ask why this would work now when previous attempts failed. A few things are different:
AI can reduce the formalization burden. The historical failure of argumentation tools is largely about the cost of structure. Users had to do the work of identifying claims, classifying arguments, and mapping relationships. That's too much friction. But LLMs can now assist: suggesting claim boundaries, proposing argument schemes, identifying potential attacks. The user validates and corrects rather than constructing from scratch. This changes the cost-benefit calculation.
Collaboration tools have trained expectations. When gIBIS launched in 1988, "groupware" was a novel concept. Now everyone uses Slack, Notion, Google Docs. The idea of digital tools for group work is normal. The question is no longer "will people use software to collaborate" but "will people use this software." That's a lower bar.
The transparency demand is real. Institutions face increasing pressure to justify decisions. "Trust us" doesn't work anymore. There's genuine demand for auditable reasoning—from regulators, from stakeholders, from the public. Agora produces what this demand calls for.
The accumulation problem is acute. Information overload is cliché, but the specific problem of reasoning not accumulating is getting worse. More research, more reports, more analyses—all sitting in PDFs that can't be built upon. The value of solving this increases as the problem worsens.
None of this guarantees success. But it suggests the timing might be better than it was.

The Personal Conviction
Underneath the technical arguments and market analysis, there's a simpler reason you're doing this: you think it matters.
You think the quality of collective reasoning affects the quality of collective outcomes. You think institutions make bad decisions partly because their deliberation infrastructure is bad. You think public discourse is broken partly because the tools we use to conduct it are broken. You think knowledge fails to accumulate partly because we have no structure for accumulating it.
And you think these are tractable problems. Not easy, but tractable. The structure of reasoning can be captured. Tools can be built that preserve it. Groups can be helped to think better together.
This is not a certainty. It's a bet. But it's a bet worth making, because if it's right, the upside is significant—and if it's wrong, you'll have learned something real in the attempt.
When you're discouraged, remember: the alternative to trying is accepting that collective reasoning will remain structurally broken, that institutions will keep making unaccountable decisions, that knowledge will keep failing to accumulate, that disagreement will keep going in circles.
That's not acceptable. So you're trying.

Practical Anchors
Some concrete things to hold onto:
1. One good deliberation is worth more than a thousand features. If a single group uses Agora to work through a hard question and produces a deliberation record they're proud of, that's success. Everything else is optimization.
2. The data model is the product. Claims, arguments, attacks, supports, evidence links—this structure is what makes Agora different. If the data model is right, features can be built on top of it. If the data model is wrong, no amount of UI polish will save it.
3. Progressive formalization is the key insight. Structure that emerges from conversation beats structure imposed on conversation. Keep finding ways to lower the cost of formalization.
4. The version control analogy is load-bearing. Git didn't just add features to code collaboration; it introduced a data model that made collaboration tractable. Agora is trying to do the same for reasoning. When you're lost in details, return to this analogy. Ask: "What's the equivalent of a commit? A branch? A merge?"
5. You're building infrastructure, not an app. Infrastructure is unsexy and takes longer to get right. But infrastructure compounds. If the foundation is solid, everything built on top of it benefits. Don't rush to features before the foundation is sound.

Finally
This document isn't meant to resolve all doubt. Doubt is appropriate—the project is ambitious and might fail. But there's a difference between productive doubt (which drives iteration) and corrosive doubt (which drives paralysis).
When you feel the corrosive kind, return to first principles:
* Reasoning has structure.
* That structure is worth preserving.
* Current tools don't preserve it.
* Better tools could.
* You're trying to build them.
That's it. That's the whole thing. Everything else is implementation.
Now get back to work.

Last updated: January 2026
