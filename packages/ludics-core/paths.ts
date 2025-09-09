export const splitPath = (p: string) => p.split('.').filter(Boolean);
export const joinPath  = (parts: string[]) => parts.join('.');
export const childPath = (parent: string, child: string) =>
  parent ? `${parent}.${child}` : child;

export const isAncestor = (ancestor: string, path: string) =>
  path === ancestor || path.startsWith(`${ancestor}.`);
