Argumentation Schemes: Theory, Computation, and Applications
The ensuing report provides a comprehensive, rigorous examination of the remaining theoretical and computational dimensions of argumentation schemes, encompassing their intricate clustering, modular application in complex arguments, formalization within Artificial Intelligence (AI) and Law, and their pivotal role in argument mining, concluding with a synthesis of their enduring significance and future challenges.
--------------------------------------------------------------------------------
Argumentation Schemes: Advanced Theoretical and Computational Applications (Sections 6–11)
6. A Bottom-Up Approach to Classification: Clusters of Decision-Making Schemes
The classification of argumentation schemes is highly complex due to the sheer number of schemes and their overlapping characteristics, necessitating a bottom-up approach that investigates clusters of schemes exhibiting "family resemblances" and interconnections [1, 2]. The cluster revolving around practical reasoning and decision-making provides a crucial example of this methodological necessity [2].
6.1 Practical Reasoning and its Core Defeasibility
The foundational component of this cluster is the basic Argument from Practical Reasoning (PR) (Table 12), which models the decision-making process of a rational agent [2, 3]. This scheme, characterized as a fast and frugal heuristic, provides a presumptive starting point for action [2, 3]. Its defeasibility is brought to light by the associated Critical Questions (CQs) [3, 4]. The set of CQs tests the argument's vulnerability by probing alternative goals (CQ1), alternative actions (CQ2), efficiency (CQ3), possibility (CQ4), and, significantly, the potential negative side effects or consequences (CQ5) [4].
6.2 The Role of Consequences and Values
CQ5 serves as the conceptual link to consequence-based argumentation schemes, as evaluating side effects inherently requires assigning a positive or negative value [4].
1. Argument from Consequences: The schemes for Argument from Positive Consequences (Table 13) and Argument from Negative Consequences (Table 14) cite known or estimated outcomes (valued positively or negatively, respectively) as reasons for accepting or rejecting a proposed course of action [5, 6].
2. Argument from Value: These schemes (Table 15, Table 16) provide the necessary justification for the valuation of consequences [7]. They formalize how a perceived value (V) leads an agent to either commit to, or retract commitment from, a goal (G) [8, 9]. Arguments from positive and negative consequences are considered species of arguments from positive and negative value, respectively [10, 11].
6.3 Value-Based Practical Reasoning (VBPR)
A more complex variant, Value-Based Practical Reasoning (VBPR) (Table 17), integrates the basic instrumental PR with explicit value justification [9, 12]. VBPR is recognized as a species of instrumental practical reasoning [10]. Instrumental PR is identified by five key conditions concerning goal-orientation, pro/con argument weighing, and decision-making based on goals and circumstances [13]. VBPR requires an additional sixth condition: that the agent explicitly justifies its decision based on its values [14].
6.4 The Slippery Slope Argument (SSA)
The Slippery Slope Argument (SSA) (Table 18) is intrinsically connected to this cluster, specifically as a subtype and special instance of the Argument from Negative Consequences [11, 15].
• Structure: The SSA warns against an initial step (A_0) because it plausibly leads through a sequence (A_1 through A_n) to a disastrous or catastrophic outcome (A_n) [16, 17].
• Relationship to VBPR: The SSA is also classified as a species of VBPR [11]. Its persuasive force relies on the assumption of shared values between the agent and the critic, whereby the critical outcome (A_n) is mutually agreed upon as highly negative and worth avoiding [11].
• Distinctive Premises: What defines the SSA are three specialized premises: the recursive premise (the chain of events), the grey zone premise (vagueness of concepts), and the loss of control premise [18].
Understanding these interrelations allows for a systematic approach to identifying and classifying schemes, particularly when an argument appears to fit multiple forms [1, 10].
7. Using Argumentation Schemes: Nets of Argumentation Schemes
In natural language discourse, complex arguments rarely correspond to a single, isolated argumentation scheme. A single scheme merely captures one inferential passage, whereas real-world reasoning often involves a series of conceptual steps (e.g., classification, evaluation, action proposal) [19, 20].
The proposed solution is the concept of Nets of Argumentation Schemes, which models arguments as interconnected, interdependent argumentative steps, accommodating explicit, presupposed, or implied reasoning components [19, 21].
7.1 Complex Argumentation Analysis
Analyzing arguments through nets highlights the modularity required for comprehensive reconstruction:
• Example 7.1 (The Hague Speech): An argument concerning consequences is revealed to be a net (Figure 9). The initial claim (of a "violation") relies on an Argument from Verbal Classification [22]. This classification grounds an Argument from Commitment (concerning shared values of sovereignty), which in turn leads to the ultimate, albeit implicit, Argument from Consequences (a threat of undesirable consequences for Russia) [23].
• Example 7.2 (Global Escalation): This slippery slope argument (Figure 10) depends on an initial Argument from Verbal Classification (US aid is a "declaration of war") to justify the recursive chain of events, which is then concluded by an Argument from Values (the escalation is dangerous) [24, 25].
Nets are essential because natural argumentation is often compressed, concealing necessary implicit premises and conclusions required to demonstrate that the argument fits a specific scheme (like the Slippery Slope argument) [26, 27]. Argument mapping is a tool used to unravel these networks of argumentation [27].
8. Using Argumentation Schemes in AI and Law
Argumentation schemes are essential for computational argumentation, offering formal structures crucial for modeling legal reasoning and other advanced AI tasks [20, 28].
8.1 Formalization and the Challenge of Critical Questions
Schemes were initially formalized as premise-conclusion structures [28] or defined structurally using proposition attributes (types) to validate instantiation [29]. However, the key computational challenge lay in modeling the associated Critical Questions (CQs) [30].
CQs are non-uniform in their function and effect on the burden of proof [31]. Verheij identified four distinct roles CQs can play [32, 33]:
1. Questioning a premise (premise attack).
2. Pointing to exceptions (undercutting attack).
3. Framing conditions for proper scheme use (undercutting attack).
4. Indicating other arguments (potentially conclusion attack) [33].
8.2 Computational Frameworks
Formal systems integrate schemes to handle defeasible reasoning:
• ASPIC+: This abstract argumentation system treats schemes as rules (strict or defeasible) and utilizes an underlying abstract framework (Dung, 1995) to model the attack relation between arguments [34]. This framework has been applied to model legal Case-Based Reasoning (CBR) schemes that rely on common factors and preferences among factors established in precedent [35-37].
• Carneades Argumentation System (CAS): CAS addresses the complexity of CQs by modeling arguments using three types of premises: ordinary premises, assumptions, and exceptions, which facilitates the allocation of the burden of proof [38]. CAS Version 4 (CAS2) defines an argumentation scheme as a tuple (e,v,g), representing functions for weighing, validating, and generating arguments [39, 40]. Crucially, CAS4 uses forwards-reasoning to invent arguments by instantiating schemes [41, 42].
8.3 Legal and Domain-Specific Applications
In AI and Law, schemes are vital for specialized tasks:
• CBR: Schemes model arguments from precedent by comparing factors shared between the current case and prior evaluated cases [37].
• Statutory Interpretation: Canons of interpretation (e.g., argument from purpose, historical argument, argument from ordinary meaning) can be translated and formalized as specific argumentation schemes [43].
• Argument Mining: Schemes are used to automatically classify argument types in legal texts, such as decisions from the European Court of Human Rights [44].
9. Using Schemes for Argument Mining
Argument mining—the automatic extraction of argumentative structure from natural language—is a field where argumentation schemes provide critical structural guidance [45].
9.1 Challenges and Data Requirements
Argument mining faces challenges related to the availability of large, annotated datasets and the limits of purely statistical models [46, 47]. While corpora like the Internet Argument Corpus (IAC) and the Potsdam Microtext Corpus exist [48], and infrastructures like the Argument Web and AIFdb provide data repositories [49, 50], the inherent complexity of argumentation structures remains a barrier for traditional statistical approaches [47]. The number of assembly rules for argument components (including implicit ones) runs to thousands, rendering purely statistical training unfeasible [51].
9.2 Schemes as Computational Priors
Argumentation schemes function as essential structural priors that augment machine learning processes [52]. Schemes provide explicit structure and constraints [52]:
• Typology Constraints: Schemes are associated with specific proposition types [53]. For example, the Argument from Expert Opinion typically includes a premise reporting the speech of another (identifiable by lexemes like "said"), constraining the search space for the classifier [53, 54].
• Knowledge Engineering: This process of defining expected input based on scheme structure has demonstrated significant improvement in classification accuracy for detecting scheme components and identifying scheme instances [53, 55].
• Empirical Relevance: A focused approach based on common schemes (Argument from Example, Cause to Effect, Practical Reasoning, Consequences, and Verbal Classification) is effective, as these five account for a substantial majority (61%) of arguments found in certain corpora [56].
10. Schemes in Formal Ontologies
The formal representation of argumentation schemes is achieved through ontologies, providing machine-processable models that facilitate automated reasoning.
The Argument Interchange Format (AIF) provides a core ontology rooted in description logic [57]. This ontology is extensible, allowing for the definition of argumentation schemes as adjunct ontologies that capture their structure, description, and critical questions in a formalized manner [57-59].
This ontological approach yields two major computational benefits [59]:
1. Economy of Specification: More specific schemes can be efficiently defined as subtypes of more general ones, leveraging inheritance relationships [59].
2. Automated Reasoning: The structure supports automatic classification and inference:
    ◦ Classification: It enables the automatic classification of specific arguments (e.g., recognizing fear appeal arguments as a natural subset of negative consequence arguments) [59].
    ◦ Inference: It allows for the inference of appropriate critical questions, as all CQs associated with a superclass can be asked of an instance of a subclass [59].
