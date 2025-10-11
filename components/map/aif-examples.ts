// lib/arguments/aif-examples.ts
// Example AIF graphs for testing, based on the AIF specification diagrams
import type { AifNode } from "@/lib/arguments/diagram";
import type { AifSubgraph } from "@/lib/arguments/diagram";
/**
 * Figure 2: Simple Defeasible Modus Ponens
 * Shows: p, p→q supporting q via ra2
 */
export const defeasibleModusPonens: AifSubgraph = {
  nodes: [
    { id: 'I:p', kind: 'I', label: 'p' },
    { id: 'I:p_implies_q', kind: 'I', label: 'p → q' },
    { id: 'cmf5xyhn4001brmbywr3d41a9', kind: 'RA', label: 'ra2' },
    { id: 'I:q', kind: 'I', label: 'q' },
  ],
  edges: [
    { id: 'e1', from: 'I:p', to: 'cmf5xyhn4001brmbywr3d41a9', role: 'premise' },
    { id: 'e2', from: 'I:p_implies_q', to: 'cmf5xyhn4001brmbywr3d41a9', role: 'premise' },
    { id: 'e3', from: 'cmf5xyhn4001brmbywr3d41a9', to: 'I:q', role: 'conclusion' },
  ],
};

/**
 * Figure 4: Preference Between Inferences (Expert Opinion vs General Knowledge)
 * Shows: pa11 preferring expert opinion (ra12) over general knowledge (ra13)
 */
export const expertOpinionPreference: AifSubgraph = {
  nodes: [
    // Expert opinion argument
    { id: 'I:e1_asserts', kind: 'I', label: 'e₁ asserts p' },
    { id: 'I:e1_expert', kind: 'I', label: 'e₁ is an expert in d₁' },
    { id: 'I:p_in_d1', kind: 'I', label: 'p is in d₁' },
    { id: 'RA:ra12', kind: 'RA', label: 'ra12' },
    { id: 'I:p', kind: 'I', label: 'p' },
    
    // General knowledge argument
    { id: 'I:general_knowledge', kind: 'I', label: 'It is general knowledge that ¬p' },
    { id: 'RA:ra13', kind: 'RA', label: 'ra13' },
    { id: 'I:not_p', kind: 'I', label: '¬p' },
    
    // Preference application
    { id: 'PA:pa11', kind: 'PA', label: 'EO over GK' },
  ],
  edges: [
    // Expert opinion inference
    { id: 'e1', from: 'I:e1_asserts', to: 'RA:ra12', role: 'premise' },
    { id: 'e2', from: 'I:e1_expert', to: 'RA:ra12', role: 'premise' },
    { id: 'e3', from: 'I:p_in_d1', to: 'RA:ra12', role: 'premise' },
    { id: 'e4', from: 'RA:ra12', to: 'I:p', role: 'conclusion' },
    
    // General knowledge inference
    { id: 'e5', from: 'I:general_knowledge', to: 'RA:ra13', role: 'premise' },
    { id: 'e6', from: 'RA:ra13', to: 'I:not_p', role: 'conclusion' },
    
    // Preference
    { id: 'e7', from: 'RA:ra12', to: 'PA:pa11', role: 'preferredElement' },
    { id: 'e8', from: 'PA:pa11', to: 'RA:ra13', role: 'dispreferredElement' },
  ],
};

/**
 * Figure 5: Example AIF Graph with Conflicts and Preferences
 * Complex graph showing multiple inferences, conflicts, and preferences
 */
