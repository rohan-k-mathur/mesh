// kb/blocks/registry.ts
export type BlockContext = { resolveUrn: (u:string)=>Promise<any>; now: Date };

export type BlockHandlers = {
  // React component for Viewer (& Editor preview)
  View: React.FC<{block: KbBlock, ctx: BlockContext}>,
  // Editor “node” provider (Lexical or null for non-text)
  Editor?: { Node: any, setup: (editor:LexicalEditor)=>void },
  // Export serializers
  toHTML: (block:KbBlock, ctx:BlockContext)=>Promise<string>,
  toMD:   (block:KbBlock, ctx:BlockContext)=>Promise<string>,
  // Pin/freeze the block (resolve live to pinned)
  pin:    (block:KbBlock, ctx:BlockContext)=>Promise<KbBlock>,
};

export const registry: Record<KbBlockType, BlockHandlers> = { /* … */ };
