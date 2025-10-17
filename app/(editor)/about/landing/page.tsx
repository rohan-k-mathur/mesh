//app/(editor)/about/details/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronRight, 
  Terminal, 
  MessageSquare,
  Lightbulb,
  Vote,
  FileCheck,
  Network,
  GitBranch,
  List,
  Swords,
  Map,
  BookOpen,
  Share2,
  Sparkles,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import '../about-styles.css'

export default function AboutPage() {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())

  const toggleStep = (step: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(step)) {
        next.delete(step)
      } else {
        next.add(step)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-rose-50/30 to-slate-50 text-slate-900">
      <TechnicalGrid />
      <FloatingOrbs />
      
      <div className="relative z-10">
        <HeroSectionAlternate />
        <ProblemSection />
        <JourneyOverview />
        <JourneySteps expandedSteps={expandedSteps} toggleStep={toggleStep} />
        <StatusSection />
        <AlphaSection />
        <FoundationsSection />
        <AccessSection />
        <ClosingSection />
      </div>
    </div>
  )
}

/* ======================== TECHNICAL GRID ======================== */
function TechnicalGrid() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-rose-50/40 to-purple-50/40" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  )
}

/* ======================== FLOATING ORBS ======================== */
function FloatingOrbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-24 left-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ 
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)'
        }}
        animate={{ 
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ 
          background: 'radial-gradient(circle, rgba(244,114,182,0.4) 0%, transparent 70%)'
        }}
        animate={{ 
          x: [0, -25, 0],
          y: [0, -15, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ 
          duration: 18, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 h-72 w-72 rounded-full opacity-15 blur-3xl"
        style={{ 
          background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)'
        }}
        animate={{ 
          x: [0, 20, 0],
          y: [0, -10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      />
    </div>
  )
}

/* ======================== HERO SECTION ======================== */
// function HeroSection() {
//   return (
//     <section className="border-b border-indigo-100/50 bg-white/40 about-backdrop-blur">
//       <div className="mx-auto max-w-5xl px-8 py-20">
        
//         <motion.div 
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="about-badge about-badge--primary mb-6 about-shimmer"
//         >
//           <Terminal className="h-3.5 w-3.5" />
//           <span>v1.0.0-alpha</span>
//           <Sparkles className="h-3 w-3" />
//         </motion.div>

//         <motion.h1 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.1 }}
//           className="mb-6 text-4xl font-medium leading-tight tracking-tight text-slate-900"
//         >
//           Digital Agora: Computational Infrastructure for Structured Deliberation
//         </motion.h1>

//         <motion.p 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//           className="mb-8 text-lg leading-relaxed text-slate-700"
//         >
//           A formal implementation of collective reasoning where propositions, claims, arguments, and dialogue moves are first-class data objects with explicit semantics.
//         </motion.p>

//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.3 }}
//           className="mb-8 space-y-4 text-base leading-relaxed text-slate-700"
//         >
//           <p>
//             Contemporary discourse platforms lack primitives for epistemic work. There exists no shared representation for "here is a claim, here is the evidence that grounds it, here is the argument that attacks it, here is the inference that the attack targets."
//           </p>
//           <p>
//             Digital Agora provides these primitives. Every assertion has a stable identifier. Every connection between assertions has a type and a target scope. Evidence links carry precise locators. Arguments decompose into directed acyclic graphs, making reasoning structure machine-readable and individually addressable.
//           </p>
//         </motion.div>

//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.4 }}
//           className="about-code-block mb-8"
//         >
//           <div className="mb-2 font-medium text-slate-900">Implementation basis:</div>
//           <div className="leading-relaxed text-slate-600">
//             <span className="about-code-keyword">Toulmin</span> (1958), 
//             <span className="about-code-keyword"> Dung</span> (1995), 
//             <span className="about-code-keyword"> Walton et al.</span> (2008), 
//             <span className="about-code-keyword"> Prakken & Sartor</span> (1997), 
//             <span className="about-code-keyword"> Girard</span> (2001)
//           </div>
//           <div className="mt-2 text-slate-500">These map directly to data models and API contracts.</div>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.5 }}
//         >
//           <Link href="#access">
//             <button className="about-btn about-btn--gradient group">
//               <span className="relative flex items-center gap-2">
//                 Request Alpha Access
//                 <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
//               </span>
//             </button>
//           </Link>
//         </motion.div>
//       </div>
//     </section>
//   )
// }

function HeroSectionAlternate() {
  return (
    <section className="border-b border-indigo-100/50 bg-white/40 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-20">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="about-badge about-badge--primary mb-6 about-shimmer"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>v1.0.0-alpha</span>
          <Sparkles className="h-3 w-3" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-4xl font-medium leading-tight tracking-tight text-slate-900"
        >
          Digital Agora: Rebuilding Public Reasoning Infrastructure
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-lg leading-relaxed text-slate-700"
        >
          Civic platform for deliberation where evidence, arguments, and decisions are structured, verifiable, and durable—not ephemeral engagement metrics.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 space-y-4 text-base leading-relaxed text-slate-700"
        >
          <p>
            <strong>The problem is infrastructural.</strong> Contemporary platforms were built for virality, not validity. There is no shared representation for evidential grounding, no protocol for burden of proof, no way to track how decisions emerged from alternatives. Institutions default to opaque processes because the internet provides no tools for transparent, auditable reasoning.
          </p>
          <p>
            <strong>Digital Agora is infrastructure for public intelligence.</strong> Rationality becomes objective through language-governed interaction—where claims receive challenges, evidence gets tested, and arguments must survive critical questioning. The platform operationalizes this: every assertion has a stable identifier, every attack targets a specific node, every dialogue move follows protocol. Structure is machine-readable; semantic labels derive from formal calculus; reasoning chains compose across contexts.
          </p>
          <p>
            <strong>Meaning emerges through interaction, not static labels.</strong> A claim's status (accepted/rejected/undecided) computes from its position in the argument graph and the attacks it faces. Schemes auto-generate critical questions. Dialogue games enforce termination: when no legal moves remain, deliberation concludes with an auditable trace. This is not opinion aggregation—it is structured knowledge work that produces reusable, verifiable artifacts.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="about-alert about-alert--info mb-8"
        >
          <strong>Urgency:</strong> Without infrastructure coupling evidence, dialogue, and publication, institutions cannot meet demands for transparency and public trust continues to erode. Complex problems—climate policy, public health, tech governance—require collective intelligence that current platforms actively undermine. We propose minimally normative, auditable commons for reasons.
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="about-glass-card-code   w-full rounded-xl panel-edge postcard mb-8 "
        >
            <div className='bg-transparent'>
          <div className="mb-3 flex items-center gap-2 ">
            <Zap className="h-4 w-4 text-indigo-600 items-center" />
            <div className="font-semibold text-center items-center  text-[14px] text-slate-900">What this enables:</div>
          </div>
          <div className="space-y-2.5 text-sm leading-relaxed text-slate-600">
            <div className="flex items-start gap-2">
              <span className="about-code-keyword ">⤞</span>
              <span><strong className="text-slate-700">Evidential precision:</strong> Link claims to source material with character-level specificity; track provenance across reasoning chains</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="about-code-keyword ">⤞</span>
              <span><strong className="text-slate-700">Protocol enforcement:</strong> WHY moves require GROUNDS; unanswered challenges remain visible; no silent consensus</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="about-code-keyword">⤞</span>
              <span><strong className="text-slate-700">Systematic stress-testing:</strong> Schemes generate critical questions automatically; attacks target specific premises or inferences</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="about-code-keyword">⤞</span>
              <span><strong className="text-slate-700">Reusable reasoning:</strong> Import argument structures; map claims between contexts; fork and revise institutional analyses</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="about-code-keyword ">⤞</span>
              <span><strong className="text-slate-700">Durable publication:</strong> Knowledge base exports to AIF, JSON-LD; stable citations for institutional integration</span>
            </div>
          </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap items-center gap-4"
        >
          <Link href="#access">
            <button className="about-btn about-btn--gradient group">
              <span className="relative flex items-center gap-2">
                Request Alpha Access
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </Link>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-medium">Active deployment: 20 deliberations • 500 claims • 200 arguments</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}



/* ======================== PROBLEM SECTION ======================== */
function ProblemSection() {
  return (
    <section className="border-b border-rose-100/50 about-panel-textured">
      <div className="mx-auto max-w-5xl px-8 py-16">
        
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-2xl font-medium text-slate-900"
        >
          I. Requirements for Institutional Deliberation
        </motion.h2>

        <div className="space-y-8">
          <Requirement 
            title="Reusability"
            description="When institution A evaluates policy option X using evidence Y and reasoning Z, institution B should be able to inspect the complete chain—evidence, claims, inferences, attacks, resolutions—and either adopt it, fork it, or challenge specific components."
            current="B starts from scratch or reads A's PDF and attempts manual reconstruction."
            delay={0.1}
          />
          
          <Requirement 
            title="Granular Addressability"
            description="When a claim is challenged, the challenge should target the weakest component: a specific premise, a specific inference, a specific evidentiary interpretation."
            current="Challenges target entire arguments, forcing wholesale rejection or acceptance rather than surgical refinement."
            delay={0.2}
          />
          
          <Requirement 
            title="Provenance Tracking"
            description="When a conclusion changes (new evidence emerges, an inference is refuted, a premise is undermined), the system should surface which downstream conclusions are affected."
            current="No dependency tracking. Impact analysis requires manual review of possibly-related documents."
            delay={0.3}
          />
          
          <Requirement 
            title="Protocol Enforcement"
            description='When participant A claims X, and participant B asks "what is your evidence for X," there should be a protocol that requires A to either supply evidence, concede the point, or mark it as unresolved.'
            current="Questions can be ignored without record, creating the appearance of uncontested claims."
            delay={0.4}
          />
          
          <Requirement 
            title="Machine Readability"
            description="When a deliberation concludes, the result should be machine-readable: a graph of claims, evidence links, argument structure, attack relations, and semantic labels that external systems can import, analyze, or visualize."
            current="Output is human-readable prose with implicit structure that resists tooling."
            delay={0.5}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="about-alert about-alert--info mt-8"
        >
          These requirements emerge from observed failures in policy analysis, systematic review, technical specification, and scientific deliberation. Digital Agora is an attempt to meet them.
        </motion.div>
      </div>
    </section>
  )
}

function Requirement({ title, description, current, delay }: { 
  title: string
  description: string
  current: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="about-requirement"
    >
      <h3 className="mb-3 font-mono text-sm font-medium text-slate-900">
        {title}
      </h3>
      <p className="mb-3 text-sm leading-relaxed text-slate-700">{description}</p>
      <div className="about-requirement__current">
        <span className="font-medium">Current practice: </span>
        {current}
      </div>
    </motion.div>
  )
}

/* ======================== JOURNEY OVERVIEW ======================== */
function JourneyOverview() {
  return (
    <section className="border-b border-purple-100/50 bg-gradient-to-br from-white/50 to-purple-50/30 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-16">
        
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-2xl font-medium text-slate-900"
        >
          II. User Journey Through the System
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 text-sm text-slate-700"
        >
          The following walkthrough shows how a user moves through the platform, from joining a discussion to publishing knowledge artifacts. Each step corresponds to specific data models and workflows.
        </motion.p>

        {/* Flow Diagram */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="about-flow rounded-xl p-8"
        >
          <div className="flex items-center justify-between text-xs">
            <FlowStep icon={MessageSquare} label="Discussion" />
            <FlowArrow />
            <FlowStep icon={Lightbulb} label="Proposition" />
            <FlowArrow />
            <FlowStep icon={Vote} label="Workshop" />
            <FlowArrow />
            <FlowStep icon={FileCheck} label="Claim" />
            <FlowArrow />
            <FlowStep icon={Network} label="Graph" />
            <FlowArrow />
            <FlowStep icon={GitBranch} label="Argument" />
          </div>
          <div className="mt-6 flex items-center justify-between text-xs">
            <FlowStep icon={List} label="Arguments List" />
            <FlowArrow />
            <FlowStep icon={Swords} label="Dialogue" />
            <FlowArrow />
            <FlowStep icon={Map} label="Debate Sheet" />
            <FlowArrow />
            <FlowStep icon={BookOpen} label="KB Page" />
            <FlowArrow />
            <FlowStep icon={Share2} label="Network" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FlowStep({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="about-flow-step">
      <div className="about-flow-step__icon">
        <Icon className="h-5 w-5" />
      </div>
      <div className="about-flow-step__label">{label}</div>
    </div>
  )
}

function FlowArrow() {
  return <ChevronRight className="h-4 w-4 flex-shrink-0 text-indigo-300" />
}

/* ======================== JOURNEY STEPS ======================== */
function JourneySteps({ expandedSteps, toggleStep }: {
  expandedSteps: Set<number>
  toggleStep: (step: number) => void
}) {
  const steps = [
    {
      number: 1,
      title: "Join Discussion → Deliberation",
      icon: MessageSquare,
      summary: "Discussions are lightweight forums that can upgrade to structured deliberations when formalization is needed.",
      content: <Step1Content />
    },
    {
      number: 2,
      title: "Compose Proposition",
      icon: Lightbulb,
      summary: "Create a lightweight assertion for community workshopping. Anyone can propose; only validated ideas become claims.",
      content: <Step2Content />
    },
    {
      number: 3,
      title: "Workshop (Vote, Endorse, Reply)",
      icon: Vote,
      summary: "Community signals quality through votes, endorsements, and refinement replies. Social validation filters signal before formalization.",
      content: <Step3Content />
    },
    {
      number: 4,
      title: "Promote to Claim",
      icon: FileCheck,
      summary: "Convert validated proposition to canonical claim with stable identifier. Claims are immutable atoms in the argument graph.",
      content: <Step4Content />
    },
    {
      number: 5,
      title: "View Claims (Minimap / CEG Minimap)",
      icon: Network,
      summary: "Navigate claim graph, see connections (supports/rebuts/undercuts). Claims don't exist in isolation—the graph structure makes argument visible.",
      content: <Step5Content />
    },
    {
      number: 6,
      title: "Compose Argument (Scheme Composer)",
      icon: GitBranch,
      summary: "Create argument linking premises to conclusion, optionally using a scheme template. Schemes surface critical questions automatically.",
      content: <Step6Content />
    },
    {
      number: 7,
      title: "View Arguments (AIF Arguments List)",
      icon: List,
      summary: "Browse arguments, see their structure and status. Arguments are the units of discourse; list view enables comparison and selection.",
      content: <Step7Content />
    },
    {
      number: 8,
      title: "Dialogue Move (Attack Menu: Rebut / Undercut)",
      icon: Swords,
      summary: "Respond to an argument using formal dialogue move. Protocol enforcement ensures every challenge is explicit and tracked.",
      content: <Step8Content />
    },
    {
      number: 9,
      title: "Navigate Debate Sheet",
      icon: Map,
      summary: "Two-level map: nodes (arguments) with expandable diagrams, edges (attack relations). Visual overview of entire deliberation structure.",
      content: <Step9Content />
    },
    {
      number: 10,
      title: "Publish to Knowledge Base",
      icon: BookOpen,
      summary: "Create KB page with live or pinned blocks referencing deliberation artifacts. Terminal publication—stable, citable, composable.",
      content: <Step10Content />
    },
    {
      number: 11,
      title: "Explore Network (Plexus / Cross-Room Graph)",
      icon: Share2,
      summary: "Navigate cross-room connections, trace argument imports, explore functors. The platform is a graph-of-graphs.",
      content: <Step11Content />
    }
  ]

  return (
    <section className="border-b border-slate-200/50 bg-white/20 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <div className="space-y-5">
          {steps.map((step, idx) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={step.title}
              icon={step.icon}
              summary={step.summary}
              isExpanded={expandedSteps.has(step.number)}
              onToggle={() => toggleStep(step.number)}
              content={step.content}
              delay={idx * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StepCard({ 
  number, 
  title, 
  icon: Icon,
  summary, 
  isExpanded, 
  onToggle, 
  content,
  delay
}: {
  number: number
  title: string
  icon: any
  summary: string
  isExpanded: boolean
  onToggle: () => void
  content: React.ReactNode
  delay: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="about-step-card"
    >
      <div className="about-step-card__header ">
        <div className="flex items-start gap-4">
          <div className="about-step-card__icon-wrapper">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="mb-.5 font-mono tracking-wide text-sm text-indigo-600/70">Step {number}</div>
            <h3 className="text-md tracking-wide font-medium text-slate-900">
              {title}
            </h3>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="about-btn flex-shrink-0"
          style={{ padding: '0.375rem 0.75rem', fontSize: '12px' }}
        >
            <div className='flex items-center tracking-wide align-center gap-1'>
          {isExpanded ? 'Collapse' : 'Expand'}
          <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>
<hr className='mx-12 my-2 border-slate-200/50'/>
      <div className="px-12  pb-4">
        <p className="text-[14px] tracking-wide text-slate-700">{summary}</p>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="about-step-card__content">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ======================== STEP CONTENT COMPONENTS ======================== */

function Step1Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Discussions are lightweight forums with live chat integration. When structure is needed, they can upgrade to deliberations via a single action.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Lower barrier to entry. Start informal (discussion), formalize when needed (deliberation). Preserve conversation history during transition.</p>
      </div>

      <div>
        <h4 className="mb-3 font-mono text-xs tracking-wide font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">Discussion</span> &#123;</div>
          <div className="pl-4 about-code-property">slug, title, description, visibility</div>
          <div className="pl-4 about-code-property">upgradedToDeliberation: Deliberation?</div>
          <div className="pl-4 about-code-property">messages: DiscussionMessage[]</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">DiscussionDeliberation</span> &#123;</div>
          <div className="pl-4 about-code-property">discussionId, deliberationId (unique pair)</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <p><code className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">UpgradeButton</code> → creates Deliberation, sets bidirectional link, preserves message history</p>
      </div>
    </div>
  )
}

function Step2Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Create a lightweight assertion that can be voted on, endorsed, replied to, and tagged before promotion to canonical claim.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Distinguish ideation from formalization. Anyone can float an idea. Structured reasoning begins when community validates it.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">Proposition</span> &#123;</div>
          <div className="pl-4 about-code-property">deliberationId, authorId, text</div>
          <div className="pl-4 about-code-property">status: DRAFT | PUBLISHED | CLAIMED | ARCHIVED</div>
          <div className="pl-4 about-code-property">promotedClaimId: Claim? (set on promotion)</div>
          <div className="pl-4 about-code-property">voteUpCount, voteDownCount, endorseCount</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <p><code className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">PropositionComposer</code> → creates Proposition with status: PUBLISHED</p>
      </div>
    </div>
  )
}

function Step3Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Community members vote (±1), endorse (commit support), or reply (refine/challenge) to propositions.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Social validation filters quality before formalization. Votes signal overall quality, endorsements indicate commitment, replies enable refinement.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">PropositionVote</span> &#123;</div>
          <div className="pl-4 about-code-property">propositionId, userId, value: -1 | 0 | 1</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">PropositionEndorsement</span> &#123;</div>
          <div className="pl-4 about-code-property">propositionId, userId (unique pair)</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">PropositionReply</span> &#123;</div>
          <div className="pl-4 about-code-property">propositionId, parentId, authorId, text</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Actions</h4>
        <ul className="list-inside list-disc space-y-1 pl-4 text-xs">
          <li><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">VoteButton(±1)</code> → upserts PropositionVote</li>
          <li><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">EndorseButton</code> → creates PropositionEndorsement</li>
          <li><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">ReplyComposer</code> → creates PropositionReply</li>
        </ul>
      </div>
    </div>
  )
}

function Step4Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Convert validated proposition to canonical claim with stable content-addressed identifier (moid). Claims become immutable graph atoms.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Formalization checkpoint. Claims persist across deliberations, can be cited, and serve as nodes in the argument graph.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">Claim</span> &#123;</div>
          <div className="pl-4 about-code-property">text, createdById, moid (content hash)</div>
          <div className="pl-4 about-code-property">deliberationId, canonicalClaimId</div>
          <div className="pl-4 about-code-property">sourceProposition: Proposition? (back-link)</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <div className="text-xs space-y-1">
          <p><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">PromoteButton</code> →</p>
          <ul className="list-inside list-disc pl-4">
            <li>creates Claim(moid: hash(text))</li>
            <li>sets Proposition.promotedClaimId</li>
            <li>changes Proposition.status to CLAIMED</li>
            <li>creates Urn for stable reference</li>
          </ul>
        </div>
      </div>

      <div className="about-alert about-alert--info">
        <strong>Technical note:</strong> Content-addressing (moid = hash(text)) ensures duplicate claims map to same entity. Uniqueness constraint prevents redundancy.
      </div>
    </div>
  )
}

function Step5Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Navigate graph of claims with typed edges (supports, rebuts, undercuts, undermines). View semantic labels (IN/OUT/UNDEC) computed from graph structure.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Claims don't exist in isolation. The graph makes argument structure visible and machine-readable.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">ClaimEdge</span> &#123;</div>
          <div className="pl-4 about-code-property">fromClaimId, toClaimId</div>
          <div className="pl-4 about-code-property">type: supports | rebuts</div>
          <div className="pl-4 about-code-property">attackType: SUPPORTS | REBUTS | UNDERCUTS | UNDERMINES</div>
          <div className="pl-4 about-code-property">targetScope: premise | inference | conclusion</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">ClaimLabel</span> &#123;</div>
          <div className="pl-4 about-code-property">claimId, semantics: grounded | preferred | hybrid</div>
          <div className="pl-4 about-code-property">label: IN | OUT | UNDEC</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <p><code className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">ClaimMinimap</code> → renders force-directed graph, color-coded by label (green=IN, red=OUT, gray=UNDEC)</p>
      </div>

      <div className="about-alert about-alert--info">
        <strong>Technical note:</strong> Labels are computed, not asserted. Follows Dung's extension semantics for abstract argumentation frameworks.
      </div>
    </div>
  )
}

function Step6Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Create argument linking premise claims to conclusion claim. Optionally use scheme template (expert opinion, analogy, consequence) which auto-generates critical questions.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Make reasoning explicit. Schemes surface known vulnerabilities automatically rather than relying on participants to identify weaknesses.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">Argument</span> &#123;</div>
          <div className="pl-4 about-code-property">deliberationId, authorId, text</div>
          <div className="pl-4 about-code-property">conclusionClaimId, schemeId?: ArgumentScheme</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">ArgumentPremise</span> &#123;</div>
          <div className="pl-4 about-code-property">argumentId, claimId (join table)</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">ArgumentScheme</span> &#123;</div>
          <div className="pl-4 about-code-property">key, name, description, cq: JSON</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <div className="text-xs space-y-1">
          <p><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">SchemeComposer</code> →</p>
          <ul className="list-inside list-disc pl-4">
            <li>Select scheme (or none)</li>
            <li>Fill premise slots (select claims)</li>
            <li>State conclusion</li>
            <li>System creates Argument + ArgumentPremise[] + ArgumentDiagram</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Step7Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Browse all arguments in deliberation. See conclusion text, premise count, approval count, unresolved CQ count, and attack/support indicators.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Arguments are the units of discourse. List view enables comparison, filtering, and selection for engagement.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">Argument</span> &#123;</div>
          <div className="pl-4 about-code-property">approvals: ArgumentApproval[]</div>
          <div className="pl-4 about-code-property">edges: ArgumentEdge[] (incoming/outgoing)</div>
          <div className="pl-4 about-code-property">cqStatuses: CQStatus[] (unresolved count)</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <p><code className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">ArgumentsList</code> → displays cards with metadata, supports filtering (by scheme, approval count, CQ status), sorting, and expansion</p>
      </div>
    </div>
  )
}

function Step8Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Respond to argument using formal dialogue move. Attack types: rebut (challenge conclusion), undercut (attack warrant/inference), undermine (challenge premise).</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Protocol enforcement. Every challenge is explicit, typed, and tracked. No challenges can be ignored without record.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">DialogueMove</span> &#123;</div>
          <div className="pl-4 about-code-property">type: WHY | GROUNDS | CONCEDE | RETRACT</div>
          <div className="pl-4 about-code-property">replyTarget: claim | argument | premise | inference</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">ArgumentEdge</span> &#123;</div>
          <div className="pl-4 about-code-property">type: rebut | undercut | support</div>
          <div className="pl-4 about-code-property">targetInferenceId?: Inference (for warrant attacks)</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <div className="text-xs space-y-1">
          <p><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">AttackMenu</code> →</p>
          <ul className="list-inside list-disc pl-4">
            <li>Select attack type (rebut | undercut | undermine)</li>
            <li>If undercut: select specific inference from ArgumentDiagram</li>
            <li>Provide grounds (create supporting Argument)</li>
            <li>System creates DialogueMove + ArgumentEdge</li>
          </ul>
        </div>
      </div>

      <div className="about-alert about-alert--info">
        <strong>Technical note:</strong> <code className="rounded bg-white/70 px-1.5 py-0.5 border border-blue-100">targetInferenceId</code> enables warrant attacks. You challenge the inferential step, not just the conclusion.
      </div>
    </div>
  )
}

function Step9Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Two-level map: nodes (argument cards) expandable to show internal ArgumentDiagram, edges (typed attack relations). Color-coded by semantic labels.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Visual overview of entire deliberation structure. Navigate between arguments, see connections, drill down to inference details.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">DebateSheet</span> &#123;</div>
          <div className="pl-4 about-code-property">nodes: DebateNode[] (1:1 with ArgumentDiagram)</div>
          <div className="pl-4 about-code-property">edges: DebateEdge[] (supports | rebuts | undercuts)</div>
          <div className="pl-4 about-code-property">acceptance: SheetAcceptance (computed labels)</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <div className="text-xs space-y-1">
          <p><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">DebateSheet</code> viewer →</p>
          <ul className="list-inside list-disc pl-4">
            <li>Click node → expands to show ArgumentDiagram (Statement/Inference graph)</li>
            <li>Click edge → shows rationale and evidence</li>
            <li>Nodes color-coded by semantic label (green=IN, red=OUT, gray=UNDEC)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Step10Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Create knowledge base page with typed blocks: text, images, claim references, argument embeds, debate sheets, theory works. Blocks can be live (update with source) or pinned (frozen snapshot).</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Terminal publication. Knowledge artifacts are stable, citable, and composable. Institutions can cite KB pages; communities can fork and revise.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">KbPage</span> &#123;</div>
          <div className="pl-4 about-code-property">spaceId, slug, title, visibility</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">KbBlock</span> &#123;</div>
          <div className="pl-4 about-code-property">type: text | claim | argument | sheet | theory_work</div>
          <div className="pl-4 about-code-property">live: boolean (updates vs. pinned snapshot)</div>
          <div className="pl-4 about-code-property">dataJson, citations</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <div className="text-xs space-y-1">
          <p><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">KbPageComposer</code> →</p>
          <ul className="list-inside list-disc pl-4">
            <li>Create page with metadata</li>
            <li>Add blocks (text, claim references, argument embeds)</li>
            <li>Toggle live vs. pinned per block</li>
            <li>Publish; optionally create KbSnapshot</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Step11Content() {
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">What</h4>
        <p>Navigate network of rooms (deliberation contexts) with edges representing argument imports, functor mappings, and cross-references. Trace provenance across the graph-of-graphs.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Why</h4>
        <p>Work travels and composes across rooms. Institutions can reuse reasoning chains, fork deliberations, and track impact.</p>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">Schema</h4>
        <div className="about-glass-card-code   w-full rounded-xl ">
          <div><span className="about-code-keyword">ArgumentImport</span> &#123;</div>
          <div className="pl-4 about-code-property">fromDeliberationId, toDeliberationId</div>
          <div className="pl-4 about-code-property">kind: import | restatement | quote</div>
          <div className="pl-4 about-code-property">fingerprint: string (SHA1 hash for idempotency)</div>
          <div>&#125;</div>
          <div className="mt-2"><span className="about-code-keyword">RoomFunctor</span> &#123;</div>
          <div className="pl-4 about-code-property">claimMapJson: JSON (fromClaimId → toClaimId)</div>
          <div>&#125;</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-medium text-indigo-700">User Action</h4>
        <div className="text-xs space-y-1">
          <p><code className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-100">Plexus</code> viewer →</p>
          <ul className="list-inside list-disc pl-4">
            <li>Visualizes rooms as nodes, imports/functors as edges</li>
            <li>Click node → enters room</li>
            <li>Click edge → shows import fingerprint and provenance metadata</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ======================== STATUS, ALPHA, FOUNDATIONS, ACCESS, CLOSING ======================== */

function StatusSection() {
  return (
    <section className="border-b border-slate-200/50 bg-gradient-to-br from-white/40 to-slate-50/40 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-2xl font-medium text-slate-900"
        >
          III. Implementation Status
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 space-y-3 text-sm text-slate-700"
        >
          <p><strong className="text-slate-900">Deployment:</strong> Closed alpha with ~20 active deliberations, ~500 claims, ~200 arguments, ~50 theory works.</p>
          <p><strong className="text-slate-900">Data model:</strong> Stable. Prisma schema, PostgreSQL backend.</p>
          <p><strong className="text-slate-900">API:</strong> Versioned contracts. OpenAPI 3.0 specification available.</p>
          <p><strong className="text-slate-900">Frontend:</strong> Implements all core workflows—proposition workshop, claim graph, argument composer, scheme selector, dialogue interface, debate sheet, KB editor.</p>
          <p><strong className="text-slate-900">Export formats:</strong> AIF 2.0, AIF+, JSON-LD, PDF.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="about-alert about-alert--warning"
        >
          <h3 className="mb-3 font-mono text-xs font-medium">Known Limitations</h3>
          <ul className="space-y-1.5">
            <li>• Semantic labeling: grounded semantics only</li>
            <li>• Cross-room import UI incomplete (API functional)</li>
            <li>• Ludics proof-game interface: prototype quality</li>
            <li>• No mobile-optimized UI</li>
          </ul>
        </motion.div>
      </div>
    </section>
  )
}

function AlphaSection() {
  return (
    <section className="border-b border-purple-100/50 bg-gradient-to-br from-purple-50/30 to-pink-50/30 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-2xl font-medium text-slate-900"
        >
          IV. Alpha Participation Requirements
        </motion.h2>
        <div className="mb-8 space-y-6">
          {[
            { num: 1, title: "Commitment to actual use", desc: "Run at least one real deliberation over 4-6 weeks." },
            { num: 2, title: "Methodological feedback", desc: "Identify where the data model helps and where it hinders." },
            { num: 3, title: "Evidence contribution", desc: "Populate with real evidence links, not placeholders." },
            { num: 4, title: "Dialogue participation", desc: "Use WHY/GROUNDS moves, answer CQs or defer explicitly." },
            { num: 5, title: "Publication", desc: "Produce at least one KB page with mixed live/pinned blocks." }
          ].map((req, idx) => (
            <motion.div 
              key={req.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex gap-4 group"
            >
              <div className="about-number-badge">
                {req.num}
              </div>
              <div>
                <h3 className="mb-1 font-mono text-sm font-medium text-slate-900">
                  {req.title}
                </h3>
                <p className="text-sm text-slate-700">{req.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// function FoundationsSection() {
//   return (
//     <section className="border-b border-indigo-100/50  about-panel-textured">
//       <div className="mx-auto max-w-5xl px-8 py-16">
//         <motion.h2 
//           initial={{ opacity: 0, x: -20 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5 }}
//           className="mb-8 text-2xl font-medium text-slate-900"
//         >
//           V. Theoretical Foundations
//         </motion.h2>
//         <motion.p 
//           initial={{ opacity: 0, y: 10 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//           className="mb-6 text-sm  text-slate-700"
//         >
//           Each maps to specific data structures and operational semantics.
//         </motion.p>
//         <div className="space-y-5 font-mono text-xs">
//           {[
//             { cite: "Toulmin (1958)", impl: "Claim + ArgumentDiagram" },
//             { cite: "Dung (1995)", impl: "ClaimLabel over ClaimEdge graphs" },
//             { cite: "Walton et al. (2008)", impl: "ArgumentScheme + CQStatus" },
//             { cite: "Prakken & Sartor (1997)", impl: "DialogueMove + ProofMode" },
//             { cite: "Girard (2001)", impl: "LudicDesign + LudicTrace" }
//           ].map((f, idx) => (
//             <motion.div 
//               key={f.cite}
//               initial={{ opacity: 0, x: -20 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5, delay: idx * 0.1 }}
//               className="postcard p-4 bg-white/30 w-fit rounded-lg panel-edge"
//             >
//               <div className="mb-1 font-medium text-indigo-700">
//                 {f.cite}
//               </div>
//               <div className="text-slate-700">→ {f.impl}</div>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

function FoundationsSection() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const foundationCategories = [
    {
      id: 'core',
      title: 'Core Argumentation Theory',
      description: 'Foundational models for argument structure, schemes, and validity',
      color: 'indigo',
      sources: [
        { 
          cite: "Toulmin (1958)", 
          title: "The Uses of Argument",
          impl: "Claim + ArgumentDiagram",
          detail: "Warrant-based argument structure with data, claim, backing, rebuttal"
        },
        { 
          cite: "Walton et al. (2008)", 
          title: "Argumentation Schemes",
          impl: "ArgumentScheme + CQStatus + CriticalQuestion",
          detail: "Scheme templates with critical questions for systematic evaluation"
        },
        { 
          cite: "Macagno et al.", 
          title: "Argumentation Schemes: History, Classifications, and Computational Applications",
          impl: "SchemeLibrary + SchemeClassification",
          detail: "Comprehensive taxonomy of reasoning patterns and fallacy detection"
        },
        { 
          cite: "Lumer", 
          title: "A Theory of Philosophical Arguments",
          impl: "ArgumentValidity + EpistemicJustification",
          detail: "Epistemological approach to argument adequacy and validation"
        },
        { 
          cite: "Lumer", 
          title: "Structure and Function of Argumentations",
          impl: "ArgumentFunction + ValidityCriteria",
          detail: "Epistemological criteria for determining argument validity and adequacy"
        },
      ]
    },
    {
      id: 'formal',
      title: 'Abstract Argumentation & Semantics',
      description: 'Formal frameworks for argument acceptance, attack relations, and extensions',
      color: 'purple',
      sources: [
        { 
          cite: "Dung (1995)", 
          title: "On the Acceptability of Arguments",
          impl: "ClaimLabel + ArgumentExtension + AF.grounded/preferred/stable",
          detail: "Abstract argumentation frameworks with extension-based semantics"
        },
        { 
          cite: "Simari & Loui", 
          title: "A Mathematical Treatment of Defeasible Reasoning",
          impl: "DefeasibleRule + ArgumentStrength + Specificity",
          detail: "Formal defeasible logic with specificity-based conflict resolution"
        },
        { 
          cite: "Ambler", 
          title: "A Categorical Approach to the Semantics of Argumentation",
          impl: "ArgumentCategory + ConfidenceMeasure + EvidentialClosure",
          detail: "Category theory foundations: arguments as morphisms in enriched categories"
        },
        { 
          cite: "Caminada", 
          title: "Argumentation Semantics as Formal Discussion",
          impl: "DiscussionSemantics + LabelingFunction",
          detail: "Formal discussion framework mapping dialogue to extension semantics"
        },
        { 
          cite: "Bernreiter & Maly", 
          title: "Combining Voting and Abstract Argumentation",
          impl: "VotingAggregation + ArgumentRanking",
          detail: "Integration of social choice theory with argumentation frameworks"
        },
        { 
          cite: "Matt", 
          title: "A Game-Theoretic Perspective on Argument Strength",
          impl: "ArgumentGame + StrengthMeasure",
          detail: "Game-theoretic analysis of argument strength in abstract argumentation"
        },
      ]
    },
    {
      id: 'dialogue',
      title: 'Dialogue Systems & Protocol',
      description: 'Formal dialogue games, move types, protocol enforcement, and termination',
      color: 'rose',
      sources: [
        { 
          cite: "Prakken & Sartor (1997)", 
          title: "Argument-Based Extended Logic Programming",
          impl: "DialogueMove + ProofMode + Commitment",
          detail: "Formal dialogue protocols with speech acts and commitment management"
        },
        { 
          cite: "Prakken", 
          title: "On Dialogue Systems with Speech Acts, Arguments, and Counterarguments",
          impl: "SpeechAct + MoveType + DialogueProtocol",
          detail: "Dialogue system combining speech acts with argumentation moves"
        },
        { 
          cite: "McBurney & Parsons", 
          title: "A Denotational Semantics for Deliberation Dialogues",
          impl: "DeliberationProtocol + DialogueSemantics",
          detail: "Formal semantics for multi-party deliberation with shared goals"
        },
        { 
          cite: "McBurney & Parsons", 
          title: "The Eightfold Way of Deliberation Dialogue",
          impl: "DeliberationPhase + DialogueType",
          detail: "Eight-phase model for structured deliberation: open, inform, propose, consider, revise, recommend, confirm, close"
        },
        { 
          cite: "Bodenstaff et al.", 
          title: "On Formalising Dialogue Systems in Event Calculus",
          impl: "EventCalculus + DialogueState",
          detail: "Event calculus formalization of dialogue dynamics and state transitions"
        },
        { 
          cite: "Thang et al.", 
          title: "Towards Argument-based Foundation for Sceptical and Credulous Dialogue Games",
          impl: "DialogueGame + ProofStandard",
          detail: "Dialogue games with varying burden of proof standards"
        },
      ]
    },
    {
      id: 'ludics',
      title: 'Ludics & Interactive Proof',
      description: 'Proof-as-interaction, designs, normalization, and convergence/divergence',
      color: 'amber',
      sources: [
        { 
          cite: "Girard (2001)", 
          title: "Locus Solum: From the Rules of Logic to the Logic of Rules",
          impl: "LudicDesign + LudicTrace + Normalization",
          detail: "Interactive logic: designs as proof strategies, normalization as dialogue"
        },
        { 
          cite: "Lecomte", 
          title: "Ludics, Dialogue and Inferentialism",
          impl: "InferentialSemantics + DesignInteraction",
          detail: "Inferentialist semantics grounded in ludics interaction"
        },
        { 
          cite: "Fouqueré & Quatrini", 
          title: "Inferences and Dialogues in Ludics",
          impl: "LudicInference + DialogueConvergence",
          detail: "Inference rules derived from interactive dialogue convergence"
        },
        { 
          cite: "Fouqueré", 
          title: "Argumentation and Inference: A Unified Approach",
          impl: "ArgumentInference + UnifiedFramework",
          detail: "Unification of argumentation theory with ludics inference model"
        },
        { 
          cite: "Boritchev", 
          title: "Dialogue Modeling in a Dynamic Framework",
          impl: "DynamicDialogue + ContextUpdate",
          detail: "Dynamic framework for dialogue with context-sensitive update"
        },
      ]
    },
    {
      id: 'discourse',
      title: 'Discourse Structure & Relations',
      description: 'Textual entailment, discourse relations, enthymemes, and relevance',
      color: 'emerald',
      sources: [
        { 
          cite: "Rocci", 
          title: "Diagramming the Enthymematic Structure of Counterarguments",
          impl: "EnthymemeReconstruction + ImplicitPremise",
          detail: "Methods for surfacing implicit premises in counterarguments"
        },
        { 
          cite: "Catta", 
          title: "Inferential Semantics as Argumentative Dialogues",
          impl: "InferentialRole + DialogicalSemantics",
          detail: "Meaning as inferential role expressed through dialogue"
        },
        { 
          cite: "Catta", 
          title: "Dialogical Argumentation and Textual Entailment",
          impl: "TextualEntailment + DialogicalInference",
          detail: "Mapping textual entailment to dialogical argumentation moves"
        },
        { 
          cite: "Lascarides & Asher", 
          title: "Discourse Relations and Defeasible Knowledge",
          impl: "DiscourseRelation + DefeasibleConnective",
          detail: "Defeasible logic for discourse coherence and relation interpretation"
        },
        { 
          cite: "Schaden", 
          title: "Relevance and Utility in an Argumentative Framework",
          impl: "RelevanceFilter + TopicAccommodation",
          detail: "Computational relevance for discourse topic management"
        },
        { 
          cite: "Kocurek", 
          title: "The Dynamics of Argumentative Discourse",
          impl: "DiscourseUpdate + ArgumentativeDynamic",
          detail: "Dynamic semantics for evolving argumentative contexts"
        },
      ]
    },
    {
      id: 'interchange',
      title: 'Argument Interchange Format (AIF)',
      description: 'Standardized representation, import/export, and interoperability',
      color: 'cyan',
      sources: [
        { 
          cite: "Reed et al.", 
          title: "The Argument Interchange Format (AIF) Specification",
          impl: "AIFNode + AIFEdge + I/S/L-nodes",
          detail: "Standard ontology for argument representation and exchange"
        },
        { 
          cite: "Reed et al.", 
          title: "AIF+: Dialogue in the Argument Interchange Format",
          impl: "AIFDialogue + TransitionScheme",
          detail: "Extended AIF with dialogue move representation"
        },
        { 
          cite: "Bex et al.", 
          title: "On Logical Specifications of the Argument Interchange Format",
          impl: "AIFLogic + FormalSemantics",
          detail: "Logical foundations and formal semantics for AIF"
        },
        { 
          cite: "Bentahar et al.", 
          title: "A Taxonomy of Argumentation Models",
          impl: "ModelTaxonomy + RepresentationMapping",
          detail: "Comprehensive taxonomy for comparing argumentation models"
        },
      ]
    },
    {
      id: 'visualization',
      title: 'Argument Mapping & Visualization',
      description: 'Graphical representation, debate structure, and knowledge organization',
      color: 'violet',
      sources: [
        { 
          cite: "Harrell", 
          title: "Representing the Structure of a Debate",
          impl: "DebateSheet + ArgumentGraph",
          detail: "Visual representation schemes for complex debate structure"
        },
        { 
          cite: "Murungi", 
          title: "Applying Argument Mapping to Facilitate Theory Building",
          impl: "TheoryMap + ConceptualStructure",
          detail: "Argument mapping as tool for theoretical knowledge construction"
        },
      ]
    },
    {
      id: 'platform',
      title: 'Platform Design & Epistemology',
      description: 'Online deliberation, collective intelligence, and epistemic health',
      color: 'pink',
      sources: [
        { 
          cite: "De Liddo et al.", 
          title: "Understanding Failures and Potentials of Argumentation Tools",
          impl: "ToolEvaluation + UserRequirements",
          detail: "Empirical analysis of argumentation tool adoption and effectiveness"
        },
        { 
          cite: "Amico-Korby", 
          title: "Building Epistemically Healthier Platforms",
          impl: "EpistemicHealth + PlatformDesign",
          detail: "Design principles for platforms that improve collective reasoning"
        },
        { 
          cite: "Amico-Korby", 
          title: "Do It Yourself Content and the Wisdom of the Crowds",
          impl: "CollectiveIntelligence + ContentCuration",
          detail: "User-generated content and collective knowledge aggregation"
        },
        { 
          cite: "Negarestani", 
          title: "Intelligence and Spirit",
          impl: "CollectiveRationality + SapientPlatform",
          detail: "Philosophical foundations for collective intelligence platforms"
        },
      ]
    },
  ]

  return (
    <section className="border-b border-indigo-100/50 about-panel-textured">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-2xl font-medium text-slate-900"
        >
          V. Theoretical Foundations
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 text-sm text-slate-700"
        >
          Digital Agora synthesizes formal theories from argumentation, logic, dialogue systems, and platform design. 
          Each theoretical contribution maps to specific data models, API contracts, or UI affordances.
        </motion.p>

        <div className="space-y-6">
          {foundationCategories.map((category, catIdx) => (
            <FoundationCategory
              key={category.id}
              category={category}
              isExpanded={expandedCategory === category.id}
              onToggle={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
              delay={catIdx * 0.1}
            />
          ))}
        </div>

        {/* <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="about-alert about-alert--info mt-10"
        >
          <strong>Implementation Note:</strong> This is not a theoretical project that cites these works aspirationally. 
          Every source listed has directly influenced the data model, API design, or user interface. 
          The platform is an <em>implementation</em> of these theories, not a commentary on them.
        </motion.div> */}
      </div>
    </section>
  )
}

function FoundationCategory({ 
  category, 
  isExpanded, 
  onToggle, 
  delay 
}: { 
  category: any
  isExpanded: boolean
  onToggle: () => void
  delay: number
}) {
  const colorClasses = {
    indigo: {
      bg: 'from-indigo-50/30 to-indigo-100/30',
      border: 'border-indigo-200/60',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100/80 text-indigo-700 border-indigo-200/60',
      icon: 'text-indigo-500',
    },
    purple: {
      bg: 'from-purple-50/30 to-purple-100/30',
      border: 'border-purple-200/60',
      text: 'text-purple-700',
      badge: 'bg-purple-100/80 text-purple-700 border-purple-200/60',
      icon: 'text-purple-500',
    },
    rose: {
      bg: 'from-rose-50/30 to-rose-100/30',
      border: 'border-rose-200/60',
      text: 'text-rose-700',
      badge: 'bg-rose-100/80 text-rose-700 border-rose-200/60',
      icon: 'text-rose-500',
    },
    amber: {
      bg: 'from-amber-50/30 to-amber-100/30',
      border: 'border-amber-200/60',
      text: 'text-amber-700',
      badge: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
      icon: 'text-amber-500',
    },
    emerald: {
      bg: 'from-emerald-50/30 to-emerald-100/30',
      border: 'border-emerald-200/60',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
      icon: 'text-emerald-500',
    },
    cyan: {
      bg: 'from-cyan-50/30 to-cyan-100/30',
      border: 'border-cyan-200/60',
      text: 'text-cyan-700',
      badge: 'bg-cyan-100/80 text-cyan-700 border-cyan-200/60',
      icon: 'text-cyan-500',
    },
    violet: {
      bg: 'from-violet-50/30 to-violet-100/30',
      border: 'border-violet-200/60',
      text: 'text-violet-700',
      badge: 'bg-violet-100/80 text-violet-700 border-violet-200/60',
      icon: 'text-violet-500',
    },
    pink: {
      bg: 'from-pink-50/30 to-pink-100/30',
      border: 'border-pink-200/60',
      text: 'text-pink-700',
      badge: 'bg-pink-100/80 text-pink-700 border-pink-200/60',
      icon: 'text-pink-500',
    },
  }

  const colors = colorClasses[category.color as keyof typeof colorClasses]

  return (
  <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`p-4 w-full rounded-lg panel-edge border ${colors.border} overflow-hidden transition-colors duration-500 ${
        isExpanded ? `bg-gradient-to-br ${colors.bg}` : 'bg-transparent'
      }`}
    >
      <button
        onClick={onToggle}
        className=" p-4 w-full bg-transparent  rounded-lg panel-edge "
      >
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.badge}`}>
                {category.sources.length} sources
              </span>
              <h3 className={`text-base font-semibold ${colors.text}`}>
                {category.title}
              </h3>
            </div>
            <p className="text-sm  text-slate-600">
              {category.description}
            </p>
          </div>
          <ChevronDown 
            className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            } ${colors.icon}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`border-t ${colors.border}  rounded-xl p-4 space-y-4`}>
              {category.sources.map((source: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="postcard p-4 bg-white/30 w-full rounded-lg panel-edge"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="font-mono text-xs font-medium text-slate-900">
                      {source.cite}
                    </div>
                  </div>
                  {source.title && (
                    <div className="mb-2 text-sm italic text-slate-700">
                      {source.title}
                    </div>
                  )}
                  <div className="mb-2 font-mono text-xs text-slate-600">
                    → <span className={colors.text}>{source.impl}</span>
                  </div>
                  {source.detail && (
                    <div className="text-xs leading-relaxed text-slate-600 border-l-2 pl-3" style={{ borderColor: `rgb(${colors.icon})` }}>
                      {source.detail}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AccessSection() {
  return (
    <section id="access" className="border-b border-rose-100/50 bg-gradient-to-br from-rose-50/30 to-orange-50/20 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-2xl font-medium text-slate-900"
        >
          VI. Request Access
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 space-y-4 text-sm text-slate-700"
        >
          <p>Submit request with institutional affiliation, proposed deliberation topic, expected timeline, team size.</p>
          <p>Response within 5 business days. Current limit: 10 concurrent deliberations per deployment.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button className="about-btn about-btn--gradient group about-pulse-glow">
            <span className="relative flex items-center gap-2">
              Request Alpha Access
              <Zap className="h-4 w-4" />
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}

function ClosingSection() {
  return (
    <section className="bg-gradient-to-b from-white/40 to-slate-100/60 about-backdrop-blur">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="about-glass-elevated p-10 text-center"
        >
          <p className="text-sm leading-relaxed text-slate-700">
            This is not marketing material. It is technical specification.
          </p>
          <div className="about-divider my-6" />
          <p className="text-sm leading-relaxed text-slate-700">
            The system described here exists and is deployable. The question for potential participants is not "would this be nice to have" but "does this solve a problem we currently face, and are we willing to adopt its constraints to gain its benefits."
          </p>
        </motion.div>
      </div>
    </section>
  )
}