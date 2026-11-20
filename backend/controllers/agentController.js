const agentService = require("../services/agentService");


/**
 * Register a new security agent.
 * POST /api/agents/register
 */
const registerAgent = async (req, res) => {
    try {
        const {
            agentId,
            hostname,
            os,
            osVersion,
            ipAddress,
            agentVersion
        } = req.body || {};

        // Validate required registration information.
        if (
            typeof agentId !== "string" ||
            !agentId.trim() ||
            typeof hostname !== "string" ||
            !hostname.trim() ||
            typeof os !== "string" ||
            !["Windows", "Linux", "macOS"].includes(os)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Agent ID, hostname, and a supported operating system are required."
            });
        }

        const agent = await agentService.registerAgent({
            agentId: agentId.trim(),
            hostname: hostname.trim(),
            os,
            osVersion,
            ipAddress,
            agentVersion
        });

        return res.status(201).json({
            success: true,
            message: "Agent registered successfully.",
            agent
        });
    } catch (error) {
        console.error(
            "Agent registration failed:",
            error.message
        );

        if (
            error.statusCode === 409 ||
            error.code === 11000
        ) {
            return res.status(409).json({
                success: false,
                message: "Agent is already registered."
            });
        }

        if (
            error.statusCode === 400 ||
            error.name === "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid agent registration data."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to register agent."
        });
    }
};


/**
 * Retrieve all registered agents.
 * GET /api/agents
 */
const getAllAgents = async (req, res) => {
    try {
        const agents = await agentService.getAllAgents();

        return res.status(200).json({
            success: true,
            count: agents.length,
            agents
        });
    } catch (error) {
        console.error(
            "Failed to retrieve agents:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve agents."
        });
    }
};


/**
 * Retrieve one agent using its agentId.
 * GET /api/agents/:agentId
 */
const getAgentById = async (req, res) => {
    try {
        const agent = await agentService.getAgentById(
            req.params.agentId
        );

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found."
            });
        }

        return res.status(200).json({
            success: true,
            agent
        });
    } catch (error) {
        console.error(
            "Failed to retrieve agent:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve agent."
        });
    }
};


module.exports = {
    registerAgent,
    getAllAgents,
    getAgentById
};