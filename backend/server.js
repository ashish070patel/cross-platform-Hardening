require("dotenv").config();

const http = require("http");

const app = require("./app/app");
const connectDatabase = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

let server;


/**
 * Start the application only after MongoDB connects.
 */
const startServer = async () => {
    try {
        await connectDatabase();

        server = http.createServer(app);

        server.listen(PORT, () => {
            console.log("----------------------------------");
            console.log(" CyberSec Security Platform");
            console.log("----------------------------------");
            console.log(`Server: http://localhost:${PORT}`);
            console.log(
                `Health: http://localhost:${PORT}/api/system/health`
            );
            console.log(
                `Agents: http://localhost:${PORT}/api/agents`
            );
            console.log(
                `Alerts: http://localhost:${PORT}/api/alerts`
            );
            console.log("----------------------------------");
        });

        server.on("error", (error) => {
            console.error("HTTP server error:", error.message);
            process.exitCode = 1;
        });

    } catch (error) {
        console.error(
            "Failed to start the backend:",
            error.message
        );

        process.exitCode = 1;
    }
};


/**
 * Shut down cleanly when the process receives a termination signal.
 */
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down...`);

    if (!server) {
        process.exit(0);
    }

    server.close(async () => {
        try {
            const mongoose = require("mongoose");

            await mongoose.disconnect();

            console.log("MongoDB disconnected.");
            console.log("Backend stopped.");
            process.exit(0);

        } catch (error) {
            console.error(
                "Error during shutdown:",
                error.message
            );

            process.exit(1);
        }
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();