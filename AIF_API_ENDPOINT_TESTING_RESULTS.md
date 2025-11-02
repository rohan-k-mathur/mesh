1. http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2: 

@prefix aif: <http://www.arg.dundee.ac.uk/aif#>.
@prefix mesh: <http://mesh-platform.io/ontology/aif#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<http://mesh-platform.io/aif/schemes/practical_reasoning> a aif:Scheme;
    rdfs:label "practical_reasoning";
    aif:schemeName "Practical Reasoning (Goalâ†’Meansâ†’Ought)";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> aif:questionText "Are there better alternatives to A?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> aif:questionText "Is A feasible?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> aif:questionText "Does A have significant negative consequences?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> aif:questionText "Is the goal/value G explicit and acceptable?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> aif:questionText "Will doing A actually achieve G in the present context?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> aif:questionText "Is there a better alternative than A to achieve G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> aif:questionText "Do negative consequences of A outweigh achieving G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> aif:questionText "Is A feasible for the agent (ability, resources, time)?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> aif:questionText "Is doing A permissible/appropriate given norms or constraints?";
    mesh:attackKind "REBUTS".


2. http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?format=rdfxml: 
Was downloaded and could be opened by Zotero but I couldn't see the contents of it -- not sure how to access the file: cmghcuqw50009zq6mungs49z2.rdf

3. http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?format=jsonld:

{
  "@context": {
    "aif": "http://www.arg.dundee.ac.uk/aif#",
    "mesh": "http://mesh-platform.io/ontology/aif#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "owl": "http://www.w3.org/2002/07/owl#",
    "xsd": "http://www.w3.org/2001/XMLSchema#"
  },
  "@graph": [
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Scheme"
      },
      "rdfs:label": {
        "@value": "practical_reasoning",
        "@type": "xsd:string"
      },
      "aif:schemeName": {
        "@value": "Practical Reasoning (Goal→Means→Ought)",
        "@type": "xsd:string"
      },
      "rdfs:comment": {
        "@value": "",
        "@type": "xsd:string"
      },
      "mesh:clusterTag": {
        "@value": "practical_reasoning_family",
        "@type": "xsd:string"
      },
      "mesh:inheritCQs": {
        "@value": "true",
        "@type": "xsd:boolean"
      },
      "aif:hasQuestion": [
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY"
        },
        {
          "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY"
        }
      ]
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Are there better alternatives to A?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "UNDERCUTS",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Is A feasible?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "UNDERCUTS",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Does A have significant negative consequences?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "UNDERCUTS",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Is the goal/value G explicit and acceptable?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "UNDERMINES",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Will doing A actually achieve G in the present context?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "UNDERCUTS",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Is there a better alternative than A to achieve G?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "REBUTS",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Do negative consequences of A outweigh achieving G?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "REBUTS",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Is A feasible for the agent (ability, resources, time)?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "UNDERMINES",
        "@type": "xsd:string"
      }
    },
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY",
      "rdf:type": {
        "@id": "http://www.arg.dundee.ac.uk/aif#Question"
      },
      "aif:questionText": {
        "@value": "Is doing A permissible/appropriate given norms or constraints?",
        "@type": "xsd:string"
      },
      "mesh:attackKind": {
        "@value": "REBUTS",
        "@type": "xsd:string"
      }
    }
  ]
}

4. http://localhost:3002/api/aif/export/key/practical_reasoning:

@prefix aif: <http://www.arg.dundee.ac.uk/aif#>.
@prefix mesh: <http://mesh-platform.io/ontology/aif#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<http://mesh-platform.io/aif/schemes/practical_reasoning> a aif:Scheme;
    rdfs:label "practical_reasoning";
    aif:schemeName "Practical Reasoning (Goalâ†’Meansâ†’Ought)";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> aif:questionText "Are there better alternatives to A?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> aif:questionText "Is A feasible?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> aif:questionText "Does A have significant negative consequences?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> aif:questionText "Is the goal/value G explicit and acceptable?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> aif:questionText "Will doing A actually achieve G in the present context?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> aif:questionText "Is there a better alternative than A to achieve G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> aif:questionText "Do negative consequences of A outweigh achieving G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> aif:questionText "Is A feasible for the agent (ability, resources, time)?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> aif:questionText "Is doing A permissible/appropriate given norms or constraints?";
    mesh:attackKind "REBUTS".

