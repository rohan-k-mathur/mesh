// app/onboarding/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronRight,
  Check,
  X,
  Info,
  Play,
  Image as ImageIcon,
  ExternalLink,
  Database
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ONBOARDING_STEPS, type OnboardingStep } from './_data/steps-content'
import dynamic from 'next/dynamic'

// Lazy-load demo components
const DiscussionViewDemo = dynamic(() => import('./_demos/discussion-view-demo'), {
  loading: () => <div className="text-center text-slate-500 py-12">Loading demo...</div>,
  ssr: false
})

// Server component with DB access - must use SSR
const DiscussionViewDemoWithDB = dynamic(() => import('./_demos/discussion-view-demo'), {
  loading: () => <div className="text-center text-slate-500 py-12">Loading demo...</div>,
  ssr: true // REQUIRED: Server component with Prisma must render on server
})

/* ======================== MAIN PAGE ======================== */

export default function OnboardingPage() {
  const { currentStep, scrollToStep } = useScrollProgress(ONBOARDING_STEPS.length)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<number>>(new Set())

  const toggleSchema = (stepNumber: number) => {
    setExpandedSchemas(prev => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
      } else {
        next.add(stepNumber)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Progress Tracker (Desktop: Sidebar, Mobile: Top Bar) */}
      <ProgressTracker
        steps={ONBOARDING_STEPS}
        currentStep={currentStep}
        onStepClick={scrollToStep}
      />

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen">
        <div className="mx-auto max-w-screen px-10 py-0">
          {/* Hero Section */}
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 pt-12 "
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-700 mb-6">
              <Play className="h-3.5 w-3.5" />
              <span>Interactive Onboarding</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Complete User Journey
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Follow this 11-step walkthrough to understand how Digital Agora transforms 
              casual discussion into structured knowledge. Each step demonstrates a core 
              capability with screenshots, interactive demos, and schema documentation.
            </p>

            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                <span>~15 minutes</span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>11 steps</span>
              </div>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>5 interactive demos</span>
              </div>
            </div>
          </motion.header>

          {/* Step Sections */}
          <div className="space-y-24 lg:space-y-32">
            {ONBOARDING_STEPS.map((step) => (
              <StepSection
                key={step.id}
                step={step}
                isSchemaExpanded={expandedSchemas.has(step.number)}
                onToggleSchema={() => toggleSchema(step.number)}
              />
            ))}
          </div>

          {/* CTA Footer */}
          <motion.footer 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center py-16 lg:py-24 mt-24 border-t border-slate-200"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ready to Experience This Firsthand?
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Join the alpha program and gain access to the complete platform. 
              Work with your team to transform discussions into structured knowledge.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/about#access">
                <button className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2">
                  Request Alpha Access
                  <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/about/details">
                <button className="px-6 py-3 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium border border-slate-200 flex items-center gap-2">
                  View Technical Specification
                  <ExternalLink className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </motion.footer>
        </div>
      </main>
    </div>
  )
}

/* ======================== PROGRESS TRACKER ======================== */

interface ProgressTrackerProps {
  steps: OnboardingStep[]
  currentStep: number
  onStepClick: (stepNumber: number) => void
}

