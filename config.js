window.APP_CONFIG = {
    // Base URL for the backend API used by dashboard/script.js
    API_BASE_URL: 'http://localhost:8081'
};

// keycloak config
const keycloakConfig = {
    clientId: "logpulse",
    realm: "logpulse",
    authServerUrl: "http://localhost:8080/realms/logpulse", // keycloak issuer endpoint
    redirectUri: window.location.origin + "/dashboard.html",
    postLogoutRedirectUri: window.location.origin + "/index.html",
    tokenEndpoint: "http://localhost:8080/realms/logpulse/protocol/openid-connect/token",
    authEndpoint: "http://localhost:8080/realms/logpulse/protocol/openid-connect/auth",
    logoutEndpoint: "http://localhost:8080/realms/logpulse/protocol/openid-connect/logout",
    apiBaseUrl: "http://localhost:8081", // your gateway base
  };
// Expose Keycloak config for SPA auth module
window.KEYCLOAK_CONFIG = keycloakConfig;
  