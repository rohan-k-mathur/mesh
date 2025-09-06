import { presetsForCQ } from './cqPresets';

export function suggestionForCQ(schemeKey: string, cqKey?: string) {
  const presets = presetsForCQ(schemeKey, cqKey);
  if (!presets.length) return null;

  // pick first preset’s primary option as default suggestion
  const primary = presets[0].options[0];
  return {
    type: primary.type as 'rebut'|'undercut',
    scope: primary.targetScope ?? 'conclusion',
    template: primary.template,
    shape: presets[0].shape,
    options: presets.flatMap(p => p.options),
  };
}
