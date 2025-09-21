What could mean interaction in natural language and how could it
be useful ?
Christophe Fouquere´
CNRS-LIPN / Universite Paris 13 ´
christophe.fouquere@univ-paris13.fr
Myriam Quatrini
CNRS-I2M / Aix-Marseille Universite´
myriam.quatrini@univ-amu.fr
What could mean interaction in natural
language. The notion of Interaction, which
is central in different fields, from Computer
Sciences to Conversational Analysis, seems to
be a same term amounting to rather distinct
processes. Nevertheless, we think that the
same, even if abstract, concept of interaction
should underlie its incarnations in different
disciplines. In Ludics, a logical theory developed by J.Y. Girard (2001), such an abstract
concept of interaction is available. We postulate that this formal approach may help us to
better understand what is interaction in natural
language, and therefore that some language
phenomenons may be better grasped and manipulated by means of a modeling based on
such conceptual considerations.
In Ludics, there is a unique primitive concept:
interaction, acting according to two modes.
The closed mode is the process of communication itself, the open mode accounts for the
transformation that this communication process induces on contexts. We may consider
that in natural language also, interaction is a
common concept subsuming two modes. With
the communication mode, elements of language are produced and received by interlocutors during a dialogue. With the composition
mode, elements of language are composed
together to produce either more elaborated
elements of language or to update knowledges and commitments. Therefore, based
on the Ludics theoretical frame, we proposed
in (Lecomte and Quatrini, 2011; Fouquere´
and Quatrini, 2013; Fouquere and Quatrini, ´
2012) a dialogue modeling that accounts for
both aspects of interaction: communication
and computation. Our model of dialogue is
organized in two levels. At the first level,
called surface of dialogues, a dialogue is represented by an interaction between two trees,
each of them is the dialogue seen from the
viewpoint of one interlocutor. More precisely,
each turn of speech is a sequence of dialogue
acts, where each dialogue act is represented
twice: once positively inside the tree associated to the speaker who produces it, and
once negatively inside the tree associated to
her addressee. Therefore, each turn of speech
gives rise to a part of both trees growing bottom/up. At a second level, knowledges and
commitments as well as linguistic elements
used to build utterances are stored in two cognitive bases, each one respectively associated
to each interlocutor.
Dialogical contributions such as questions,
answers and concessions. Even if the types
of such speech acts are at first departed by
the goals and the intentions of an interlocutor during a dialogue, the inspection that our
modeling enables retains more primitive features. Question and negation are not really
distinguishable according to their effects on
the structure of dialogues, both are particular
cases of a general speech act we may call “request for justification”. Its main feature, for174
malized at the surface of dialogue, is to be
a unique dialogue act creating a unique new
address where the addressee is invited to anchor her development. On another side, question and concession are very close according
to their effect on cognitive bases. When she
asks a question, a speaker not only formulates
it, but she is ready to receive and register an
answer. In the cognitive base of the speaker,
the tree associated with the question contains
not only the dialogue act corresponding to the
formulation of the question but also the tools
to compute the reception and the registration
of possible answers by means of a copycat
strategy. The argument of the function is the
answer to the question, also represented by a
tree. The application of such a function to its
argument gives rise to an execution: an interaction between the two trees. After the interaction, the cognitive base is augmented with
the information given by the answer. To sum
up, in the cognitive base, the question is associated to a tree which enables an updating.
Moreover, we may remark that the effect of
concession in cognitive bases is similar: when
an interlocutor concedes a position claimed by
her addressee, she records this position in her
own cognitive base, still using a tree which enables to copy such a position and record it.
Grasping cognitive processes as computation. D. Prawitz (2007) studies the elements
that determine the validity of inferences. In
particular, he shows that the Modus Ponens
rule is insufficient for taking into account the
cognitive process at stake when an addressee
is convinced by an argumentation. Instead it
is the phenomenon of cut elimination which
accounts correctly for what is responsible of
the conviction. For D. Prawitz, the cognitive
process requires a proof of one premise followed by the deductive extraction from this
premise towards a conclusion. By this way,
the addressee of an argumentation is obliged
to accept an inference, if she stays rational.
Our dialogue modeling follows and even more
goes further Prawitz analysis. According to
the theoretical framework on which our modelization is based, a proposition is denoted by
the set of its justifications, whereas classically
a proposition is formalized as a simple logical
formula. In the same way, a “claim”, a “thesis”, a “belief” on which a protagonist commits herself during a controversy, is denoted
by a sequence of arguments in a proof-like
style. Such sequences of arguments make explicit the process according to which the protagonist is convinced by the validity of her
commitments. It is worth noticing the two following points:
- Such a justification is formally a cut-free
proof. It is the trace of the thought process
which achieves the conviction about a proposition (close mode).
- Cut-free proofs at stake may interact: This
process (open mode) yields a new cut-free
proof that represents the new knowledge.
References
Christophe Fouquere and Myriam Quatrini. 2012. ´
Ludics and Natural Language: First Approaches. In Logical Aspects of Computational
Linguistics. Folli-LNAI, Springer.
Christophe Fouquere and Myriam Quatrini. 2013. ´
Argumentation and inference: A unified approach. Baltic International Yearbook of Cognition, Logic and Communication, 8(4):1–41.
Jean-Yves Girard. 2001. Locus solum: From the
rules of logic to the logic of rules. Mathematical Structures in Computer Science, 11(3):301–
506.
Alain Lecomte and Myriam Quatrini. 2011. Figures of Dialogue: a View from Ludics. Synthese, 183:59–85.
Dag Prawitz. 2007. Validity of inferences. In
”The 2nd Launer Symposium on Analytical
Philosophy on the Occasion of the Presentation
of the Launer Prize, Dagfinn Fllesdal”, in Bern.