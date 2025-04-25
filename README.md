# Log Visualizer UI

This project is a simple web-based log visualizer built using HTML, CSS, and JavaScript. It allows users to search and view logs with features like pagination, raw log viewing, and highlighting specific keywords.

## Deployment Instructions

Follow these steps to deploy and run the project on an HTTP server:

### Prerequisites

1. Ensure you have a web server installed on your system. Some common options are:
   - [Node.js](https://nodejs.org/) with the `http-server` package
   - [Apache HTTP Server](https://httpd.apache.org/)
   - [Nginx](https://nginx.org/)
   - Python's built-in HTTP server

2. Download or clone this repository to your local machine.

### Steps to Deploy

#### Using Node.js and `http-server`

1. Install Node.js if not already installed. You can download it from [Node.js official website](https://nodejs.org/).
2. Install the `http-server` package globally by running the following command in your terminal:
   ```bash
   npm install -g http-server
   ```
3. Navigate to the project directory:
   ```bash
   cd c:\Users\koush\Documents\projects\log-visualizer-ui-js
   ```
4. Start the HTTP server:
   ```bash
   http-server
   ```
5. Open your browser and navigate to the URL provided by the `http-server` output (e.g., `http://127.0.0.1:8080`).

#### Using Python's Built-in HTTP Server

1. Ensure Python is installed on your system. You can download it from [Python's official website](https://www.python.org/).
2. Open a terminal and navigate to the project directory:
   ```bash
   cd c:\Users\koush\Documents\projects\log-visualizer-ui-js
   ```
3. Start the HTTP server:
   - For Python 3:
     ```bash
     python -m http.server
     ```
   - For Python 2:
     ```bash
     python -m SimpleHTTPServer
     ```
4. Open your browser and navigate to the URL provided by the Python HTTP server (e.g., `http://127.0.0.1:8000`).

#### Using Other HTTP Servers

- If you are using Apache or Nginx, copy the project files to the server's document root directory and configure the server to serve the files.

## Features

- Search logs with filters like index, level, service name, and keyword.
- View raw logs with a toggle button.
- Highlight specific keywords in the log messages.
- Pagination for navigating through large datasets.

## Notes

- Ensure the backend API (`http://localhost:9231/search/search-with-highlight`) is running and accessible for the search functionality to work.
- Modify the API URL in `app.js` if the backend is hosted on a different server or port.

## License

This project is licensed under the MIT License.