11. Conclusions: The Dual Function and Future Trajectories
Argumentation schemes are essential abstract structures representing the most common and stereotypical patterns of reasoning [60]. They provide analytical tools for detecting structure in natural and technical discourse and are crucial for argument evaluation [61].
11.1 The Dual Function: Evaluation and Invention
The history of argumentation theory, tracing back to the Sophists and Aristotle, has recognized two primary functions for schemes/topics [61, 62]:
1. Warranting/Evaluation: Schemes provide a warranting function, enabling an inference to be drawn from premises to a conclusion, justifying arguments that are defeasible rather than deductively valid [61, 63].
2. Invention/Construction: Schemes serve a search function, allowing an arguer to find arguments (premises accepted by the audience) to support a designated claim [61, 63]. This function, now termed argument invention, treats schemes as dialectical instruments for argument production [63].
The advent of tools like IBM’s Watson Debater highlights the burgeoning importance of argument invention [64]. Computational systems like CAS, by using argumentation schemes and audience commitment databases, can function as automated assistants to construct chains of arguments supporting a speaker’s ultimate claim [42].
11.2 Future Research Directions
To maximize their utility across disciplines, argumentation schemes face key future challenges:
1. Discourse Interpretation: Schemes must be integrated within a broader theory of discourse interpretation, showing how they can model the interpretative process itself and assess the best possible interpretation of an argumentative exchange [65].
2. Dialogue and Context: Schemes need to be linked to theories of dialogue types and discourse moves [65]. By mapping which schemes are most adequate for pursuing specific dialogical ends, researchers can establish a set of presumptions for interpreting and classifying arguments based on the context and type of dialogue [65].
--------------------------------------------------------------------------------
Argumentation Schemes: Classification, Nets, and Computation
The continued investigation into argumentation schemes necessitates a detailed examination of their interrelations, their classification by function, and their crucial role in computational argumentation systems, particularly in Artificial Intelligence (AI) and Argument Mining. The subsequent report, covering Sections 6 through 9 of the source material, elaborates on these advanced theoretical and practical applications.
--------------------------------------------------------------------------------
Argumentation Schemes: Advanced Report on Clusters and Computational Applications (Sections 6–9)
6. A Bottom-Up Approach to Classification: Clusters of Decision-Making Schemes
The sheer volume and intricate nature of argumentation schemes require classification systems that move beyond singular criteria, adopting both top-down and bottom-up methodologies [1]. The bottom-up approach emphasizes studying the interrelations and family resemblances among clusters of schemes to better manage complexity and ambiguity in real-world arguments [1, 2]. This section focuses specifically on the cluster relating to decision-making and practical reasoning.
6.1 The Practical Reasoning Cluster
Schemes focused on decision-making share similar structures based on practical outcomes and value judgments, including Practical Reasoning (PR), value-based PR, arguments from consequences (positive and negative), and the slippery slope argument [2].
**A. Basic Practical Reasoning (PR):**The simplest form of PR models the reasoning of a rational agent who possesses goals and the capability to act to achieve them [2]. It functions as a fast and frugal heuristic, providing a presumptive starting point for action [3].
• Structure (Table 12): Major Premise (Agent has Goal G), Minor Premise (Action A is a means to G), Conclusion (Agent ought to carry out A) [3].
• Defeasibility: The argument is tested by associated Critical Questions (CQs) [3]. The CQs reveal points of attack, such as conflicting goals (CQ1), alternative actions (CQ2), efficiency (CQ3), possibility (CQ4), and, critically, consequences (CQ5: side effects) [4].
**B. Consequences and Value-Based Arguments:**The critical question concerning consequences (CQ5) links basic PR to consequence-based schemes, as the assessment of side effects necessarily involves assigning a positive or negative value [4, 5].
• Argument from Positive/Negative Consequences (Tables 13 & 14): These cite known or estimated consequences—those possessing positive or negative value for the agent—as reasons for either taking or avoiding an action, respectively [5, 6].
• Argument from Value (Tables 15 & 16): These schemes provide the foundational justification for evaluating consequences. They classify a state of affairs (V) as positive or negative, which then warrants a reason for committing to or retracting commitment to a goal (G) [7-9].
**C. Value-Based Practical Reasoning (VBPR):**VBPR is a more complex variant that combines the structure of basic instrumental PR with explicit value justification (Table 17) [9, 10].
• Structure (Table 17): Premise 1 (Goal G), Premise 2 (G is supported by values V), Premise 3 (Action A is necessary/sufficient for G), Conclusion (I should bring about A) [11].
• Identification Conditions: Instrumental PR is characterized by five conditions related to agent decision-making, including goal-orientation and weighing pro/con arguments. VBPR requires an additional sixth condition: that the agent justifies its decision based explicitly on its values [12, 13]. This approach allows for a precise distinction between instrumental and value-based reasoning [10].
**D. Slippery Slope Argument (SSA):**The SSA is a decision-making scheme focused on avoiding an initial step (A0) because it recursively leads to a sequence (A1...An) culminating in a disastrous (bad) outcome (An) [11, 14].
• Relations: The SSA is inherently related to the negative branch of the cluster. It is characterized as a subtype and special instance of argument from negative consequences [15, 16]. Furthermore, it is a species of Value-Based Practical Reasoning, as its persuasive force relies on the assumption of shared values between the agent and the critic that deem the catastrophic outcome (An) worth avoiding [15, 17].
• Distinctive Premises: What differentiates the SSA are the recursive premise (the chain of consequences), the grey zone premise (implicitly involving the vagueness of concepts), and the loss of control premise [17].
7. Using Argumentation Schemes: Nets of Argumentation Schemes
A single argumentation scheme, defined as a prototypical combination of semantic relations and logical inference rules, is often inadequate to capture the complexity of real-world arguments [18, 19]. Natural argumentation frequently involves multiple conceptual passages—such as classifying an entity, evaluating it, and then proposing a course of action—requiring a modular approach [19].
7.1 Argumentation Nets
The proposed solution is to model arguments as Nets of Schemes, which represent interconnected and interdependent argumentative steps, whether they are explicit, presupposed, or simply implied in the discourse [20, 21]. A net can successfully map a complex argumentative strategy where a single scheme only captures one reasoning passage [21].
• Example 7.1 (The Hague Speech): This political argument, seemingly a simple Argument from Consequences, is reconstructed as a net showing the interaction between distinct schemes [22, 23].
    ◦ The argument begins with an Argument from Verbal Classification (classifying Russia’s action as a "violation") [24].
    ◦ This classification grounds an Argument from Commitment (pointing to the shared value that "sovereignty of other nations cannot be violated") [23].
    ◦ This commitment, in turn, leads to an implicit Argument from Consequences (an implicit threat of undesirable "consequences" for Russia) [23].