5. http://localhost:3002/api/aif/export/cluster/practical_reasoning_family:

@prefix aif: <http://www.arg.dundee.ac.uk/aif#>.
@prefix mesh: <http://mesh-platform.io/ontology/aif#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<http://mesh-platform.io/aif/schemes/value_based_pr> a aif:Scheme;
    rdfs:label "value_based_pr";
    aif:schemeName "Valueâ€‘based Practical Reasoning";
    rdfs:comment "Action A is recommended because it promotes value V.";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.RELEVANCE> a aif:Question.
<http://mesh-platform.io/aif/schemes/value_based_pr> aif:hasQuestion <http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.RELEVANCE>.
<http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.RELEVANCE> aif:questionText "Is value V applicable in this context?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.PROMOTES> a aif:Question.
<http://mesh-platform.io/aif/schemes/value_based_pr> aif:hasQuestion <http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.PROMOTES>.
<http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.PROMOTES> aif:questionText "Does doing A really promote V here?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.CONFLICT> a aif:Question.
<http://mesh-platform.io/aif/schemes/value_based_pr> aif:hasQuestion <http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.CONFLICT>.
<http://mesh-platform.io/aif/schemes/value_based_pr/questions/VB.CONFLICT> aif:questionText "Is there a conflicting/weightier value overriding V?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/slippery_slope> a aif:Scheme;
    rdfs:label "slippery_slope";
    aif:schemeName "Slippery Slope";
    rdfs:comment "Doing A will (likely) lead down a chain to unacceptable C; therefore avoid A.";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.CHAIN_PLAUSIBLE> a aif:Question.
<http://mesh-platform.io/aif/schemes/slippery_slope> aif:hasQuestion <http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.CHAIN_PLAUSIBLE>.
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.CHAIN_PLAUSIBLE> aif:questionText "Is the causal/probabilistic chain from A to C plausible?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.STOPPING_POINTS> a aif:Question.
<http://mesh-platform.io/aif/schemes/slippery_slope> aif:hasQuestion <http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.STOPPING_POINTS>.
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.STOPPING_POINTS> aif:questionText "Are there realistic stopping points or safeguards?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.PROBABILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/slippery_slope> aif:hasQuestion <http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.PROBABILITY>.
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.PROBABILITY> aif:questionText "How probable/typical is the slide under normal governance?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.ENDPOINT_BAD> a aif:Question.
<http://mesh-platform.io/aif/schemes/slippery_slope> aif:hasQuestion <http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.ENDPOINT_BAD>.
<http://mesh-platform.io/aif/schemes/slippery_slope/questions/SS.ENDPOINT_BAD> aif:questionText "Is the endpoint C truly unacceptable (all things considered)?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/positive_consequences> a aif:Scheme;
    rdfs:label "positive_consequences";
    aif:schemeName "Argument from Positive Consequences";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/tradeoffs> a aif:Question.
<http://mesh-platform.io/aif/schemes/positive_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/positive_consequences/questions/tradeoffs>.
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/tradeoffs> aif:questionText "Are there offsetting negative consequences?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/uncertain> a aif:Question.
<http://mesh-platform.io/aif/schemes/positive_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/positive_consequences/questions/uncertain>.
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/uncertain> aif:questionText "Are the claimed benefits uncertain?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.LIKELIHOOD> a aif:Question.
<http://mesh-platform.io/aif/schemes/positive_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.LIKELIHOOD>.
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.LIKELIHOOD> aif:questionText "Are the stated good consequences likely to occur?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.SIGNIFICANCE> a aif:Question.
<http://mesh-platform.io/aif/schemes/positive_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.SIGNIFICANCE>.
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.SIGNIFICANCE> aif:questionText "Are the good consequences significant enough to justify A?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.NEG_SIDE> a aif:Question.
<http://mesh-platform.io/aif/schemes/positive_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.NEG_SIDE>.
<http://mesh-platform.io/aif/schemes/positive_consequences/questions/PC.NEG_SIDE> aif:questionText "Are there overlooked negative sideâ€‘effects outweighing the good?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/negative_consequences> a aif:Scheme;
    rdfs:label "negative_consequences";
    aif:schemeName "Argument from Negative Consequences";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/mitigate> a aif:Question.
