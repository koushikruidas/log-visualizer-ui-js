#!/bin/sh

# Write config.js with API URL from env var
cat <<EOF > /usr/share/nginx/html/config.js
window.APP_CONFIG = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF

# Start Nginx
exec "$@" 