• Example 7.2 (The Global Escalation): This slippery slope argument is also reconstructed as a net [25-27].
    ◦ The core warning relies on an Argument from Verbal Classification (US aid is a "declaration of war") [28].
    ◦ This classification justifies the Slippery Slope chain leading to global escalation [28].
    ◦ The final evaluative step is an Argument from Values (the escalation is dangerous and should be avoided) [27].
In these complex instances, the use of argument maps to reveal the network of argumentation is essential, as many intervening propositions (links in the chain of actions or premises) are often left implicit in the compressed style of natural language presentation [29, 30].
8. Using Argumentation Schemes in AI and Law
Argumentation schemes have proven to be an invaluable tool in computational argumentation, particularly within the field of AI and Law [21]. Their formalization addresses critical issues in argument modeling, representation, and discovery.
8.1 Formalization and Modeling Challenges
Early integration of schemes into computational systems began with Bart Verheij, who formalized them as premise-conclusion structures for tools like ArguMed [31]. Reed and Walton defined schemes structurally using proposition attributes (types) to ensure correct instantiation [32].
A significant challenge emerged in modeling the associated Critical Questions (CQs) [33]. CQs are non-uniform; some merely shift the burden of proof to the proponent (like denying a premise or pointing to an exception), while others require the questioner to provide supporting evidence to defeat the argument [34, 35].
• CQ Roles: Verheij identified four distinct roles for CQs: questioning a premise, pointing to exceptions (undercutting), framing conditions for proper use, and indicating other arguments (conclusion attack) [36].
8.2 Computational Frameworks
Argumentation schemes are utilized within established formal argumentation models:
• ASPIC+: Schemes are treated akin to rules in rule-based systems [33]. ASPIC+ uses two kinds of inference rules (strict and defeasible) within an abstract argumentation framework that models the attack relation between arguments [37]. This framework has been applied to model legal Case-Based Reasoning (CBR) schemes from precedent [38-40].
• Carneades Argumentation System (CAS): CAS models the challenge of CQs by distinguishing between three premise types: ordinary premises, assumptions, and exceptions, allowing the burden of proof to be allocated based on the type of challenge [41].
    ◦ CAS Version 4 (CAS2): Defines a scheme as a tuple (e, v, g)—functions for weighing arguments, validating instantiation, and generating arguments [42]. CAS4, using forwards reasoning, can construct arguments based on its repository of schemes, essential for argument invention [43, 44].
