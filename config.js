window.APP_CONFIG = {
    // Base URL for the backend API used by dashboard/script.js
    API_BASE_URL: 'http://localhost:9000'
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
  