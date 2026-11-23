// The only place Boxity URLs come from (docs.bloxity.io "Environments: prod, stage, local").
// The same build runs on prod, stage and local; the platform tells the page which one it is in
// (the SDK's environment(), or the window.BLOXITY_ENV it injects before our code runs). Never
// detect the environment from location, a build flag or a URL, and never write a Boxity host
// anywhere else in the code, build config or .env files: use boxityEnv().
// Prod is only the fallback for "nothing was told" (a page Boxity does not serve, a blocked SDK).
const PROD = {
  env: 'prod',
  apiUrl: 'https://api.bloxity.io',
  playUrl: 'https://play.bloxity.io',
  portalUrl: 'https://bloxity.io',
  staticUrl: 'https://static.bloxity.io',
}

export function boxityEnv() {
  try {
    const fromSdk = window.Legion?.SDK?.environment?.()
    if (fromSdk?.apiUrl) return { ...PROD, ...fromSdk }
    const told = window.BLOXITY_ENV
    if (told?.apiUrl) return { ...PROD, ...told }
  } catch {
    // Older SDK builds have no environment().
  }
  return PROD
}
