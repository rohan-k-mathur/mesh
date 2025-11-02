Batch 1: Witness, Popular Opinion, and Popular Practice
Argument from Witness Testimony
A witness is someone who was present at an event and can report what happened based on direct observation.
Argument from witness testimony
ComponentContentMajor premise:Witness W was in a position to observe whether event E occurred.Minor premise:W asserts that E occurred (or did not occur).Conclusion:Therefore, E occurred (or did not occur).
Critical questions for argument from witness testimony
IDQuestionTypeCQ1:Is W internally consistent in the testimony?TrustworthinessCQ2:Is W an honest person?ReliabilityCQ3:Is W biased?BiasCQ4:Is the testimony corroborated by other witnesses?ConsistencyCQ5:Is the testimony corroborated by evidence?Backup evidenceCQ6:Is W's testimony credible?Credibility

Argument from Popular Opinion
This scheme appeals to what most people believe or accept as true.
Argument from popular opinion
ComponentContentMajor premise:A is generally accepted as true (by most people, or in a particular community).Minor premise:(Implicit: What most people accept is presumed to be true.)Conclusion:Therefore, there is a presumption that A is true.
Critical questions for argument from popular opinion
IDQuestionTypeCQ1:What evidence supports the claim that A is generally accepted?Evidence for acceptanceCQ2:Is the group cited representative of the relevant population?RepresentativenessCQ3:Are there other groups whose opinion differs from the cited group?Alternative opinionsCQ4:What is the basis for the popular acceptance of A?Grounds for beliefCQ5:Is this a domain where popular opinion is a reliable indicator of truth?Domain appropriateness

Argument from Popular Practice
This scheme argues that because most people do something, it is acceptable or should be done.
Argument from popular practice
ComponentContentMajor premise:If a large majority (everyone, nearly everyone) does X, then there is a presumption that X is the right (acceptable, approved) thing to do.Minor premise:A large majority (everyone, nearly everyone) does X.Conclusion:Therefore, there is a presumption that X is the right (acceptable, approved) thing to do.
Critical questions for argument from popular practice
IDQuestionTypeCQ1:What evidence supports the claim that most people do X?Evidence for practiceCQ2:Are the people who do X representative?RepresentativenessCQ3:Is there some reason why the majority might be wrong to do X?ExceptionCQ4:Is this a domain where popular practice is a reliable guide to proper action?Domain appropriatenessCQ5:Does the practice of the majority violate ethical standards?Ethical consideration

These first three schemes follow Walton's framework from the 1996 and 2008 texts. The critical questions systematically map to the three types of counterarguments in your AIF implementation:

Undermining attacks target premise truth (CQs about evidence)
Undercutting attacks target the inferential link (CQs about domain appropriateness, assumptions)
Rebutting attacks target the conclusion (CQs about exceptions, alternative conclusions)


* Argument from composition
* Argument from division
* Argument from oppositions
* Argument from alternatives

Organized five argumentation schemes and consulted existing knowledge resources.The user wants me to continue building out the argumentation schemes in the same format. Let me create the next five schemes:

Argument from example
Argument from composition
Argument from division
Argument from oppositions
Argument from alternatives

I need to search for the authoritative formulations of these schemes from Walton's work, particularly from the 2008 book with Reed and Macagno, or the 1996 book. Let me search the project knowledge first to see if there are any existing implementations or notes on these schemes.Batch 2: Example, Composition, Division, Oppositions, and Alternatives
Argument from Example
This scheme reasons from a particular case to a general rule, then applies that rule to justify a conclusion about another particular case.
Argument from example
ComponentContentMajor premise:In this particular case C, individual a has property F and also property G.Minor premise:Therefore, generally, if x has property F, then x also has property G.Conclusion:(Applying the generalization to a new case) Individual b has property F, therefore b also has property G.
Critical questions for argument from example
IDQuestionTypeCQ1:Is the example cited representative of the population?RepresentativenessCQ2:Are there other relevant examples that would support a different conclusion?CounterexamplesCQ3:Is the number of examples sufficient to support the generalization?Sample sizeCQ4:Are there relevant differences between the cited example and the case to which the conclusion is being applied?DisanalogyCQ5:Is the property F genuinely causally or evidentially connected to property G?Causal/evidential link

Argument from Composition
This scheme infers properties of a whole from properties of its parts.
Argument from composition
ComponentContentMajor premise:The parts (or members) of the whole W all have property F.Minor premise:(Implicit: What is true of the parts is true of the whole.)Conclusion:Therefore, the whole W has property F.
Critical questions for argument from composition
IDQuestionTypeCQ1:Do all the parts really have property F?Universal premiseCQ2:Is F the kind of property that transfers from parts to wholes?Property transferCQ3:Are there emergent properties of the whole that differ from the parts?EmergenceCQ4:Is the composition of the parts the only relevant factor for F in the whole?Other factorsCQ5:Are the parts organized in a way that affects whether F applies to the whole?Structural consideration