export const complexExample: AifSubgraph = {
  nodes: [
    // Bottom layer
    { id: 'I:p', kind: 'I', label: 'p' },
    { id: 'I:s', kind: 'I', label: 's' },
    
    // Middle layer - inferences
    { id: 'RA:ra1', kind: 'RA', label: 'ra1' },
    { id: 'I:q', kind: 'I', label: 'q' },
    { id: 'cmf5xyhn4001brmbywr3d41a9', kind: 'RA', label: 'ra2' },
    { id: 'RA:ra3', kind: 'RA', label: 'ra3' },
    
    // Top layer - conclusions
    { id: 'I:t', kind: 'I', label: 't' },
    { id: 'I:not_t', kind: 'I', label: '¬t' },
    
    // Conflicts
    { id: 'CA:ca1', kind: 'CA', label: 'Logical Conflict', schemeKey: 'logical' },
    { id: 'CA:ca2_bottom', kind: 'CA', label: 'CA', schemeKey: 'undercut' },
    { id: 'CA:ca2_top', kind: 'CA', label: 'CA', schemeKey: 'undercut' },
    
    // Preferences
    { id: 'PA:pa1', kind: 'PA', label: 'PA' },
    { id: 'PA:pa2', kind: 'PA', label: 'PA' },
  ],
  edges: [
    // ra1: p → q
    { id: 'e1', from: 'I:p', to: 'RA:ra1', role: 'premise' },
    { id: 'e2', from: 'RA:ra1', to: 'I:q', role: 'conclusion' },
    
    // ra2: q → t
    { id: 'e3', from: 'I:q', to: 'cmf5xyhn4001brmbywr3d41a9', role: 'premise' },
    { id: 'e4', from: 'cmf5xyhn4001brmbywr3d41a9', to: 'I:t', role: 'conclusion' },

    // ra3: s → ¬t
    { id: 'e5', from: 'I:s', to: 'RA:ra3', role: 'premise' },
    { id: 'e6', from: 'RA:ra3', to: 'I:not_t', role: 'conclusion' },
    
    // ca1: Logical conflict between t and ¬t
    { id: 'e7', from: 'I:t', to: 'CA:ca1', role: 'conflictingElement' },
    { id: 'e8', from: 'CA:ca1', to: 'I:not_t', role: 'conflictedElement' },
    
    // ca2 (bottom): s undercuts ra1
    { id: 'e9', from: 'I:p', to: 'CA:ca2_bottom', role: 'conflictingElement' },
    { id: 'e10', from: 'CA:ca2_bottom', to: 'RA:ra1', role: 'conflictedElement' },
    { id: 'e11', from: 'CA:ca2_bottom', to: 'I:s', role: 'conflictedElement' },
    
    // pa1: Prefers ra1 over (something)
    { id: 'e12', from: 'RA:ra1', to: 'PA:pa1', role: 'preferredElement' },
    { id: 'e13', from: 'PA:pa1', to: 'I:s', role: 'dispreferredElement' },
    
    // pa2: Prefers ra2 over ra3
    { id: 'e14', from: 'cmf5xyhn4001brmbywr3d41a9', to: 'PA:pa2', role: 'preferredElement' },
    { id: 'e15', from: 'PA:pa2', to: 'RA:ra3', role: 'dispreferredElement' },
  ],
};

/**
 * Figure 10: Beach Argument in AIF
 * Real-world example: Should I go to the beach?
 */
export const beachArgument: AifSubgraph = {
  nodes: [
    // Supporting arguments (for going)
    { id: 'I:i12', kind: 'I', label: '*i2* It is sunny today' },
    { id: 'I:i14', kind: 'I', label: '*i4* I get sunburn easily' },
    { id: 'I:i15', kind: 'I', label: "*i5* I'd like to have a tan" },
    { id: 'RA:ra_sunny', kind: 'RA', label: 'RA' },
    { id: 'RA:ra_tan', kind: 'RA', label: 'RA' },
    
    // Opposing arguments (against going)
    { id: 'I:i13', kind: 'I', label: '*i3* The surf is dangerous today' },
    { id: 'I:i16', kind: 'I', label: '*i6* I am a strong swimmer' },
    { id: 'I:i17', kind: 'I', label: '*i7* I run the risk of drowning' },
    { id: 'CA:ca_surf', kind: 'CA', label: 'CA', schemeKey: 'danger' },
    { id: 'CA:ca_sunburn', kind: 'CA', label: 'CA', schemeKey: 'health_risk' },
    { id: 'RA:ra_danger', kind: 'RA', label: 'RA' },
    
    // Conclusion
    { id: 'I:i11', kind: 'I', label: '*i1* I should go to the beach today' },
    { id: 'RA:ra_beach_decision', kind: 'RA', label: 'RA'  },
  ],
  edges: [
    // Supporting: sunny → go to beach
    { id: 'e1', from: 'I:i12', to: 'RA:ra_sunny', role: 'premise' },
    { id: 'e2', from: 'RA:ra_sunny', to: 'I:i11', role: 'conclusion' },
    
    // Supporting: want tan → go to beach
    { id: 'e3', from: 'I:i15', to: 'RA:ra_tan', role: 'premise' },
    { id: 'e4', from: 'RA:ra_tan', to: 'I:i11', role: 'conclusion' },
    
    // Opposing: surf dangerous → risk of drowning
    { id: 'e5', from: 'I:i13', to: 'RA:ra_danger', role: 'premise' },
    { id: 'e6', from: 'RA:ra_danger', to: 'I:i17', role: 'conclusion' },
    
    // Conflict: sunburn risk conflicts with wanting tan
    { id: 'e7', from: 'I:i14', to: 'CA:ca_sunburn', role: 'conflictingElement' },
    { id: 'e8', from: 'CA:ca_sunburn', to: 'RA:ra_tan', role: 'conflictedElement' },
    
    // Conflict: surf danger conflicts with beach decision
    { id: 'e9', from: 'I:i13', to: 'CA:ca_surf', role: 'conflictingElement' },
    { id: 'e10', from: 'CA:ca_surf', to: 'I:i11', role: 'conflictedElement' },
    
    // Rebuttal: strong swimmer reduces danger
    { id: 'e11', from: 'I:i16', to: 'CA:ca_surf', role: 'conflictingElement' },
  ],
};

