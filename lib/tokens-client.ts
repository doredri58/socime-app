// Fire-and-forget signal that the user just spent tokens, so the TopBar
// counter live-refreshes. Safe to call from any client component.
export function notifyTokensSpent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tokens-updated'))
  }
}
