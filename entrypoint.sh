#!/bin/sh
cat <<EOF > /usr/share/nginx/html/config.js
window.APP_CONFIG = {
  API_BASE_URL: "${API_BASE_URL}"
};

const keycloakConfig = {
  clientId: "logpulse",
  realm: "logpulse",
  authServerUrl: "${KEYCLOAK_URL:-https://logpulse.dev:8443/realms/logpulse}",
  redirectUri: window.location.origin + "/dashboard.html",
  postLogoutRedirectUri: window.location.origin + "/index.html",
  tokenEndpoint: "${KEYCLOAK_URL:-https://logpulse.dev:8443/realms/logpulse}/protocol/openid-connect/token",
  authEndpoint: "${KEYCLOAK_URL:-https://logpulse.dev:8443/realms/logpulse}/protocol/openid-connect/auth",
  logoutEndpoint: "${KEYCLOAK_URL:-https://logpulse.dev:8443/realms/logpulse}/protocol/openid-connect/logout"
};

window.KEYCLOAK_CONFIG = keycloakConfig;
EOF

exec "$@"