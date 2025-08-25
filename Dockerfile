FROM nginx:alpine

# Copy static files (index.html, etc.)
COPY . /usr/share/nginx/html/

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Optional: Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 