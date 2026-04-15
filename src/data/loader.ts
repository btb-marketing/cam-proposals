import type { Proposal } from '../types/proposal';

const modules = import.meta.glob('./proposals/*.json', { eager: true });

export function loadProposal(slug: string): Proposal | null {
  const key = `./proposals/${slug}.json`;
  const mod = modules[key] as { default: Proposal } | undefined;
  if (!mod) return null;
  return mod.default;
}

export function getAllSlugs(): string[] {
  return Object.keys(modules).map((k) =>
    k.replace('./proposals/', '').replace('.json', '')
  );
}
