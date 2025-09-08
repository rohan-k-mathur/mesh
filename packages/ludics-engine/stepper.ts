// packages/ludics-engine/stepper.ts
export async function stepInteraction(opts:{
    dialogueId: string,
    posDesignId: string,
    negDesignId: string,
    startPosActId?: string,
    maxPairs?: number
  })/*: Promise<{ status: TravelStatus; pairs: TracePair[]; endedAtDaimonForParticipantId?:string }>*/{
    // 1) load designs + current positive act
    // 2) loop: find dual negative at same locus in other design
    // 3) if missing => DIVERGENT; if positive is DAIMON => CONVERGENT
    // 4) log to LudicInteractionTrace
  }
  