<http://mesh-platform.io/aif/schemes/negative_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/negative_consequences/questions/mitigate>.
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/mitigate> aif:questionText "Can Aâ€™s harms be mitigated?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/exaggerated> a aif:Question.
<http://mesh-platform.io/aif/schemes/negative_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/negative_consequences/questions/exaggerated>.
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/exaggerated> aif:questionText "Are the harms exaggerated or unlikely?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.LIKELIHOOD> a aif:Question.
<http://mesh-platform.io/aif/schemes/negative_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.LIKELIHOOD>.
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.LIKELIHOOD> aif:questionText "Are the stated bad consequences likely to occur?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.MITIGATION> a aif:Question.
<http://mesh-platform.io/aif/schemes/negative_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.MITIGATION>.
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.MITIGATION> aif:questionText "Can the bad effects be mitigated so they are acceptable?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.TRADEOFFS> a aif:Question.
<http://mesh-platform.io/aif/schemes/negative_consequences> aif:hasQuestion <http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.TRADEOFFS>.
<http://mesh-platform.io/aif/schemes/negative_consequences/questions/NC.TRADEOFFS> aif:questionText "Are there benefits that outweigh the bad effects?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning> a aif:Scheme;
    rdfs:label "practical_reasoning";
    aif:schemeName "Practical Reasoning (Goalâ†’Meansâ†’Ought)";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> aif:questionText "Are there better alternatives to A?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> aif:questionText "Is A feasible?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> aif:questionText "Does A have significant negative consequences?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> aif:questionText "Is the goal/value G explicit and acceptable?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> aif:questionText "Will doing A actually achieve G in the present context?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> aif:questionText "Is there a better alternative than A to achieve G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> aif:questionText "Do negative consequences of A outweigh achieving G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> aif:questionText "Is A feasible for the agent (ability, resources, time)?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> aif:questionText "Is doing A permissible/appropriate given norms or constraints?";
    mesh:attackKind "REBUTS".

6. http://localhost:3002/api/aif/export/key/practical_reasoning?format=turtle&includeCQs=true&includeHierarchy=true&download=true: 

Created and downloaded practical_reasoning.ttl: @prefix aif: <http://www.arg.dundee.ac.uk/aif#>.
@prefix mesh: <http://mesh-platform.io/ontology/aif#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

<http://mesh-platform.io/aif/schemes/practical_reasoning> a aif:Scheme;
    rdfs:label "practical_reasoning";
    aif:schemeName "Practical Reasoning (Goal→Means→Ought)";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/alternatives> aif:questionText "Are there better alternatives to A?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/feasible> aif:questionText "Is A feasible?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/side_effects> aif:questionText "Does A have significant negative consequences?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.GOAL_ACCEPTED> aif:questionText "Is the goal/value G explicit and acceptable?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.MEANS_EFFECTIVE> aif:questionText "Will doing A actually achieve G in the present context?";
    mesh:attackKind "UNDERCUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.ALTERNATIVES> aif:questionText "Is there a better alternative than A to achieve G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.SIDE_EFFECTS> aif:questionText "Do negative consequences of A outweigh achieving G?";
    mesh:attackKind "REBUTS".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.FEASIBILITY> aif:questionText "Is A feasible for the agent (ability, resources, time)?";
    mesh:attackKind "UNDERMINES".
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> a aif:Question.
<http://mesh-platform.io/aif/schemes/practical_reasoning> aif:hasQuestion <http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY>.
<http://mesh-platform.io/aif/schemes/practical_reasoning/questions/PR.PERMISSIBILITY> aif:questionText "Is doing A permissible/appropriate given norms or constraints?";
    mesh:attackKind "REBUTS".




