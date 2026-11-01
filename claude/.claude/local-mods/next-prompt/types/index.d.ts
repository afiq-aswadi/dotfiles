export type Suggestion = string | null

declare module 'claude-code' {
  interface PluginState {
    'next-prompt': { suggestion: Suggestion }
  }
}
