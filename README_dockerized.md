# Log Visualizer UI (Dockerized Version)

This guide explains how to build and run the static website using Docker and Docker Compose, with dynamic backend API configuration at runtime.

---

## Features
- **Nginx** serves the static site in a container.
- **Dynamic API URL**: The backend API base URL is injected at container startup via environment variables (no hardcoding).
- **Docker Networking**: The static site and backend communicate using Docker Compose networks.
- **Simple, portable, and environment-agnostic setup.**

---

## Folder Structure
```
log-visualizer-ui-js/
  ├── Dockerfile
  ├── entrypoint.sh
  ├── nginx.conf
  ├── docker-compose.yml
  ├── index.html
  ├── script.js
  ├── styles.css
  └── ... (other static files)
```

---

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## Configuration

### 1. Set the Backend API URL
Edit `docker-compose.yml`:
```yaml
services:
  logPulse-ui:
    build: .
    container_name: logPulse-ui
    environment:
      - API_BASE_URL=http://log-visualizer:8080
    ports:
      - "80:80"
    networks:
      - dockercompose_default

networks:
  dockercompose_default:
    driver: bridge
```
- Change `API_BASE_URL` as needed for your environment.
- Ensure your backend service (`log-visualizer`) is on the same Docker network and accessible by the name `log-visualizer`.

---

## Build and Run

From the project root:

### Build the Docker image (optional, Compose will build if needed):
```sh
docker-compose build
```

### Start the containers:
```sh
docker-compose up
```
- Add `-d` to run in detached mode: `docker-compose up -d`

### Access the site:
- Open [http://localhost/](http://localhost/) in your browser.

---

## How Dynamic API URL Works
- The `entrypoint.sh` script runs at container startup and writes a `config.js` file with the API base URL from the `API_BASE_URL` environment variable.
- The frontend JS (`script.js`) reads the API base URL from `window.APP_CONFIG.API_BASE_URL`.
- To change the backend URL, update `API_BASE_URL` in `docker-compose.yml` and restart the container.

---

## Troubleshooting
- **Network errors**: Ensure both frontend and backend containers are on the same Docker network.
- **API not reachable**: Check that the backend service name matches the URL in `API_BASE_URL`.
- **Port conflicts**: Make sure port 80 is available on your host.

---

## Updating the Site
- Edit your static files as needed.
- Rebuild the Docker image: `docker-compose build`
- Restart the containers: `docker-compose up -d`

---

## Legacy/Manual Usage
- The original `README.md` is preserved for non-Docker/manual usage instructions.

---

## License
See original `README.md` for license and credits. 