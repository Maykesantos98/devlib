// Devlib console API — exposes `window.devlib.*` for power users.
// Kept as a separate ambient module so `App.tsx` stays clean.

export interface DevlibConsoleApi {
  help(): string;
  shuffle(): string;
  reset(): string;
  matrix(): string;
  count(): string;
  filter(category: string): string;
  search(term: string): string;
  go(sectionId: string): string;
  about(): string;
}

declare global {
  interface Window {
    devlib?: DevlibConsoleApi;
  }
}

export {};