• Ontologies: The Argument Interchange Format (AIF) provides a core ontology in description logic. This can be extended to define an ontology of argumentation schemes, capturing their structure, description, and critical questions in a machine-processable way [45, 46]. This structure supports automatic classification and inference, such as identifying a subclass (e.g., fear appeal arguments) as a subset of a superclass (e.g., negative consequence arguments) [47].
8.3 Legal Applications
Schemes are crucial across specialized legal tasks:
• Case-Based Reasoning (CBR): CBR systems, vital for legal reasoning, use schemes to model arguments from precedent by comparing factors and features of a current case to prior evaluated cases stored in a knowledge base [48].
• Statutory Interpretation: Schemes are used to translate canons of interpretation into formally recognizable argument forms, such as argument from ordinary meaning, argument from purpose, or the historical argument [49].
• Argument Mining: Schemes help automatically classify arguments in legal texts (e.g., European Court of Human Rights decisions) by identifying textual indicators of rhetorical structure [50].
9. Using Schemes for Argument Mining
Argument mining—the automatic extraction of argument structure from natural language—is a demanding task due to data limitations and the complexity of natural language [51]. Argumentation schemes play a vital role in overcoming these challenges.
9.1 Challenges and Data Infrastructure
Statistical models traditionally require massive, annotated datasets [52]. While community efforts like the Argument Web and AIFdb have created infrastructure for sharing analyzed data (AIFdb holds the largest publicly available dataset of analyzed argumentation), argument schemes are essential due to the inherent complexity of argumentation structures [53-55].
The complexity arises because the sheer number of possible rules governing argument structure, including variations and implicit components, runs to thousands, making purely statistical training models unreasonable [56, 57].
9.2 Schemes as Computational Priors
Argumentation schemes provide the necessary structural guidance to augment machine learning efforts [58]. Schemes define explicit structures that constrain the possible relationships between propositions:
• Typology Constraint: Schemes are associated with specific types of propositions. For instance, an Argument from Expert Opinion typically includes a premise reporting the speech of another, identifiable by lexemes like "said" [59, 60].
• Improved Performance: This knowledge engineering approach, leveraging schemes to define expectations about the input, has significantly improved classification performance in detecting scheme components and identifying scheme instances [61].
Early work in classifying arguments by scheme showed that a small number of schemes—Argument from Example, Cause to Effect, Practical Reasoning, Consequences, and Verbal Classification—constituted a majority (61%) of arguments found in certain corpora, suggesting a focused approach to identification is highly effective [62].
--------------------------------------------------------------------------------
Pragmatic Classification of Argumentation Schemes
This document rigorously addresses the necessity and methodology of classifying argumentation schemes, followed by a detailed exposition of the proposed classification system predicated upon the scheme's pragmatic function, as outlined in Sections 4 and 5 of the source material.
--------------------------------------------------------------------------------
Report on Classification of Argumentation Schemes (Sections 4 & 5)
4. The Fundamental Challenge of Argumentation Scheme Classification
A core theoretical and practical challenge in the field of argumentation theory is the development of a useful and sound system for classifying argumentation schemes [1]. The successful deployment of these schemes—particularly within computational systems designed for argumentation analysis, argument mining, and critical thinking instruction—hinges upon the robustness and usability of their classification [1].
4.1 Criteria and Purpose
Any classification system is inherently teleological; its design and the specific criteria adopted are dictated by the purpose it is intended to serve [1]. For instance, a detailed, fine-grained classification useful for theoretical biological study may be unsuitable for the broad requirements of legal or everyday conversational analysis [1]. Therefore, prior to establishing criteria, the purpose of the scheme classification must be specified [1].
The fundamental requirements for an effective classification system are three-fold:
1. Usability: The schemes must be practical for analysts and developers to employ.
2. Identifiability: They must be easily recognizable within natural language discourse [1].
3. Specificity: The system must permit the user to identify the most precise pattern of argument suitable for describing a textual instance or for generating a contextually appropriate argument [1].
4.2 Classification Methodology: The Dual Approach
To address the complexity arising from the vast number and highly specific nature of argumentation schemes, the sources propose a methodology that integrates two complementary approaches: top-down and bottom-up [2].
1. Top-Down Approach: This method requires establishing overarching, dichotomic criteria that allow a user to navigate the taxonomy by deciding between two categories at each level [2]. This process enables the user to find the required scheme either through direct identification or, crucially, through exclusion [2]. This approach benefits from an overview of existing classification systems from both traditional and modern theories to establish useful criteria [2].
2. Bottom-Up Approach: This inductive method begins with the empirical data, focusing on practical difficulties encountered in argument interpretation [2]. Specifically, it addresses instances where a single real-world argument seems to fit multiple schemes [2]. The process involves:
    ◦ Identifying clusters of schemes that exhibit internal coherence and fit together [2].
    ◦ Examining the relationships between these clusters (e.g., how one cluster fits with another) [2].
    ◦ Gradually organizing these groups into a comprehensive, overarching system [2].