Argument from Division
This scheme infers properties of parts from properties of the whole (the inverse of composition).
Argument from division
ComponentContentMajor premise:The whole W has property F.Minor premise:(Implicit: What is true of the whole is true of its parts.)Conclusion:Therefore, the parts (or members) of W have property F.
Critical questions for argument from division
IDQuestionTypeCQ1:Does the whole really have property F?Premise truthCQ2:Is F the kind of property that transfers from wholes to parts?Property transferCQ3:Are there properties of the whole that do not distribute to the parts?Non-distributive propertyCQ4:Do all parts have F, or only some?UniversalityCQ5:Are there specific parts that are exceptions?Exceptions

Argument from Oppositions
This scheme argues that one of two opposing alternatives must be true (or false) based on the status of the other.
Argument from oppositions
ComponentContentMajor premise:A and B are opposites (contraries or contradictories).Minor premise:A is true (false).Conclusion:Therefore, B is false (true).
Critical questions for argument from oppositions
IDQuestionTypeCQ1:Are A and B really opposites?Opposition relationCQ2:Are A and B contradictories (cannot both be true, cannot both be false) or contraries (cannot both be true, but can both be false)?Type of oppositionCQ3:If contraries, is there a third alternative that could be true?Excluded middleCQ4:Is the premise that A is true (false) actually established?Premise truthCQ5:Are there contextual factors that affect the opposition?Context dependence
Note: Walton also identifies a "Rhetorical Argument from Oppositions" variant that emphasizes persuasive rather than logical force.

Argument from Alternatives
This scheme argues by eliminating alternatives until only one remains (disjunctive syllogism or elimination reasoning).
Argument from alternatives
ComponentContentMajor premise:Either A₁, or A₂, ... or Aₙ is true (these are the alternatives).Minor premise:A₂, A₃, ... Aₙ are false (all alternatives except A₁ are eliminated).Conclusion:Therefore, A₁ is true.
Critical questions for argument from alternatives
IDQuestionTypeCQ1:Are the alternatives listed exhaustive (do they cover all possibilities)?ExhaustivenessCQ2:Are the alternatives mutually exclusive?ExclusivityCQ3:Have all the rejected alternatives really been eliminated?Elimination adequacyCQ4:What evidence supports the elimination of each alternative?Evidence for eliminationCQ5:Are there other alternatives not considered?Missing alternativesCQ6:Is the reasoning for eliminating each alternative sound?Soundness of elimination

Implementation Notes for Digital Agora
These schemes map naturally to your AIF architecture:

Composition/Division: These create interesting graph structures where part-whole relationships affect argument structure. Your Prisma schema could potentially model these with special edge types.
Oppositions: This connects directly to your conflict detection system (CA-Nodes in AIF). The distinction between contraries and contradictories is formally significant for your grounded semantics computation.
Alternatives: This is essentially the formal basis for "pro/con" reasoning but more sophisticated. It's the foundation for deliberation dialogues where options must be considered and eliminated systematically.
Example: This is inductive/analogical reasoning - particularly important for case-based reasoning in policy contexts.


Batch 3: Classification, Definition, and Act-Person Interaction
Argument from Verbal Classification
This scheme classifies an individual case under a general category term, then applies what is known about the category to the individual case.
Argument from verbal classification
ComponentContentMajor premise:If some particular thing a has property F, then a can be classified as having property G.Minor premise:In this case, a has property F.Conclusion:Therefore, in this case, a has property G.
Alternative formulation:
ComponentContentMajor premise:For all x, if x has property F, then x can be classified as having property G.Minor premise:Individual a has property F.Conclusion:Therefore, a has property G.
Critical questions for argument from verbal classification
IDQuestionTypeCQ1:Does a definitely have property F, or is there room for doubt?Premise verificationCQ2:Is the verbal classification in the major premise acceptable?Classification validityCQ3:Are there exceptional circumstances in this case that would prevent the classification from holding?ExceptionsCQ4:Is the boundary of the classification category clear?Boundary clarityCQ5:Are there alternative classifications that might apply?Alternative categories

Argument from Definition to Verbal Classification
This scheme uses an established definition to justify classifying something under a term.
Argument from definition to verbal classification
ComponentContentMajor premise:a has properties F₁, F₂, ... Fₙ.Minor premise:For all x, if x has properties F₁, F₂, ... Fₙ, then x can be classified as having property G (by definition).Conclusion:Therefore, a has property G.
Alternative formulation emphasizing the definitional component:
ComponentContentMajor premise:By definition, G means having properties F₁, F₂, ... Fₙ.Minor premise:Individual a has properties F₁, F₂, ... Fₙ.Conclusion:Therefore, a is (can be classified as) G.
Critical questions for argument from definition to verbal classification
IDQuestionTypeCQ1:Does a really have all the properties F₁, F₂, ... Fₙ listed?Premise verificationCQ2:Is the definition of G acceptable and authoritative?Definition legitimacyCQ3:Is the definition stipulative, lexical, or precising?Definition typeCQ4:Are the defining properties F₁, F₂, ... Fₙ sufficient for G?SufficiencyCQ5:Are the defining properties necessary for G?NecessityCQ6:Is the context one where this definition appropriately applies?Context appropriateness

