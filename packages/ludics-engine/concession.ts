// packages/ludics-engine/concession.ts
export async function concede(params:{
    dialogueId: string,
    concedingParticipantId: string,
    proposition: { text: string, locusFromCS: LocusPath },
    anchorLocus: LocusPath
  }){/*: Promise<{acts:[string,string], faxMapId:string, csUpdated:true}>*/}{
    // (+, anchor, {anchor.1}, "P") then (-, anchor.1, [], "ACK")
    // CS add for receiver; erase negation; FaxMap store->dialogue, dialogue->opponent store
  }
  