// lib/arguments/aif-examples.ts
export const practicalCluster: AifSubgraph = {
  nodes: [
    { id:'I:goal',  kind:'I',  label:'Goal: reduce road fatalities' },
    { id:'I:value', kind:'I',  label:'Value: Safety is strongly held' },
    { id:'I:link',  kind:'I',  label:'Lowering promotes safety / achieves goal' },
    { id:'RA:ra_vpr', kind:'RA', label:'value_based_pr' },
    { id:'I:ought', kind:'I',  label:'We ought to lower to 25 mph' },

    { id:'I:action',   kind:'I', label:'Action: Lower to 25 mph' },
    { id:'I:neg_cons', kind:'I', label:'Congestion & delays increase' },
    { id:'I:cause_neg',kind:'I', label:'Lowering tends to cause these effects' },
    { id:'RA:ra_neg',  kind:'RA', label:'negative_consequences' },
    { id:'I:not_ought',kind:'I', label:'We should not lower to 25 mph' },

    { id:'CA:conflict', kind:'CA', label:'CA' }
  ],
  edges: [
    { id:'e1',  from:'I:goal',   to:'RA:ra_vpr', role:'premise' },
    { id:'e2',  from:'I:value',  to:'RA:ra_vpr', role:'premise' },
    { id:'e3',  from:'I:link',   to:'RA:ra_vpr', role:'premise' },
    { id:'e4',  from:'RA:ra_vpr',to:'I:ought',   role:'conclusion' },

    { id:'e5',  from:'I:action',   to:'RA:ra_neg', role:'premise' },
    { id:'e6',  from:'I:neg_cons', to:'RA:ra_neg', role:'premise' },
    { id:'e7',  from:'I:cause_neg',to:'RA:ra_neg', role:'premise' },
    { id:'e8',  from:'RA:ra_neg',  to:'I:not_ought', role:'conclusion' },

    { id:'e9',  from:'I:not_ought', to:'CA:conflict', role:'conflictingElement' },
    { id:'e10', from:'CA:conflict', to:'I:ought',     role:'conflictedElement' }
  ]
};

/**
 * Bike Lanes Example (from your original demo)
 * Shows how to map real arguments to AIF
 */
export const bikeLanesArgument: AifSubgraph = {
  nodes: [
    // Premises
    { id: 'I:p1', kind: 'I', label: 'Protected lanes reduce injuries by 40–50% in peer cities' },
    { id: 'I:p2', kind: 'I', label: 'Maple Ave carries heavy bike and scooter traffic from two schools' },
    { id: 'I:w1', kind: 'I', label: 'If an intervention reduces injuries and demand is high, the city ought to implement it' },
    
    // Argument
    { id: 'RA:a1', kind: 'RA', label: 'Policy argument from data' },
    
    // Conclusion
    { id: 'I:c', kind: 'I', label: 'The city should add protected bike lanes on Maple Ave' },
  ],
  edges: [
    { id: 'e1', from: 'I:p1', to: 'RA:a1', role: 'premise' },
    { id: 'e2', from: 'I:p2', to: 'RA:a1', role: 'premise' },
    { id: 'e3', from: 'I:w1', to: 'RA:a1', role: 'premise' },
    { id: 'e4', from: 'RA:a1', to: 'I:c', role: 'conclusion' },
  ],
};

/**
 * Empty graph for testing edge cases
 */
export const emptyGraph: AifSubgraph = {
  nodes: [],
  edges: [],
};

/**
 * Single node (atomic claim)
 */
export const singleNode: AifSubgraph = {
  nodes: [
    { id: 'I:single', kind: 'I', label: 'A single standalone claim' },
  ],
  edges: [],
};

/**
 * All examples combined for easy import
 */
export const AIF_EXAMPLES = {
  defeasibleModusPonens,
  expertOpinionPreference,
  complexExample,
  beachArgument,
  bikeLanesArgument,
  emptyGraph,
  singleNode,
  practicalCluster,
};



/**
 * Get example by name
 */
export function getAifExample(name: keyof typeof AIF_EXAMPLES): AifSubgraph {
  return AIF_EXAMPLES[name];
}

/**
 * List all available examples
 */
export function listAifExamples(): Array<{ name: string; description: string; nodeCount: number }> {
  return [
    {
      name: 'defeasibleModusPonens',
      description: 'Simple inference: p, p→q ⊢ q',
      nodeCount: defeasibleModusPonens.nodes.length,
    },
    {
      name: 'expertOpinionPreference',
      description: 'Expert opinion preferred over general knowledge',
      nodeCount: expertOpinionPreference.nodes.length,
    },
    {
      name: 'complexExample',
      description: 'Multiple inferences with conflicts and preferences',
      nodeCount: complexExample.nodes.length,
    },
    {
      name: 'beachArgument',
      description: 'Real-world decision: Should I go to the beach?',
      nodeCount: beachArgument.nodes.length,
    },
    {
      name: 'bikeLanesArgument',
      description: 'Policy argument for protected bike lanes',
      nodeCount: bikeLanesArgument.nodes.length,
    },
     {
      name: 'practicalCluster',
      description: 'Practical reasoning about lowering speed limits',
      nodeCount: practicalCluster.nodes.length,
    },
  ];
}