5. Using the Schemes: A Proposed Classification System
Section 5 develops a comprehensive classification system rooted in the insight that argumentation schemes are prototypically defined by the fusion of semantic (or topical) relations and logical rules of inference [3]. A simple classification based solely on either semantic links or logical form is deemed insufficient because a single semantic relation (e.g., causation) can be combined with diverse types of reasoning (e.g., deduction, abduction, induction) to yield distinct arguments (e.g., argument from cause to effect, argument from sign, practical reasoning) [3, 4].
The critical theoretical intervention is the introduction of a multi-logical perspective and the adoption of the pragmatic function as the highest-level classificatory criterion [4, 5].
5.1 Pragmatic Function as the Overarching Criterion
Argumentation schemes are conceived as instruments for constructing or reconstructing arguments (discourse moves) [5]. Therefore, classification should begin with the intended purpose of the argumentative move, or its communicative goal [5].
Generic pragmatic purposes include:
• Classifying a state of affairs [5].
• Supporting the existence of a state of affairs [5].
• Influencing a decision-making process [5].
This teleological classification must be synthesized with a practical analysis of the argumentative means—the inferential passages—required to achieve that purpose [6]. Not all semantic relations can support all conclusions; for example, definitional schemes are limited to classification and cannot support prediction, while reasoning concerning consequences supports the desirability of an action but not its truth or falsity [6].
5.2 The Primary Dichotomy: Course of Action vs. State of Affairs
The first structural distinction is based on the nature of the subject matter of the conclusion [7]:
1. Course of Action: The argument aims to support the desirability or non-desirability of an action [7].
2. State of Affairs (SoA): The argument aims to provide grounds for the acceptability of a judgment concerning a fact [7].
5.3 Secondary Dichotomy: External vs. Internal Arguments
Drawing upon the ancient dialectical tradition (Cicero, Boethius), arguments are further divided based on the source of their persuasive force [7]:
• External Arguments: Arguments deriving their force from an external source, often the speaker's authority or popular practice [7].
    ◦ Supporting Action: The authority of the source's role dictates compliance, or popular practice suggests conformity [8].
    ◦ Supporting Judgment (SoA): The source’s superior knowledge (expertise) warrants the conclusion [9]. External arguments can also be used negatively (e.g., ad hominem) to attack a source's reliability [9].
