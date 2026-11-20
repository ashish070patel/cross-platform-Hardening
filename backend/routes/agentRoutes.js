const express = require("express");

const router = express.Router();

const {
    registerAgent,
    getAllAgents,
    getAgentById
} = require("../controllers/agentController");

// POST /api/agents/register
// Register a new endpoint.
router.post("/register", registerAgent);

// GET /api/agents
// Retrieve all registered endpoints.
router.get("/", getAllAgents);

// GET /api/agents/:agentId
// Retrieve one endpoint using its public agent ID.
router.get("/:agentId", getAgentById);

module.exports = router;