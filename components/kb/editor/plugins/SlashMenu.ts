// kb/editor/plugins/SlashMenu.ts

const items = [
  { label:'/claim',     type:'claim',     icon:'◦' },
  { label:'/argument',  type:'argument',  icon:'⟂' },
  { label:'/sheet',     type:'sheet',     icon:'▣' },
  { label:'/transport', type:'transport', icon:'⇄' },
  { label:'/evidence',  type:'evidence_list', icon:'⌖' },
  { label:'/cq',        type:'cq_tracker', icon:'?' },
];

onSlash((pick) => {
  // persist a new KbBlock row, then replace current Lexical paragraph with a stub “embed”
  createBlock({ type: pick.type, dataJson:{} }).then(insertDecoratorNode);
});

