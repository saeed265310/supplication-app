# Supplication App Backend

This is a simple Node.js and Express server that provides a REST API for the Supplication Counting App. It uses SQLite for data persistence.

## Setup and Running

### Prerequisites

You need to have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies

Navigate to the directory containing these backend files (`server.js`, `package.json`, etc.) in your terminal and run the following command to install the required packages:

```bash
npm install
```

### 2. Run the Server

After the installation is complete, you can start the server with this command:

```bash
npm start
```

You should see a message in your terminal: `Server is running on http://localhost:3001`.

The server is now running and ready to accept requests from the frontend application. It will automatically create a `database.db` file in the same directory to store all the data.

### Important Notes

*   **JWT Secret:** For this demo, the secret key for signing tokens is hardcoded in `server.js`. In a real production environment, this should be stored securely as an environment variable.
*   **CORS:** The current setup allows requests from any origin, which is fine for local development. For production, you should configure it to only allow requests from your specific frontend's domain.