Argument from Vagueness of a Verbal Classification
This scheme challenges a classification by pointing out that the term used is vague and the case falls in a borderline area.
Argument from vagueness of a verbal classification
ComponentContentMajor premise:Term t is vague (has borderline cases).Minor premise:a appears to be a borderline case for the application of t.Conclusion:Therefore, the claim that a falls under t is not clearly established (is open to doubt).
Critical questions for argument from vagueness of a verbal classification
IDQuestionTypeCQ1:Is t genuinely vague, or does it have reasonably clear boundaries?Vagueness verificationCQ2:Is a really a borderline case, or does it clearly fall inside or outside the category?Borderline statusCQ3:Can the vagueness be resolved by stipulation or by specifying the context?Resolution possibilityCQ4:Are there clear cases that can serve as paradigms for comparison?Paradigm casesCQ5:Does the vagueness undermine the argument, or is the classification clear enough for practical purposes?Practical adequacyCQ6:Is this a sorites (heap/slippery slope) problem where small differences accumulate?Sorites applicability

Argument from Arbitrariness of a Verbal Classification
This scheme challenges a classification by arguing that the boundaries are arbitrary and a could just as easily be classified differently.
Argument from arbitrariness of a verbal classification
ComponentContentMajor premise:The classification of a under term t depends on drawing a precise boundary at some point on a continuous scale.Minor premise:The choice of where to draw this boundary is arbitrary (not based on a principled distinction).Conclusion:Therefore, the classification of a as t is arbitrary and open to challenge.
Critical questions for argument from arbitrariness of a verbal classification
IDQuestionTypeCQ1:Is the boundary really arbitrary, or is there a principled basis for it?Principled basisCQ2:Even if the precise boundary is arbitrary, is a clearly on one side or the other?Clear case statusCQ3:Is there a conventional or legal standard that makes the boundary non-arbitrary for practical purposes?Conventional standardCQ4:Would changing the boundary affect the classification of a?Boundary sensitivityCQ5:Is the arbitrariness a practical problem in this context?Practical significanceCQ6:Are there alternative classification schemes that would be less arbitrary?Alternative schemes

Argument from Interaction of Act and Person
This scheme connects the character or ethos of a person to the evaluation of their actions (and vice versa - actions reveal character).
Argument from interaction of act and person (Person-to-Act direction)
ComponentContentMajor premise:Person a is of type (character, ethical quality) θ.Minor premise:Actions of type θ are generally of ethical type (quality) φ.Conclusion:Therefore, in this case, a's action is of ethical type φ.
Argument from interaction of act and person (Act-to-Person direction)
ComponentContentMajor premise:Person a performed action α.Minor premise:Action α is of ethical type φ, and actions of type φ indicate character type θ.Conclusion:Therefore, person a is (or has) character type θ.
Critical questions for argument from interaction of act and person
IDQuestionTypeCQ1:Does person a really have character θ, or is this assumption unwarranted?Character attributionCQ2:Is the action α really of type φ in this context?Action classificationCQ3:Are there exceptional circumstances that explain why this action does not reflect a's character?Exceptional circumstancesCQ4:Could this action be explained by situational factors rather than character?Situational attributionCQ5:Is a single action sufficient evidence for attributing character type θ?Evidence sufficiencyCQ6:Are there other actions by a that suggest a different character type?CounterevidenceCQ7:Is the connection between character type θ and action type φ reliable?Correlation strength

Implementation Notes for Digital Agora
These schemes are particularly significant for your platform's deliberative and evaluative functions:

Classification schemes (verbal classification, definition to classification): These are fundamental to policy deliberation where definitional disputes are central. Your Knowledge Base integration with theory objects could model definitional standards as special entities that ground classification arguments.
Vagueness and Arbitrariness: These are critical questioning schemes - they don't assert propositions but challenge existing classifications. They're meta-arguments about argument structure itself. In your AIF implementation, these might be represented as special undercutting attacks that target the warrant rather than proposing an alternative conclusion.
Act-Person Interaction: This is the foundation of ethotic argument (ad hominem in its non-fallacious form). Highly relevant for:

Trust and credibility assessment in expert testimony
Evaluating source reliability
The "Trustworthiness question" (CQ4) in argument from expert opinion
Your platform's handling of user reputation and argument quality


Bidirectionality: The act-person scheme works in both directions (character→action evaluation, action→character inference). This creates interesting graph structures in your AIF representation where inference direction matters.