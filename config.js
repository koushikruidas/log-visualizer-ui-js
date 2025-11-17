window.APP_CONFIG = {
    // Base URL for the backend API used by dashboard/script.js
    API_BASE_URL: 'http://localhost:9000',

    // Public paths list (pages or prefixes that should NOT trigger auth redirects)
    // - exact matches: '/index.html', '/how-to-use.html'
    // - prefix matches: use trailing slash '/static/' to match any path under /static/
    PUBLIC_PATHS: [
      '/',                // allow root
      '/index.html',
      '/how-to-use.html', // Integration Guide - allow public
      '/about.html',
      '/favicon.ico',
      '/static/'          // prefix match: any file under /static/
  ]
};

// keycloak config
const keycloakConfig = {
    clientId: "logpulse",
    realm: "logpulse",
    authServerUrl: "https://logpulse.dev:8443/realms/logpulse", // keycloak issuer endpoint
    redirectUri: window.location.origin + "/dashboard.html",
    postLogoutRedirectUri: window.location.origin + "/index.html",
    tokenEndpoint: "https://logpulse.dev:8443/realms/logpulse/protocol/openid-connect/token",
    authEndpoint: "https://logpulse.dev:8443/realms/logpulse/protocol/openid-connect/auth",
    logoutEndpoint: "https://logpulse.dev:8443/realms/logpulse/protocol/openid-connect/logout",
  };
// Expose Keycloak config for SPA auth module
window.KEYCLOAK_CONFIG = keycloakConfig;
  

/*
 * isPublicPath(pathname?)
 * Returns true when the given pathname (or current location path if omitted)
 * should be treated as public (i.e. DO NOT call Auth.init() / force login).
 *
 * Matching rules:
 *  - exact match against entries in APP_CONFIG.PUBLIC_PATHS
 *  - if an entry ends with '/', it is treated as a prefix match (folder)
 *
 * Examples:
 *  - '/how-to-use.html'  => true (exact)
 *  - '/static/img/logo.png' => true (matches '/static/' prefix)
 */

window.isPublicPath = function(pathname) {
  let p = pathname || window.location.pathname || '/';
  if (!p.startsWith('/')) p = '/' + p;
  // Normalize trailing slash: '/foo/' => '/foo' (but keep root '/')
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  const publicPaths = (window.APP_CONFIG && window.APP_CONFIG.PUBLIC_PATHS) || [];
  for (let i = 0; i < publicPaths.length; i++) {
      const entry = publicPaths[i];
      if (!entry) continue;
      if (entry.endsWith('/')) {
          // prefix match: strip trailing slash when comparing
          const prefix = entry.slice(0, -1);
          if (p === prefix || p.startsWith(prefix + '/')) {
              return true;
          }
      } else {
          if (entry === p) return true;
      }
  }
  return false;
};