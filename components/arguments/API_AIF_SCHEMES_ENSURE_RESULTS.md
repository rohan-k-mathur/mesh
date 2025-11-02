Request URL
http://localhost:3001/api/aif/schemes?ensure=1
Request Method
GET
Status Code
200 OK
Remote Address
[::1]:3001
Referrer Policy
strict-origin-when-cross-origin

ensure=1

reponse: {
    "ok": true,
    "items": [
        {
            "id": "sch_37e8b28b3060a438",
            "key": "analogy",
            "name": "Analogy",
            "slotHints": {},
            "cqs": [
                {
                    "cqKey": "relevant_sims",
                    "text": "Are the relevant similarities strong?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "critical_diffs",
                    "text": "Are there critical differences?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "similarity_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "Case C₁ is similar to case C₂ in relevant respects R.",
                "minorPremise": "Property P holds in case C₁.",
                "conclusion": "Property P also holds in case C₂."
            }
        },
        {
            "id": "cmhh1p04s0004g1lrryj561rz",
            "key": "argument_from_composition",
            "name": "Argument from Composition",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "all_parts_have_property?",
                    "text": "Do all the parts really have property F?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "property_transfers?",
                    "text": "Is F the kind of property that transfers from parts to wholes?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "emergent_properties?",
                    "text": "Are there emergent properties of the whole that differ from the parts?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "other_factors?",
                    "text": "Is the composition of the parts the only relevant factor for F in the whole?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "structural_organization?",
                    "text": "Are the parts organized in a way that affects whether F applies to the whole?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "definition_family",
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmhh1p0pz0007g1lr7wvhz9qf",
            "key": "definition_to_classification",
            "name": "Argument from Definition to Verbal Classification",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "has_defining_properties?",
                    "text": "Does a really have all the properties F₁, F₂, ... Fₙ listed?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "definition_acceptable?",
                    "text": "Is the definition of G acceptable and authoritative?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "definition_type?",
                    "text": "Is the definition stipulative, lexical, or precising?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "properties_sufficient?",
                    "text": "Are the defining properties F₁, F₂, ... Fₙ sufficient for G?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "properties_necessary?",
                    "text": "Are the defining properties necessary for G?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "context_appropriate?",
                    "text": "Is the context one where this definition appropriately applies?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": "cmhh1p0iw0006g1lrwo90b7kr",
            "clusterTag": "definition_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "For all x, if x has defining properties F₁, F₂, ... Fₙ, then x is a G.",
                "minorPremise": "a has defining properties F₁, F₂, ... Fₙ.",
                "conclusion": "a is a G."
            }
        },
        {
            "id": "cmhh1p0bx0005g1lrk00g91mc",
            "key": "argument_from_division",
            "name": "Argument from Division",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "whole_has_property?",
                    "text": "Does the whole really have property F?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "property_distributes?",
                    "text": "Is F the kind of property that transfers from wholes to parts?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "non_distributive?",
                    "text": "Are there properties of the whole that do not distribute to the parts?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "all_parts?",
                    "text": "Do all parts have F, or only some?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "exceptions?",
                    "text": "Are there specific parts that are exceptions?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "definition_family",
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmhh1ozxr0003g1lrz880csfq",
            "key": "argument_from_example",
            "name": "Argument from Example",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "example_representative?",
                    "text": "Is the example cited representative of the population?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "counterexamples?",
                    "text": "Are there other relevant examples that would support a different conclusion?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "sample_size?",
                    "text": "Is the number of examples sufficient to support the generalization?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "relevant_differences?",
                    "text": "Are there relevant differences between the cited example and the case to which the conclusion is being applied?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "causal_link?",
                    "text": "Is the property F genuinely causally or evidentially connected to property G?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "similarity_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If example E is representative of population P, then what holds for E likely holds for P.",
                "minorPremise": "Example E has property F.",
                "conclusion": "Members of population P likely have property F."
            }
        },
        {
            "id": "sch_b762e6397e33b630",
            "key": "expert_opinion",
            "name": "Expert Opinion",
            "slotHints": {
                "premises": [
                    {
                        "role": "E",
                        "label": "Expert (entity)"
                    },
                    {
                        "role": "D",
                        "label": "Domain"
                    },
                    {
                        "role": "φ",
                        "label": "Statement asserted"
                    },
                    {
                        "role": "cred",
                        "label": "Credibility (optional)"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "bias",
                    "text": "Is E biased?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "basis",
                    "text": "Is E’s assertion based on evidence?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "domain_fit",
                    "text": "Is E an expert in D?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "consensus",
                    "text": "Do experts in D disagree on φ?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "authority_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "Source E is an expert in subject domain S containing proposition A.",
                "minorPremise": "E asserts that proposition A is true (false).",
                "conclusion": "A is true (false)."
            }
        },
        {
            "id": "cmghcusvd000lzq6mf0qmkrnf",
            "key": "negative_consequences",
            "name": "Argument from Negative Consequences",
            "slotHints": {},
            "cqs": [
                {
                    "cqKey": "mitigate",
                    "text": "Can A’s harms be mitigated?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "exaggerated",
                    "text": "Are the harms exaggerated or unlikely?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "NC.LIKELIHOOD",
                    "text": "Are the stated bad consequences likely to occur?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "NC.MITIGATION",
                    "text": "Can the bad effects be mitigated so they are acceptable?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "NC.TRADEOFFS",
                    "text": "Are there benefits that outweigh the bad effects?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": "cmghcuqw50009zq6mungs49z2",
            "clusterTag": "practical_reasoning_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If action A brings about bad consequences, then A should not be done.",
                "minorPremise": "Action A will bring about bad consequences.",
                "conclusion": "Action A should not be done."
            }
        },
        {
            "id": "cmhh1ozd70001g1lrwosu6l5e",
            "key": "popular_opinion",
            "name": "Argument from Popular Opinion",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "acceptance_evidence?",
                    "text": "What evidence supports the claim that A is generally accepted?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "group_representative?",
                    "text": "Is the group cited representative of the relevant population?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "alternative_opinions?",
                    "text": "Are there other groups whose opinion differs from the cited group?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "basis_for_acceptance?",
                    "text": "What is the basis for the popular acceptance of A?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "domain_appropriate_opinion?",
                    "text": "Is this a domain where popular opinion is a reliable indicator of truth?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "authority_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If the majority or a large group accepts proposition A, then A has presumptive support.",
                "minorPremise": "The majority (or group G) accepts that A is true.",
                "conclusion": "A is presumed true."
            }
        },
        {
            "id": "cmhh1ozk40002g1lrgjzhjbw3",
            "key": "popular_practice",
            "name": "Argument from Popular Practice",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "practice_evidence?",
                    "text": "What evidence supports the claim that most people do X?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "practitioners_representative?",
                    "text": "Are the people who do X representative?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "majority_wrong?",
                    "text": "Is there some reason why the majority might be wrong to do X?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "domain_appropriate_practice?",
                    "text": "Is this a domain where popular practice is a reliable guide to proper action?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "ethical_violation?",
                    "text": "Does the practice of the majority violate ethical standards?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": "cmhh1ozd70001g1lrwosu6l5e",
            "clusterTag": "authority_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If most people do X in situation S, then X is presumptively the right thing to do in S.",
                "minorPremise": "Most people do X in situation S.",
                "conclusion": "X is presumptively the right thing to do in S."
            }
        },
        {
            "id": "cmghcus0d000gzq6m14ffdqjk",
            "key": "positive_consequences",
            "name": "Argument from Positive Consequences",
            "slotHints": {},
            "cqs": [
                {
                    "cqKey": "tradeoffs",
                    "text": "Are there offsetting negative consequences?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "uncertain",
                    "text": "Are the claimed benefits uncertain?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "PC.LIKELIHOOD",
                    "text": "Are the stated good consequences likely to occur?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "PC.SIGNIFICANCE",
                    "text": "Are the good consequences significant enough to justify A?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "PC.NEG_SIDE",
                    "text": "Are there overlooked negative side‑effects outweighing the good?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": "cmghcuqw50009zq6mungs49z2",
            "clusterTag": "practical_reasoning_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If action A brings about good consequences, then A should be done.",
                "minorPremise": "Action A will bring about good consequences.",
                "conclusion": "Action A should be done."
            }
        },
        {
            "id": "cmhh1p0iw0006g1lrwo90b7kr",
            "key": "verbal_classification",
            "name": "Argument from Verbal Classification",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "has_property?",
                    "text": "Does a definitely have property F, or is there room for doubt?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "classification_acceptable?",
                    "text": "Is the verbal classification in the major premise acceptable?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "exceptional_circumstances?",
                    "text": "Are there exceptional circumstances in this case that would prevent the classification from holding?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "boundary_clear?",
                    "text": "Is the boundary of the classification category clear?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "alternative_classifications?",
                    "text": "Are there alternative classifications that might apply?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "definition_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "For all x, if x has property F, then x can be classified as having property G.",
                "minorPremise": "Individual a has property F.",
                "conclusion": "a has property G."
            }
        },
        {
            "id": "cmhh1oz550000g1lrs88rifhg",
            "key": "witness_testimony",
            "name": "Argument from Witness Testimony",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "witness_consistent?",
                    "text": "Is W internally consistent in the testimony?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "witness_honest?",
                    "text": "Is W an honest person?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "witness_biased?",
                    "text": "Is W biased?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testimony_corroborated_witnesses?",
                    "text": "Is the testimony corroborated by other witnesses?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testimony_corroborated_evidence?",
                    "text": "Is the testimony corroborated by evidence?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testimony_credible?",
                    "text": "Is W's testimony credible?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "authority_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "Witness W is in a position to know about events of type E.",
                "minorPremise": "W testifies that event E occurred.",
                "conclusion": "E occurred."
            }
        },
        {
            "id": "cmhfgzm4g00008cgp2txlizdo",
            "key": "test_scheme",
            "name": "Argument Scheme Test",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "testscheme_relevant_similarities",
                    "text": "Are the similarities between the cases relevant to the conclusion?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testscheme_critical_differences",
                    "text": "Are there critical differences that undermine the analogy?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testscheme_other_analogies",
                    "text": "Are there better or conflicting analogies?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "testscheme_internal_consistent",
                    "text": "Is the claim consistent with the arguer's other stated beliefs?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "testscheme_sample_representative",
                    "text": "Is the sample representative of the population?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "testscheme_sample_size",
                    "text": "Is the sample size sufficient for the generalization?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "testscheme_counterexamples",
                    "text": "Are there counterexamples to the generalization?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "testscheme_action_timing",
                    "text": "Is this the right time to take this action?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testscheme_action_proportionate",
                    "text": "Is the proposed action proportionate to the problem?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testscheme_empirical_support",
                    "text": "Is there sufficient empirical support for the descriptive claim?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "testscheme_relevance",
                    "text": "Are the premises relevant to the conclusion?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "testscheme_sufficient_grounds",
                    "text": "Are the premises sufficient to support the conclusion?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": null,
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmgkc9xnl0014g1o3cqftavjv",
            "key": "bare_assertion",
            "name": "Bare Assertion",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [],
            "parentSchemeId": null,
            "clusterTag": null,
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmghcuujl000vzq6moux6td2j",
            "key": "causal",
            "name": "Causal (If cause then effect)",
            "slotHints": {},
            "cqs": [
                {
                    "cqKey": "alt_causes",
                    "text": "Could another cause explain the effect?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "post_hoc",
                    "text": "Is this merely correlation (post hoc)?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "causal_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If event C occurs, then event E generally follows.",
                "minorPremise": "Event C has occurred.",
                "conclusion": "Event E will (or did) occur."
            }
        },
        {
            "id": "cmghcuvdn0010zq6mv0ywojs4",
            "key": "classification",
            "name": "Classification/Definition",
            "slotHints": {},
            "cqs": [
                {
                    "cqKey": "category_fit",
                    "text": "Does the case fit the category?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "definition_family",
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmghcuqw50009zq6mungs49z2",
            "key": "practical_reasoning",
            "name": "Practical Reasoning (Goal→Means→Ought)",
            "slotHints": {},
            "cqs": [
                {
                    "cqKey": "alternatives",
                    "text": "Are there better alternatives to A?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "feasible",
                    "text": "Is A feasible?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "side_effects",
                    "text": "Does A have significant negative consequences?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "PR.GOAL_ACCEPTED",
                    "text": "Is the goal/value G explicit and acceptable?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "PR.MEANS_EFFECTIVE",
                    "text": "Will doing A actually achieve G in the present context?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "PR.ALTERNATIVES",
                    "text": "Is there a better alternative than A to achieve G?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "PR.SIDE_EFFECTS",
                    "text": "Do negative consequences of A outweigh achieving G?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                },
                {
                    "cqKey": "PR.FEASIBILITY",
                    "text": "Is A feasible for the agent (ability, resources, time)?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "PR.PERMISSIBILITY",
                    "text": "Is doing A permissible/appropriate given norms or constraints?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": "practical_reasoning_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "Agent A has goal G.",
                "minorPremise": "Doing action X is a means to realize goal G.",
                "conclusion": "Agent A ought to (or should) do action X."
            }
        },
        {
            "id": "cmgms5zrq000jg1wik53dqjih",
            "key": "slippery_slope",
            "name": "Slippery Slope",
            "slotHints": {
                "premises": [
                    {
                        "role": "start",
                        "label": "Initial step A"
                    },
                    {
                        "role": "chain",
                        "label": "A → B → … → C (drift/pressure)"
                    },
                    {
                        "role": "endpoint",
                        "label": "Unacceptable endpoint C"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "SS.CHAIN_PLAUSIBLE",
                    "text": "Is the causal/probabilistic chain from A to C plausible?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "SS.STOPPING_POINTS",
                    "text": "Are there realistic stopping points or safeguards?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "SS.PROBABILITY",
                    "text": "How probable/typical is the slide under normal governance?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "SS.ENDPOINT_BAD",
                    "text": "Is the endpoint C truly unacceptable (all things considered)?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": "cmghcusvd000lzq6mf0qmkrnf",
            "clusterTag": "practical_reasoning_family",
            "inheritCQs": true,
            "formalStructure": {
                "majorPremise": "If we take step A, it will lead to steps B, C, ..., ending in unacceptable consequence Z.",
                "minorPremise": "We are considering taking step A.",
                "conclusion": "We should not take step A (to avoid Z)."
            }
        },
        {
            "id": "cmgms5x4o000fg1wizwfqnp9q",
            "key": "value_based_pr",
            "name": "Value‑based Practical Reasoning",
            "slotHints": {
                "premises": [
                    {
                        "role": "value",
                        "label": "Relevant value V"
                    },
                    {
                        "role": "promotion",
                        "label": "A promotes V (in this context)"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": "VB.RELEVANCE",
                    "text": "Is value V applicable in this context?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                },
                {
                    "cqKey": "VB.PROMOTES",
                    "text": "Does doing A really promote V here?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": "VB.CONFLICT",
                    "text": "Is there a conflicting/weightier value overriding V?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                }
            ],
            "parentSchemeId": "cmghcuqw50009zq6mungs49z2",
            "clusterTag": "practical_reasoning_family",
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmh1nxxts0018c0fy9kltjvi8",
            "key": "claim_relevance",
            "name": "Claim Relevance",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": null,
                    "text": "Is this claim relevant to the deliberation topic?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": null,
                    "text": "Does this claim directly address the issue being discussed?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": null,
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "sch_eef467cdb6b3bda2",
            "key": "good_consequences",
            "name": "Good Consequences",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": null,
                    "text": "How probable are the claimed consequences?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": null,
                    "text": "How significant (positive/negative) are they?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": null,
                    "text": "Are there material side-effects or trade-offs?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": null,
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmh1nxzij001ec0fyxopi3i04",
            "key": "claim_truth",
            "name": "Claim Truth",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": null,
                    "text": "Is the claim factually accurate?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": null,
                    "text": "Is there evidence to support this claim?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": null,
                    "text": "Is there expert consensus on this claim?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": null,
            "inheritCQs": true,
            "formalStructure": null
        },
        {
            "id": "cmh1nxyoi001bc0fyyhn7s8kn",
            "key": "claim_clarity",
            "name": "Claim Clarity",
            "slotHints": {
                "premises": [
                    {
                        "role": "reason",
                        "label": "Reason"
                    }
                ]
            },
            "cqs": [
                {
                    "cqKey": null,
                    "text": "Is the claim clearly and unambiguously stated?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                },
                {
                    "cqKey": null,
                    "text": "Are all key terms in the claim properly defined?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                }
            ],
            "parentSchemeId": null,
            "clusterTag": null,
            "inheritCQs": true,
            "formalStructure": null
        }
    ]
}

Request call stack
listSchemes	@	aifApi.ts:69
eval	@	AIFArgumentWithSchemeComposer.tsx:150
