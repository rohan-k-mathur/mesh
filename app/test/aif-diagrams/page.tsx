'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AifDiagramTestPage from '@/components/map/AifDiagramTestPage'
import AifDiagramViewInteractive from '@/components/map/AifDiagramViewInteractive'
import AifDiagramTestPageEnhanced from '@/components/map/Aifdiagramtestpageenhanced'

export default function DiagramTestPage() {
  return (
    <div className='flex flex-col gap-8 p-8'>
            {/* <AifDiagramTestPage /> */}
<AifDiagramTestPageEnhanced/>
    </div>
  )
}