function ProgressTracker({ steps, currentStep, onStepClick }: ProgressTrackerProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  return (
    <>
      {/* Desktop: Sticky Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white/80 backdrop-blur-sm overflow-y-auto z-40">
        <div className="p-6">
          <div className="mb-8">
            <Link href="/" className="text-xl font-bold text-slate-900">
              Digital Agora
            </Link>
            <p className="text-sm text-slate-500 mt-1">Onboarding</p>
          </div>

          <nav className="space-y-1">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <button
                  key={step.number}
                  onClick={() => onStepClick(step.number)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 group
                    ${isActive ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}
                    ${isCompleted ? 'text-slate-500' : 'text-slate-700'}
                  `}
                >
                  <span className={`
                    flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 transition-colors
                    ${isActive && 'bg-slate-900 text-white'}
                    ${isCompleted && 'bg-green-500 text-white'}
                    ${!isActive && !isCompleted && 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}
                  `}>
                    {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 mb-0.5">Step {step.number}</div>
                    <div className="text-sm truncate">{step.shortTitle}</div>
                  </div>

                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="text-xs text-slate-500 mb-2">Progress</div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {currentStep} of {steps.length} steps
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile: Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <button 
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="flex w-full items-center justify-between p-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
              {currentStep}
            </span>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900">
                Step {currentStep} of {steps.length}
              </div>
              <div className="text-xs text-slate-500">
                {steps[currentStep - 1]?.shortTitle}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isMobileExpanded && 'rotate-180'}`} />
        </button>
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100">
          <div 
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Expandable Menu */}
        <AnimatePresence>
          {isMobileExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-200 bg-white"
            >
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {steps.map((step) => {
                  const isActive = currentStep === step.number
                  const isCompleted = currentStep > step.number
                  
                  return (
                    <button
                      key={step.number}
                      onClick={() => {
                        onStepClick(step.number)
                        setIsMobileExpanded(false)
                      }}
                      className={`
                        w-full text-left p-3 rounded-lg flex items-center gap-3
                        ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}
                      `}
                    >
                      <span className={`
                        flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                        ${isActive && 'bg-slate-900 text-white'}
                        ${isCompleted && 'bg-green-500 text-white'}
                        ${!isActive && !isCompleted && 'bg-slate-200 text-slate-600'}
                      `}>
                        {isCompleted ? <Check className="h-3 w-3" /> : step.number}
                      </span>
                      <span className="text-sm text-slate-700">{step.shortTitle}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

/* ======================== STEP SECTION ======================== */

interface StepSectionProps {
  step: OnboardingStep
  isSchemaExpanded: boolean
  onToggleSchema: () => void
}

function StepSection({ step, isSchemaExpanded, onToggleSchema }: StepSectionProps) {
  const Icon = step.icon

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      data-step-id={step.number}
      className="scroll-mt-24 lg:scroll-mt-8"
    >
      {/* Step Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg flex-shrink-0">
          {step.number}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-500">
              Step {step.number} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
            {step.title}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            {step.summary}
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 lg:space-y-12">
        {/* What / Why / User Action */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ContentBlock title="What" content={step.content.what} />
          <ContentBlock title="Why" content={step.content.why} />
          <ContentBlock title="User Action" content={step.content.userAction} />
        </div>

        {/* Screenshot (if exists) */}
        {step.screenshot.src && (
          <div className="border border-slate-200 rounded-xl p-6 lg:p-8 bg-white">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-slate-500" />
              Interface Preview
            </h3>
            <AnnotatedScreenshot
              src={step.screenshot.src}
              alt={step.screenshot.alt}
              annotations={step.screenshot.annotations}
            />
          </div>
        )}

        {/* Interactive Demo (if exists) */}
        {step.demo && (
          <div className="border-2 border-blue-200 rounded-xl p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  Interactive Demo
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Try this feature with mock data
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Info className="h-3 w-3" />
                Simplified demo
              </span>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-blue-100">
              {step.demo === 'discussion-upgrade' &&    <DiscussionViewDemo />}
              {step.demo !== 'discussion-upgrade' && (
                <div className="text-center text-slate-500 py-12">
                  Demo component: <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{step.demo}</code>
                  <div className="text-xs mt-2">To be implemented in Phase 4</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schema Reference */}
        <SchemaReference
          schema={step.schema}
          isExpanded={isSchemaExpanded}
          onToggle={onToggleSchema}
        />

        {/* Transition */}
        {step.transition && (
          <div className="border-l-4 border-indigo-500 pl-6 py-4 bg-indigo-50/50 rounded-r-lg">
            <div className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              Next Step
            </div>
            <p className="text-slate-700 leading-relaxed">
              {step.transition}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  )
}

/* ======================== CONTENT BLOCK ======================== */

interface ContentBlockProps {
  title: string
  content: string
}

function ContentBlock({ title, content }: ContentBlockProps) {
  return (
    <div className="border border-slate-200 rounded-lg p-6 bg-white hover:shadow-sm transition-shadow">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <p className="text-slate-700 leading-relaxed text-sm">
        {content}
      </p>
    </div>
  )
}

/* ======================== ANNOTATED SCREENSHOT ======================== */

interface AnnotatedScreenshotProps {
  src: string
  alt: string
  annotations: Array<{
    id: string
    x: number
    y: number
    label: string
    title: string
    description: string
  }>
}

function AnnotatedScreenshot({ src, alt, annotations }: AnnotatedScreenshotProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeAnnotation = annotations.find(a => a.id === activeId)

  return (
    <div className="space-y-4">
      <div className="relative inline-block w-full">
        {/* Placeholder for screenshot - replace with actual Image component when screenshots are ready */}
        <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border border-slate-300 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="text-sm font-medium mb-1">Screenshot: {src}</div>
            <div className="text-xs">{alt}</div>
            <div className="text-xs mt-2 text-slate-400">To be added in Phase 2</div>
          </div>
        </div>
        
        {/* Annotation Hotspots */}
        {annotations.map((ann) => (
          <button
            key={ann.id}
            onClick={() => setActiveId(activeId === ann.id ? null : ann.id)}
            className={`
              absolute flex h-8 w-8 items-center justify-center rounded-full
              border-2 border-white shadow-lg transition-all hover:scale-110
              font-bold text-xs z-10
              ${activeId === ann.id 
                ? 'bg-slate-900 text-white scale-110 ring-4 ring-slate-900/20' 
                : 'bg-red-500 text-white hover:bg-red-600'
              }
            `}
            style={{
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            aria-label={`Annotation ${ann.label}: ${ann.title}`}
          >
            {ann.label}
          </button>
        ))}
      </div>

      {/* Annotation Details Panel */}
      <AnimatePresence>
        {activeAnnotation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0">
                {activeAnnotation.label}
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 mb-1">
                  {activeAnnotation.title}
                </h4>
                <p className="text-sm text-slate-600">
                  {activeAnnotation.description}
                </p>
              </div>
              <button
                onClick={() => setActiveId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotation Legend */}
      <div className="text-xs text-slate-500 flex items-center gap-2">
        <Info className="h-3.5 w-3.5" />
        <span>Click numbered markers to learn more about each feature</span>
      </div>
    </div>
  )
}

/* ======================== SCHEMA REFERENCE ======================== */

interface SchemaReferenceProps {
  schema: {
    model: string
    fields: Array<{
      name: string
      type: string
      description: string
      optional?: boolean
      defaultValue?: string
    }>
    relations?: Array<{
      name: string
      target: string
      cardinality: string
      description: string
    }>
  }
  isExpanded: boolean
  onToggle: () => void
}

function SchemaReference({ schema, isExpanded, onToggle }: SchemaReferenceProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-slate-500" />
          <span className="font-mono text-sm font-medium text-slate-900">
            model {schema.model}
          </span>
          <span className="text-xs text-slate-500">
            ({schema.fields.length} fields{schema.relations ? `, ${schema.relations.length} relations` : ''})
          </span>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded && 'rotate-180'}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              {/* Fields */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Fields
                </h4>
                <div className="space-y-2">
                  {schema.fields.map((field) => (
                    <div key={field.name} className="flex items-start gap-3 text-sm font-mono bg-white p-3 rounded border border-slate-200">
                      <span className="text-blue-600 font-medium">{field.name}</span>
                      <span className="text-slate-400">{field.optional ? '?' : ''}</span>
                      <span className="text-purple-600">{field.type}</span>
                      {field.defaultValue && (
                        <span className="text-slate-500">@default({field.defaultValue})</span>
                      )}
                      <span className="text-slate-600 text-xs font-sans ml-auto">
                        {field.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relations */}
              {schema.relations && schema.relations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Relations
                  </h4>
                  <div className="space-y-2">
                    {schema.relations.map((rel) => (
                      <div key={rel.name} className="flex items-center gap-3 text-sm bg-white p-3 rounded border border-slate-200">
                        <span className="font-mono text-green-600 font-medium">{rel.name}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono text-blue-600">{rel.target}</span>
                        <span className="text-xs text-slate-500 font-mono">({rel.cardinality})</span>
                        <span className="text-slate-600 text-xs ml-auto">
                          {rel.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link to Full Schema */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <a 
                  href="/docs/schema" 
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  View complete Prisma schema <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ======================== SCROLL PROGRESS HOOK ======================== */

function useScrollProgress(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    const handleScroll = () => {
      const stepSections = document.querySelectorAll('[data-step-id]')
      
      // Find which step is currently most visible in viewport
      let mostVisibleStep = 1
      let maxVisibility = 0

      stepSections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        const stepId = parseInt(section.getAttribute('data-step-id') || '1')
        
        // Calculate how much of the section is visible
        const viewportHeight = window.innerHeight
        const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
        const visibility = visibleHeight / viewportHeight

        if (visibility > maxVisibility) {
          maxVisibility = visibility
          mostVisibleStep = stepId
        }
      })

      setCurrentStep(mostVisibleStep)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToStep = (stepNumber: number) => {
    const section = document.querySelector(`[data-step-id="${stepNumber}"]`)
    if (section) {
      const yOffset = -100 // Offset for fixed headers
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return { currentStep, scrollToStep }
}