• Internal Arguments: Arguments based on the intrinsic characteristics or semantic relations within the subject matter [7].
5.4 Internal Argument Classification (Practical Reasoning)
Internal arguments concerning a Course of Action (practical reasoning) are subdivided based on how the action is evaluated [10, 11]:
1. Consequence-Based: Evaluation depends on the quality of the outcomes (positive or negative state of affairs) resulting from the action [10].
2. Means-End/Function: Evaluation depends on the action’s function in successfully bringing about a desired goal [10].
This practical reasoning structure is logically flexible; the paradigm of possible alternative means dictates whether the resulting conclusion is weaker (abductive) or stronger (deductive) [12].
5.5 Internal Argument Classification (Judgment on State of Affairs)
Internal arguments concerning a State of Affairs (a judgment) are classified according to the nature of the predicate being attributed [11]:
1. Existence (Prediction/Retrodiction): Arguments supporting whether an event has occurred or will occur, typically proceeding from causal relations (material and efficient causes) [11].
2. Factual Judgments (Classification): Arguments attributing a categorization or definition, grounded on descriptive (definitional) features (e.g., determining what an entity is) [11, 13].
3. Value Judgments (Qualification): Arguments attributing evaluative predicates, grounded not on definition but on criteria derived from value hierarchies (e.g., determining if a deed is criminal or an entity is "good") [13].
5.6 Operational Utility
This proposed classification system, combining pragmatic purpose with the means of inference, creates a useful tree model for both analytical and production purposes [14].
• Analysis: An analyst reconstructs the speaker's intent (generic purpose) and traces the inferential choices made, allowing the analysis to stop at a desired level of abstraction or continue until the precise scheme (the specific combination of semantic principle and logical rule) is detected [14].
• Production/Invention: The system mirrors the classical rhetorical theory of stasis (issues under discussion), guiding argument construction by starting with the nature of the viewpoint to be supported (e.g., decision vs. fact, occurrence vs. classification) and matching it to alternative inferential strategies [12].
--------------------------------------------------------------------------------
Argumentation Schemes: Foundations, Structure, and History
The following comprehensive report details Sections 1 through 3 of the source material, providing the foundational theoretical and historical context of argumentation schemes essential for a development team focused on sophisticated argumentation analysis or generation software. The approach emphasizes rigorous definition, structural complexity, and intellectual lineage.
--------------------------------------------------------------------------------
Argumentation Schemes: Foundational Report (Sections 1–3)
1. Introduction and Project Scope
The primary objective of this source material is to conduct an in-depth investigation into argumentation schemes, covering their structure, classification, and practical applications, particularly within computational fields like Artificial Intelligence (AI) and argument mining [1].
1.1 Core Objectives of the Analysis
The paper pursues three specific goals [1, 2]:
1. Description and Evolution: To describe argumentation schemes, detailing their historical evolution from traditional theories (like the Aristotelian topics) to modern formalizations, and reviewing their classification systems [1, 2].
2. Classification Proposal: To propose a methodology for classifying these schemes, integrating ancient and modern developments [1].
3. Application Outline: To demonstrate how schemes can be utilized, potentially in a modular fashion, for analyzing, describing, or producing complex, real-world arguments [1, 2].
1.2 Historical Lineage
Argumentation schemes represent abstract structures that evolved historically from the Aristotelian topoi, traditionally conceived as the "places to find arguments" [2]. However, it is a crucial observation that, aside from exceptions such as the scheme for argument from analogy, the classical descriptions of topoi found in Aristotle’s Topics generally bear little resemblance to the detailed contemporary list of schemes (e.g., in Walton et al., 2008) [2].
2. Introducing Argumentation Schemes: Structure and Function
Argumentation schemes are essential constructs that represent stereotypical, abstract patterns of inference, acting as the fundamental building blocks of arguments used across various contexts, including everyday conversation, legal discourse, and scientific argumentation [1, 3].
2.1 Nature and Core Structure
Argumentation schemes are defined as stereotypical patterns of inference that integrate three dimensions: semantic-ontological relations, types of reasoning (e.g., induction, deduction, abduction), and logical axioms (e.g., modus ponens, modus tollens) [4]. They are formal representations of an argument's premise-conclusion structure [3].
A critical characteristic distinguishing these schemes from classical deductive logic or standard Bayesian statistical inferences is their defeasibility [3].
2.2 Defeasibility and Critical Questions (CQs)
The defeasible nature of an argument scheme implies that the conclusion, though tentatively accepted, can be retracted if new information or strong counter-arguments are introduced [3].
This defeasibility is formalized through an associated set of Critical Questions (CQs) [5]. CQs function as dialectical tools designed to test the argument’s strength and acceptability [3]. They represent the weak points or conditions that an interlocutor can use to challenge the argument. By consulting the CQs corresponding to a scheme, a critic can identify potential lines of attack or sources of evidence needed to refute the argument [5].
2.3 Complexity: Material and Logical Relations
Argumentation schemes inherently fuse the material (or semantic) relation—the relationship between concepts expressed by the argument’s warrant—with the logical relation (the type of inference employed) [4, 6].
Although schemes generally represent the prototypical pairing of semantic relations and logical rules, the relationship between these two dimensions is complex [7]. For example, the Argument from Cause to Effect (Table 1) involves a semantic causal relation combined with a defeasible modus ponens [6]. However, a single semantic-ontological connection (e.g., "Fever causes breathing fast") can be leveraged to draw conclusions using diverse logical rules, leading to different conclusions derived deductively, abductively, or inductively [8, 9]:
• Defeasible Modus Ponens: Concluding that fast breathing occurred from the premise of having a fever [9].
• Defeasible Modus Tollens: Concluding that there was no fever from the premise that fast breathing did not occur [9].
• Abductive Reasoning: Inferring the possibility of fever from the presence of fast breathing (affirming the consequent) [9].
• Inductive Generalization: Basing a conclusion on a single comparative case [9].
This multiplicity of possible inferences from a single material relation necessitates consideration when classifying schemes [7].
2.4 Justification and Importance
The recognition of argumentation schemes is grounded in both empirical and pragmatic justifications:
1. Inductive Justification: Schemes are justified inductively through the systematic analysis of thousands of real examples found across diverse forms of discourse (e.g., legal, political, ordinary language) [10, 11]. This empirical justification confirms that the forms of argument represented by these schemes are extremely common and influential in argumentative practice [12, 13].
2. Teleological/Practical Justification: Schemes are justified pragmatically because their use serves an agent’s goals better than using no scheme or an alternative schema [14]. Defeasible schemes are particularly important because they allow rational agents to arrive at presumptive conclusions necessary for practical action when continuing to collect evidence would result in excessive delay or cost [14].
Argumentation schemes are essential analytical instruments, providing tools for:
• Analyzing natural arguments in discourse [11].
• Teaching critical thinking and improving argument quality in educational contexts [12, 13].
• Serving as formal components in computational models of argumentation, such as ASPIC+, DefLog, and the Carneades Argumentation System [15]. They are also crucial for research in argument mining [15].
The study of these schemes, largely sidelined during the Enlightenment in favor of deductive logic, experienced a major comeback in the 20th century with the foundation and growth of argumentation studies [16].
3. The Historical and Dialectical Tradition of Topics (Topoi/Loci)
The theory of argumentation schemes represents the contemporary development of the classical concept of topos (Greek) or locus (Latin), understood as a conditional principle expressing a generic premise from which specific premises warranting a conclusion can be drawn [17].
3.1 Aristotle: The Topoi
In Aristotle’s Topics and Rhetoric, topoi provided general principles of inference, often expressed in the conditional form "P, then Q" [18]. Differences between topoi were based on the semantic or material relations between P and Q, such as genus-species or contraries [18].
• Function: Topoi served as the external general rules of reasoning for an enthymeme (a rhetorical syllogism), functioning as the genus of the major premises [19]. They could be used as an inferential principle guaranteeing the passage from premise to conclusion, or as a general principle from which specific premises (instantiations or axioms) could be drawn [20].
• Classification: Aristotle distinguished between:
    ◦ Generic Topoi: Abstract and commonly shared conditionals that provide classes of inferences, including both necessary inferences (like those governing definition or genus) and defeasible ones (like analogy) [21].
    ◦ Idia (Specific Topics): Premises accepted within specific domains (e.g., law, medicine) that function as instruments of invention for constructing arguments in that field [21, 22].
