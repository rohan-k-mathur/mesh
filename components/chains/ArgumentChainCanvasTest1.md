{
  "chainName": "argument-chain",
  "exportedAt": "2025-11-17T02:37:31.395Z",
  "nodes": [
    {
      "id": "cmi2iisaw00038crn5fgy3tf6",
      "type": "argumentNode",
      "position": {
        "x": 0,
        "y": 0
      },
      "data": {
        "argument": {
          "id": "cmhya65ap000pg10k4cs5utdo",
          "deliberationId": "ludics-forest-demo",
          "authorId": "12",
          "text": "",
          "sources": null,
          "confidence": null,
          "isImplicit": false,
          "schemeId": "cmghcusvd000lzq6mf0qmkrnf",
          "conclusionClaimId": "cmhy9i2dv000jg10k14c6ul7u",
          "implicitWarrant": null,
          "quantifier": null,
          "modality": null,
          "mediaType": "text",
          "mediaUrl": null,
          "createdAt": "2025-11-14T03:10:42.768Z",
          "lastUpdatedAt": "2025-11-14T03:10:42.768Z",
          "claimId": null,
          "createdByMoveId": null,
          "argumentSchemes": [
            {
              "id": "cmhya65nj000sg10krf1oewud",
              "argumentId": "cmhya65ap000pg10k4cs5utdo",
              "schemeId": "cmghcusvd000lzq6mf0qmkrnf",
              "confidence": 1,
              "isPrimary": true,
              "role": "primary",
              "explicitness": "explicit",
              "order": 0,
              "textEvidence": null,
              "justification": null,
              "createdAt": "2025-11-14T03:10:43.230Z",
              "updatedAt": "2025-11-14T03:10:43.230Z",
              "scheme": {
                "id": "cmghcusvd000lzq6mf0qmkrnf",
                "key": "negative_consequences",
                "name": "Argument from Negative Consequences",
                "description": null,
                "title": null,
                "summary": "",
                "cq": [
                  {
                    "text": "Are the stated bad consequences likely to occur?",
                    "cqKey": "NC.LIKELIHOOD"
                  },
                  {
                    "text": "Can the bad effects be mitigated so they are acceptable?",
                    "cqKey": "NC.MITIGATION"
                  },
                  {
                    "text": "Are there benefits that outweigh the bad effects?",
                    "cqKey": "NC.TRADEOFFS"
                  }
                ],
                "premises": null,
                "conclusion": null,
                "purpose": "action",
                "source": "internal",
                "materialRelation": "cause",
                "reasoningType": "inductive",
                "ruleForm": "defeasible_MP",
                "conclusionType": "ought",
                "slotHints": {},
                "validators": null,
                "parentSchemeId": "cmghcuqw50009zq6mungs49z2",
                "clusterTag": "practical_reasoning_family",
                "inheritCQs": true,
                "aspicMapping": {
                  "ruleId": "negative_consequences",
                  "ruleType": "defeasible",
                  "preferenceLevel": 5
                },
                "epistemicMode": "FACTUAL",
                "tags": [],
                "examples": [],
                "usageCount": 0,
                "difficulty": "intermediate",
                "identificationConditions": [],
                "whenToUse": "",
                "semanticCluster": "decision_making"
              }
            },
            {
              "id": "cmhyb039d001dg10kjs74wtuh",
              "argumentId": "cmhya65ap000pg10k4cs5utdo",
              "schemeId": "cmhh1p0pz0007g1lr7wvhz9qf",
              "confidence": 0.81,
              "isPrimary": false,
              "role": "presupposed",
              "explicitness": "presupposed",
              "order": 0,
              "textEvidence": "qwerqwe",
              "justification": "qwerqwerq",
              "createdAt": "2025-11-14T03:33:59.808Z",
              "updatedAt": "2025-11-14T03:33:59.808Z",
              "scheme": {
                "id": "cmhh1p0pz0007g1lr7wvhz9qf",
                "key": "definition_to_classification",
                "name": "Argument from Definition to Verbal Classification",
                "description": "This scheme uses an established definition to justify classifying something under a term. It makes the definitional basis explicit, distinguishing stipulative, lexical, and precising definitions.",
                "title": null,
                "summary": "Uses an established definition to justify classifying something under a term",
                "cq": [
                  {
                    "text": "Does a really have all the properties Fâ‚, Fâ‚‚, ... Fâ‚™ listed?",
                    "cqKey": "has_defining_properties?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                  },
                  {
                    "text": "Is the definition of G acceptable and authoritative?",
                    "cqKey": "definition_acceptable?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Is the definition stipulative, lexical, or precising?",
                    "cqKey": "definition_type?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Are the defining properties Fâ‚, Fâ‚‚, ... Fâ‚™ sufficient for G?",
                    "cqKey": "properties_sufficient?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Are the defining properties necessary for G?",
                    "cqKey": "properties_necessary?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Is the context one where this definition appropriately applies?",
                    "cqKey": "context_appropriate?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  }
                ],
                "premises": [
                  {
                    "id": "P1",
                    "text": "By definition, G means having properties Fâ‚, Fâ‚‚, ... Fâ‚™.",
                    "type": "major",
                    "variables": [
                      "G",
                      "Fâ‚",
                      "Fâ‚‚",
                      "Fâ‚™"
                    ]
                  },
                  {
                    "id": "P2",
                    "text": "Individual a has properties Fâ‚, Fâ‚‚, ... Fâ‚™.",
                    "type": "minor",
                    "variables": [
                      "a",
                      "Fâ‚",
                      "Fâ‚‚",
                      "Fâ‚™"
                    ]
                  }
                ],
                "conclusion": {
                  "text": "Therefore, a is (can be classified as) G.",
                  "variables": [
                    "a",
                    "G"
                  ]
                },
                "purpose": "state_of_affairs",
                "source": "internal",
                "materialRelation": "definition",
                "reasoningType": "deductive",
                "ruleForm": "MP",
                "conclusionType": "is",
                "slotHints": null,
                "validators": null,
                "parentSchemeId": "cmhh1p0iw0006g1lrwo90b7kr",
                "clusterTag": "definition_family",
                "inheritCQs": true,
                "aspicMapping": null,
                "epistemicMode": "FACTUAL",
                "tags": [],
                "examples": [],
                "usageCount": 0,
                "difficulty": "intermediate",
                "identificationConditions": [],
                "whenToUse": "",
                "semanticCluster": "classification"
              }
            }
          ],
          "schemeNet": {
            "id": "cmhyche2e009vg10ks14dier6",
            "argumentId": "cmhya65ap000pg10k4cs5utdo",
            "description": "{\"dependencies\":[{\"from\":\"\",\"to\":\"\",\"type\":\"sequential\",\"explanation\":\"they are sequential\"}]}",
            "overallConfidence": 1,
            "createdAt": "2025-11-14T04:15:26.581Z",
            "updatedAt": "2025-11-14T04:20:43.218Z",
            "steps": []
          }
        },
        "role": "PREMISE",
        "nodeOrder": 1,
        "addedBy": {
          "id": "12",
          "name": "Barthes",
          "image": "https://utfs.io/f/a25c738c-0936-4ab5-9ebc-cea39a1e8762-ua75ki.jpg"
        },
        "isHighlighted": false
      },
      "targetPosition": "top",
      "sourcePosition": "bottom",
      "width": 280,
      "height": 99,
      "positionAbsolute": {
        "x": 0,
        "y": 0
      }
    },
    {
      "id": "cmi2ikw0a00058crnjt2yd7dg",
      "type": "argumentNode",
      "position": {
        "x": 380,
        "y": 0
      },
      "data": {
        "argument": {
          "id": "cmhy5ivu00003g10k5j3esnfo",
          "deliberationId": "ludics-forest-demo",
          "authorId": "12",
          "text": "Human activity is causing dangerous global warming that requires immediate action Climate scientists overwhelmingly agree (97% consensus) that human activity is causing global warming Therefore, Therefore, the conclusion follows",
          "sources": null,
          "confidence": null,
          "isImplicit": false,
          "schemeId": "cmhh1p0bx0005g1lrk00g91mc",
          "conclusionClaimId": "cmhxtwiei012lg16mzje0loru",
          "implicitWarrant": null,
          "quantifier": null,
          "modality": null,
          "mediaType": "text",
          "mediaUrl": null,
          "createdAt": "2025-11-14T01:00:38.951Z",
          "lastUpdatedAt": "2025-11-14T01:00:38.951Z",
          "claimId": null,
          "createdByMoveId": null,
          "argumentSchemes": [
            {
              "id": "cmhy5iw7f0006g10k4i3bggzo",
              "argumentId": "cmhy5ivu00003g10k5j3esnfo",
              "schemeId": "cmhh1p0bx0005g1lrk00g91mc",
              "confidence": 1,
              "isPrimary": true,
              "role": "primary",
              "explicitness": "explicit",
              "order": 0,
              "textEvidence": null,
              "justification": null,
              "createdAt": "2025-11-14T01:00:39.434Z",
              "updatedAt": "2025-11-14T01:00:39.434Z",
              "scheme": {
                "id": "cmhh1p0bx0005g1lrk00g91mc",
                "key": "argument_from_division",
                "name": "Argument from Division",
                "description": "This scheme infers properties of parts from properties of the whole (the inverse of composition). Like composition, it's defeasible because not all properties distribute from wholes to parts.",
                "title": null,
                "summary": "Infers properties of parts from properties of the whole",
                "cq": [
                  {
                    "text": "Does the whole really have property F?",
                    "cqKey": "whole_has_property?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                  },
                  {
                    "text": "Is F the kind of property that transfers from wholes to parts?",
                    "cqKey": "property_distributes?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Are there properties of the whole that do not distribute to the parts?",
                    "cqKey": "non_distributive?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Do all parts have F, or only some?",
                    "cqKey": "all_parts?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                  },
                  {
                    "text": "Are there specific parts that are exceptions?",
                    "cqKey": "exceptions?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                  }
                ],
                "premises": [
                  {
                    "id": "P1",
                    "text": "The whole W has property F.",
                    "type": "major",
                    "variables": [
                      "W",
                      "F"
                    ]
                  },
                  {
                    "id": "P2",
                    "text": "(Implicit: What is true of the whole is true of its parts.)",
                    "type": "minor",
                    "variables": []
                  }
                ],
                "conclusion": {
                  "text": "Therefore, the parts (or members) of W have property F.",
                  "variables": [
                    "W",
                    "F"
                  ]
                },
                "purpose": "state_of_affairs",
                "source": "internal",
                "materialRelation": "definition",
                "reasoningType": "deductive",
                "ruleForm": "defeasible_MP",
                "conclusionType": "is",
                "slotHints": null,
                "validators": null,
                "parentSchemeId": null,
                "clusterTag": "definition_family",
                "inheritCQs": true,
                "aspicMapping": null,
                "epistemicMode": "FACTUAL",
                "tags": [],
                "examples": [],
                "usageCount": 0,
                "difficulty": "intermediate",
                "identificationConditions": [],
                "whenToUse": "",
                "semanticCluster": "classification"
              }
            },
            {
              "id": "cmhyd4zks00a5g10kf8q44bvc",
              "argumentId": "cmhy5ivu00003g10k5j3esnfo",
              "schemeId": "cmhh1ozk40002g1lrgjzhjbw3",
              "confidence": 0.75,
              "isPrimary": false,
              "role": "supporting",
              "explicitness": "implied",
              "order": 0,
              "textEvidence": "Specific text from the argument that demonstrates this scheme",
              "justification": "Your reasoning for adding this scheme",
              "createdAt": "2025-11-14T04:33:47.547Z",
              "updatedAt": "2025-11-14T04:33:47.547Z",
              "scheme": {
                "id": "cmhh1ozk40002g1lrgjzhjbw3",
                "key": "popular_practice",
                "name": "Argument from Popular Practice",
                "description": "This scheme argues that because most people do something, it is acceptable or should be done. Unlike popular opinion (about beliefs), this concerns popular practice (about actions).",
                "title": null,
                "summary": "Because most people do something, it is acceptable or should be done",
                "cq": [
                  {
                    "text": "What evidence supports the claim that most people do X?",
                    "cqKey": "practice_evidence?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                  },
                  {
                    "text": "Are the people who do X representative?",
                    "cqKey": "practitioners_representative?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Is there some reason why the majority might be wrong to do X?",
                    "cqKey": "majority_wrong?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                  },
                  {
                    "text": "Is this a domain where popular practice is a reliable guide to proper action?",
                    "cqKey": "domain_appropriate_practice?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Does the practice of the majority violate ethical standards?",
                    "cqKey": "ethical_violation?",
                    "attackType": "REBUTS",
                    "targetScope": "conclusion"
                  }
                ],
                "premises": [
                  {
                    "id": "P1",
                    "text": "If a large majority (everyone, nearly everyone) does X, then there is a presumption that X is the right (acceptable, approved) thing to do.",
                    "type": "major",
                    "variables": [
                      "X"
                    ]
                  },
                  {
                    "id": "P2",
                    "text": "A large majority (everyone, nearly everyone) does X.",
                    "type": "minor",
                    "variables": [
                      "X"
                    ]
                  }
                ],
                "conclusion": {
                  "text": "Therefore, there is a presumption that X is the right (acceptable, approved) thing to do.",
                  "variables": [
                    "X"
                  ]
                },
                "purpose": "action",
                "source": "external",
                "materialRelation": "practical",
                "reasoningType": "practical",
                "ruleForm": "defeasible_MP",
                "conclusionType": "ought",
                "slotHints": null,
                "validators": null,
                "parentSchemeId": "cmhh1ozd70001g1lrwosu6l5e",
                "clusterTag": "authority_family",
                "inheritCQs": true,
                "aspicMapping": null,
                "epistemicMode": "FACTUAL",
                "tags": [],
                "examples": [],
                "usageCount": 0,
                "difficulty": "intermediate",
                "identificationConditions": [
                  "practice is widespread",
                  "practice is established",
                  "practice has reasons",
                  "tradition is relevant"
                ],
                "whenToUse": "Use when citing established practices or traditions. Applies when you want to argue that something should be done because it's commonly done.",
                "semanticCluster": "authority"
              }
            }
          ],
          "schemeNet": {
            "id": "cmhyd5c9k00a7g10k03c5kn9k",
            "argumentId": "cmhy5ivu00003g10k5j3esnfo",
            "description": "{\"dependencies\":[{\"from\":\"cmhh1p0bx0005g1lrk00g91mc\",\"to\":\"cmhh1ozk40002g1lrgjzhjbw3\",\"type\":\"sequential\",\"explanation\":\"Explanation A\\n\\n\"}]}",
            "overallConfidence": 1,
            "createdAt": "2025-11-14T04:34:03.992Z",
            "updatedAt": "2025-11-14T04:38:03.799Z",
            "steps": []
          }
        },
        "role": "PREMISE",
        "nodeOrder": 2,
        "addedBy": {
          "id": "12",
          "name": "Barthes",
          "image": "https://utfs.io/f/a25c738c-0936-4ab5-9ebc-cea39a1e8762-ua75ki.jpg"
        },
        "isHighlighted": false
      },
      "targetPosition": "top",
      "sourcePosition": "bottom",
      "width": 280,
      "height": 151,
      "positionAbsolute": {
        "x": 380,
        "y": 0
      }
    },
    {
      "id": "cmi2in1z200078crn9ucdi2mq",
      "type": "argumentNode",
      "position": {
        "x": 190,
        "y": 660
      },
      "data": {
        "argument": {
          "id": "cmhxuu4aw0140g16mapzc713c",
          "deliberationId": "ludics-forest-demo",
          "authorId": "12",
          "text": "There are indeed critical differences between A and B. Doing A is permissible given the norms and constraints of the context C. Therefore, Therefore, the conclusion follows",
          "sources": null,
          "confidence": null,
          "isImplicit": false,
          "schemeId": "cmhh1p0pz0007g1lr7wvhz9qf",
          "conclusionClaimId": "cmhxtwiei012lg16mzje0loru",
          "implicitWarrant": null,
          "quantifier": null,
          "modality": null,
          "mediaType": "text",
          "mediaUrl": null,
          "createdAt": "2025-11-13T20:01:27.368Z",
          "lastUpdatedAt": "2025-11-13T20:01:27.368Z",
          "claimId": null,
          "createdByMoveId": null,
          "argumentSchemes": [
            {
              "id": "cmhxuu4n50143g16miiz1y5gy",
              "argumentId": "cmhxuu4aw0140g16mapzc713c",
              "schemeId": "cmhh1p0pz0007g1lr7wvhz9qf",
              "confidence": 1,
              "isPrimary": true,
              "role": "primary",
              "explicitness": "explicit",
              "order": 0,
              "textEvidence": null,
              "justification": null,
              "createdAt": "2025-11-13T20:01:27.809Z",
              "updatedAt": "2025-11-13T20:01:27.809Z",
              "scheme": {
                "id": "cmhh1p0pz0007g1lr7wvhz9qf",
                "key": "definition_to_classification",
                "name": "Argument from Definition to Verbal Classification",
                "description": "This scheme uses an established definition to justify classifying something under a term. It makes the definitional basis explicit, distinguishing stipulative, lexical, and precising definitions.",
                "title": null,
                "summary": "Uses an established definition to justify classifying something under a term",
                "cq": [
                  {
                    "text": "Does a really have all the properties Fâ‚, Fâ‚‚, ... Fâ‚™ listed?",
                    "cqKey": "has_defining_properties?",
                    "attackType": "UNDERMINES",
                    "targetScope": "premise"
                  },
                  {
                    "text": "Is the definition of G acceptable and authoritative?",
                    "cqKey": "definition_acceptable?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Is the definition stipulative, lexical, or precising?",
                    "cqKey": "definition_type?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Are the defining properties Fâ‚, Fâ‚‚, ... Fâ‚™ sufficient for G?",
                    "cqKey": "properties_sufficient?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Are the defining properties necessary for G?",
                    "cqKey": "properties_necessary?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  },
                  {
                    "text": "Is the context one where this definition appropriately applies?",
                    "cqKey": "context_appropriate?",
                    "attackType": "UNDERCUTS",
                    "targetScope": "inference"
                  }
                ],
                "premises": [
                  {
                    "id": "P1",
                    "text": "By definition, G means having properties Fâ‚, Fâ‚‚, ... Fâ‚™.",
                    "type": "major",
                    "variables": [
                      "G",
                      "Fâ‚",
                      "Fâ‚‚",
                      "Fâ‚™"
                    ]
                  },
                  {
                    "id": "P2",
                    "text": "Individual a has properties Fâ‚, Fâ‚‚, ... Fâ‚™.",
                    "type": "minor",
                    "variables": [
                      "a",
                      "Fâ‚",
                      "Fâ‚‚",
                      "Fâ‚™"
                    ]
                  }
                ],
                "conclusion": {
                  "text": "Therefore, a is (can be classified as) G.",
                  "variables": [
                    "a",
                    "G"
                  ]
                },
                "purpose": "state_of_affairs",
                "source": "internal",
                "materialRelation": "definition",
                "reasoningType": "deductive",
                "ruleForm": "MP",
                "conclusionType": "is",
                "slotHints": null,
                "validators": null,
                "parentSchemeId": "cmhh1p0iw0006g1lrwo90b7kr",
                "clusterTag": "definition_family",
                "inheritCQs": true,
                "aspicMapping": null,
                "epistemicMode": "FACTUAL",
                "tags": [],
                "examples": [],
                "usageCount": 0,
                "difficulty": "intermediate",
                "identificationConditions": [],
                "whenToUse": "",
                "semanticCluster": "classification"
              }
            }
          ],
          "schemeNet": null
        },
        "role": "CONCLUSION",
        "nodeOrder": 3,
        "addedBy": {
          "id": "12",
          "name": "Barthes",
          "image": "https://utfs.io/f/a25c738c-0936-4ab5-9ebc-cea39a1e8762-ua75ki.jpg"
        },
        "isHighlighted": false
      },
      "targetPosition": "top",
      "sourcePosition": "bottom",
      "width": 280,
      "height": 151,
      "positionAbsolute": {
        "x": 190,
        "y": 660
      }
    },
    {
      "id": "cmi2iyh5k00098crne90w8so8",
      "type": "argumentNode",
      "position": {
        "x": 190,
        "y": 330
      },
      "data": {
        "argument": {
          "id": "cmhpnanv000yog1t914o7tsif",
          "deliberationId": "ludics-forest-demo",
          "authorId": "12",
          "text": "",
          "sources": null,
          "confidence": null,
          "isImplicit": false,
          "schemeId": "cmghcuqw50009zq6mungs49z2",
          "conclusionClaimId": "cmhpna9vv00yjg1t9l7qs7n5i",
          "implicitWarrant": null,
          "quantifier": null,
          "modality": null,
          "mediaType": "text",
          "mediaUrl": null,
          "createdAt": "2025-11-08T02:08:12.875Z",
          "lastUpdatedAt": "2025-11-08T02:08:12.875Z",
          "claimId": null,
          "createdByMoveId": null,
          "argumentSchemes": [
            {
              "id": "cmhpnao6200yrg1t9lyv0joph",
              "argumentId": "cmhpnanv000yog1t914o7tsif",
              "schemeId": "cmghcuqw50009zq6mungs49z2",
              "confidence": 1,
              "isPrimary": true,
              "role": "primary",
              "explicitness": "explicit",
              "order": 0,
              "textEvidence": null,
              "justification": null,
              "createdAt": "2025-11-08T02:08:13.275Z",
              "updatedAt": "2025-11-10T00:25:17.273Z",
              "scheme": {
                "id": "cmghcuqw50009zq6mungs49z2",
                "key": "practical_reasoning",
                "name": "Practical Reasoning (Goalâ†’Meansâ†’Ought)",
                "description": null,
                "title": null,
                "summary": "",
                "cq": [
                  {
                    "text": "Is the goal/value G explicit and acceptable?",
                    "cqKey": "PR.GOAL_ACCEPTED"
                  },
                  {
                    "text": "Will doing A actually achieve G in the present context?",
                    "cqKey": "PR.MEANS_EFFECTIVE"
                  },
                  {
                    "text": "Is there a better alternative than A to achieve G?",
                    "cqKey": "PR.ALTERNATIVES"
                  },
                  {
                    "text": "Do negative consequences of A outweigh achieving G?",
                    "cqKey": "PR.SIDE_EFFECTS"
                  },
                  {
                    "text": "Is A feasible for the agent (ability, resources, time)?",
                    "cqKey": "PR.FEASIBILITY"
                  },
                  {
                    "text": "Is doing A permissible/appropriate given norms or constraints?",
                    "cqKey": "PR.PERMISSIBILITY"
                  }
                ],
                "premises": null,
                "conclusion": null,
                "purpose": "action",
                "source": "internal",
                "materialRelation": "practical",
                "reasoningType": "practical",
                "ruleForm": "defeasible_MP",
                "conclusionType": "ought",
                "slotHints": {},
                "validators": null,
                "parentSchemeId": null,
                "clusterTag": "practical_reasoning_family",
                "inheritCQs": true,
                "aspicMapping": {
                  "ruleId": "practical_reasoning",
                  "ruleType": "defeasible",
                  "preferenceLevel": 6
                },
                "epistemicMode": "FACTUAL",
                "tags": [],
                "examples": [],
                "usageCount": 0,
                "difficulty": "intermediate",
                "identificationConditions": [
                  "agent has goal",
                  "action leads to goal",
                  "no better alternative exists",
                  "action is feasible"
                ],
                "whenToUse": "Use when arguing for a course of action. Applies when recommending what someone should do to achieve their goals.",
                "semanticCluster": "decision_making"
              }
            }
          ],
          "schemeNet": null
        },
        "role": "CONCLUSION",
        "nodeOrder": 4,
        "addedBy": {
          "id": "12",
          "name": "Barthes",
          "image": "https://utfs.io/f/a25c738c-0936-4ab5-9ebc-cea39a1e8762-ua75ki.jpg"
        },
        "isHighlighted": false
      },
      "targetPosition": "top",
      "sourcePosition": "bottom",
      "width": 280,
      "height": 99,
      "positionAbsolute": {
        "x": 190,
        "y": 330
      }
    }
  ]
}