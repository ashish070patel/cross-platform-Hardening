const Agent = require("../models/Agent");

// Consider an agent offline if it has not reported
// its status within the last 90 seconds.
const OFFLINE_THRESHOLD_MS = 90 * 1000;


/**
 * Mark agents as offline when their last communication
 * exceeds the allowed time.
 */
const updateOfflineAgents = async () => {
    const cutoffTime = new Date(
        Date.now() - OFFLINE_THRESHOLD_MS
    );

    await Agent.updateMany(
        {
            status: "online",
            $or: [
                {
                    lastSeen: {
                        $lt: cutoffTime
                    }
                },
                {
                    lastSeen: null
                }
            ]
        },
        {
            $set: {
                status: "offline"
            }
        }
    );
};


/**
 * Register a new security agent.
 */
const registerAgent = async (agentData) => {
    if (!agentData || typeof agentData !== "object") {
        const error = new Error("Agent data is required.");
        error.statusCode = 400;
        throw error;
    }

    const existingAgent = await Agent.findOne({
        agentId: agentData.agentId
    });

    if (existingAgent) {
        const error = new Error("Agent already registered.");
        error.statusCode = 409;
        throw error;
    }

    const agent = await Agent.create({
        ...agentData,
        status: "online",
        lastSeen: new Date()
    });

    return agent;
};


/**
 * Retrieve all registered agents.
 * Also updates their Online/Offline status.
 */
const getAllAgents = async () => {
    await updateOfflineAgents();

    return Agent.find().sort({
        createdAt: -1
    });
};


/**
 * Retrieve a particular agent by its public agent ID.
 */
const getAgentById = async (agentId) => {
    await updateOfflineAgents();

    return Agent.findOne({
        agentId
    });
};


module.exports = {
    registerAgent,
    getAllAgents,
    getAgentById,
    updateOfflineAgents
};