3.2 Cicero: Reduction and Categorization
Cicero reduced and organized the Aristotelian list into 20 loci or maxims, grouping them into two primary classes [23]:
• Intrinsic Topics: These proceed directly from the subject matter, focusing on its semantic properties (e.g., definition, comparison) [23].
• Extrinsic Topics: These support the conclusion using contextual elements, such as the source's authority (related to Aristotle’s arguments from authority) [23].
Cicero also recognized dialectical loci (antecedents, consequents, incompatibles) that established commitments based purely on the logical meaning of connectors, rather than supporting a viewpoint based on the content of the premises [24]. Furthermore, he linked the theory of topics to the issue of the discussion (stasis), classifying topics according to their function in addressing conjecture, definition, or qualification (Table 4) [25, 26].
3.3 Boethius: Differentiae and Maximae Propositiones
Boethius continued this tradition by organizing Cicero’s loci in his De Topicis Differentiis [26]. He drew a clear distinction between:
• Dialectical Loci: Stemming from rules of prediction and logic-semantic properties, some of which are necessary (e.g., definition, genus), while others are merely frequent connections (e.g., from adiuncta) [27].
• Rhetorical Topoi: Derived from frequent, stereotypical connections between things, rather than the abstract semantic properties of concepts [27, 28].
Boethius interpreted the Aristotelian topoi as maximae propositiones (general principles/axioms) [29]. These maxims fall under differentiae, which are the criteria or genera of maxims, reflecting the relationship between the terms of the argument [29]. The relationship (differentia) determines the criterion of appropriateness for the maxim utilized (Table 5) [29]. Boethius offered a detailed classification dividing topics into Intrinsic, Extrinsic, and Intermediate Loci, the latter based on semantic connections of grammatical relations or word definitions (Table 6) [30, 31].
3.4 Abaelardus: Imperfect Inferences and Habitudo
In the 12th century, Abaelardus considered topics to be imperfect inferences, distinct from strictly valid categorical syllogisms because they depend on content and necessary assumptions connecting general principles to the subject matter [32].
• Form vs. Content: Syllogisms depend only on logical form, while dialectical inferences cannot be resolved only by term positions [33].
• Habitudo: The validity of dialectical inferences relies on the habitudo, which is the topical relation—the semantic-ontological respect under which the terms are connected. The habitudo dictates the strength of the inference [34]. For example, the inference "If he is a man, he is an animate being" is valid because "animate being" is the genus of "man," a relation that supports the maxim "What the species is said of, the genus is said of as well" [34, 35].
• Structure: Abaelardus’s model showed the consequence being grounded in a maxim (the general rule) supported by an assumption (the material or local connection, the habitudo) (Table 8) [34, 36].
This historical trajectory demonstrates the persistent intellectual challenge—which modern schemes continue to address—of formally modeling persuasive, non-deductive arguments by linking abstract logical principles to the material relations inherent in the content of the propositions [37].
--------------------------------------------------------------------------------
Argumentation Schemes: Structure, Defeasibility, and Historical Origins
Argumentation schemes are central constructs in contemporary argumentation theory, delineating stereotypical, abstract patterns of inference that serve as the foundational building blocks for arguments deployed in quotidian and specialized reasoning contexts [1-3]. Unlike the strictures of classical deductive logic or standard statistical inferences based on Bayesian probability, argumentation schemes model defeasible forms of reasoning [4]. A comprehensive understanding of argumentation schemes necessitates an exploration of their core structure and a tracing of their intellectual lineage from ancient dialectical traditions to modern theoretical formalizations.
The Core Structure and Nature of Argumentation Schemes
Argumentation schemes function primarily as representations of the premise-conclusion structure of an argument, combining distinct inferential dimensions [4]. They are described as stereotypical patterns that merge semantic-ontological relations with specific types of reasoning and logical axioms, capturing the generalized structure of the most common forms of natural arguments [2, 5].
Defeasibility and Critical Questions
A defining characteristic of argumentation schemes is their defeasibility [4]. This means that the conclusion derived from the premises, though presumptive, is subject to retraction upon the introduction of new information or specific challenges [4, 6]. This crucial dimension is formalized through an associated set of Critical Questions (CQs) [4, 7].
These Critical Questions serve as dialectical instruments, establishing the necessary conditions for the scheme's applicability and representing possible weak points that an interlocutor can exploit to challenge the argument's strength [4, 7]. A critic can utilize these CQs to identify potential counter-arguments or sources of evidence for refuting the original argument [7].
The Fusion of Material and Logical Dimensions
Argumentation schemes intrinsically merge the material (or semantic) relation—the relationship between the concepts expressed by the warrant—with the logical relation (the type of inference) [5, 8, 9].
For instance, the scheme for Argument from Cause to Effect combines a semantic causal relation between two events with a defeasible form of modus ponens [8]. However, the sources emphasize that the material and logical relations can combine in diverse ways beyond the prototypical matching [5, 9]. For example, the same causal link (e.g., "Fever causes breathing fast") can yield conclusions based on different logical rules or reasoning types:
1. Defeasible Modus Ponens: Leading to a conclusion derived deductively ("He had fever. Therefore, he must have breathed fast") [10].
2. Defeasible Modus Tollens: Leading to a conclusion derived deductively ("He did not breathe fast. Therefore, he had no fever") [10].
3. Abductive Reasoning: Leading to conclusions by affirming the consequent or denying the antecedent ("He is breathing fast. Therefore, he might have fever") [10].
4. Inductive Generalization: Basing a conclusion on a single case ("You may have fever. When I had fever, I was breathing fast, and you are breathing fast") [10].
This inherent complexity highlights that a single semantic relation can be combined with various types and rules of reasoning, leading to distinct conclusions, a factor that must be considered in scheme classification [5].
Justification and Application
Argumentation schemes are justified both inductively and teleologically. Inductive justification is established through the analysis of a significant mass of real examples found in ordinary and specialized discourse (like legal or political argumentation), demonstrating that the forms of argument they represent are extremely common and influential [11-13].
Teleological justification argues that the use of a specific scheme is warranted by its utility; it serves an agent’s goals better than using nothing or other alternative schemata [6]. This pragmatic justification emphasizes that defeasible schemes enable agents to reach presumptive conclusions necessary for practical action when continuing evidence collection would cause undue delay or cost [6].
Historical Evolution: From Aristotelian Topoi to Modern Schemes
The development of argumentation schemes represents a modern continuation of the classical theory of topoi (or loci), which Aristotle described as the "places to find arguments" [14-16].
Aristotle and the Topoi
The Aristotelian topoi, principally detailed in the Topics and the Rhetoric, provided general principles of inference [15, 16]. They were often conceived as conditionals of the form "P, then Q" [17]. The variation among the topoi was based on the semantic or material relations between P and Q (e.g., genus-species, contraries, or similarity) [17]. The topoi functioned as general external rules of reasoning for an enthymeme (a rhetorical syllogism), providing the major premises necessary to warrant a conclusion [18, 19]. A fundamental distinction exists between:
1. Generic Topoi: Abstract and commonly shared conditionals that provide classes of both necessary and defeasible inferences [19, 20].
2. Idia (Specific Topics): Premises warranted within specific domains of knowledge, such as law, ethics, or medicine, which function as instruments of invention [19, 20].
It is essential to note that while modern argumentation schemes trace their roots to these traditions, Aristotle's descriptions of topoi do not, for the most part, closely resemble the detailed contemporary list of schemes [14].
Medieval Development: Cicero and Boethius
The tradition of topoi was subsequently developed by Roman and Medieval scholars:
Cicero: Cicero reduced the Aristotelian list to 20 loci or maxims, categorizing them into two broad classes: intrinsic topics (proceeding directly from the subject matter, like semantic properties) and extrinsic topics (supporting the conclusion through contextual elements, such as the source's authority) [21]. He also introduced loci focused purely on the logical meaning of connectors (antecedents, consequents, incompatibles) aimed at establishing commitments [22]. Furthermore, Cicero provided a classification of topics based on the issue of the discussion (stasis), such as conjecture, definition, and qualification [23].
Boethius: Boethius continued this tradition, differentiating between dialectical loci (stemming from rules of prediction and logic-semantic properties, sometimes necessary, like definition or genus) and rhetorical topoi (representing frequent connections between things, proceeding from stereotypes rather than concept properties) [24-26]. He interpreted the Aristotelian topoi as maximae propositiones (general principles/axioms) grouped under differentiae (genera of maxims) [27]. The relationship between terms (the differentia) determines the criterion of appropriateness for the maxim used [27].
Abaelardus: In the 12th century, Abaelardus considered topics to be imperfect inferences, distinct from strictly valid categorical syllogisms, because they rely on assumptions and content [28]. Dialectical inferences, in his view, depend on the habitudo, the specific topical (semantic-ontological) relation connecting the terms, rather than just the logical form [29].
The Modern Re-emergence
The rigorous study of these non-deductive forms of reasoning was largely superseded during the Enlightenment [30]. However, argumentation schemes experienced a significant comeback in the 20th century with the rise of argumentation studies [30]. Key foundational work in identifying and classifying these basic schemes was conducted by scholars including Hastings (1963), Perelman and Olbrechts-Tyteca (1969), Kienpointner (1992), and comprehensively cataloged in later works by Walton, Reed, and Macagno (2008) [30, 31].
Today, argumentation schemes such as argument from expert opinion, argument from cause to effect, practical reasoning, and argument from analogy are widely recognized and form the basis for advanced applications in computational argumentation models, including those used in Artificial Intelligence (AI), AI & Law, and argument mining [31, 32].