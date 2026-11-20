const SecurityStatus = require("../models/SecurityStatus");


/**
 * Save a new security-status report from an endpoint.
 */
const createSecurityStatus = async (securityData) => {
    const securityStatus = await SecurityStatus.create(
        securityData
    );

    return securityStatus;
};


/**
 * Retrieve the most recent security-status report for an agent.
 */
const getLatestSecurityStatus = async (agentId) => {
    const securityStatus = await SecurityStatus.findOne({
        agentId
    })
        .sort({
            createdAt: -1
        });

    return securityStatus;
};


/**
 * Retrieve the latest status records for multiple agents.
 * Useful for future dashboard or reporting improvements.
 */
const getLatestSecurityStatuses = async (agentIds = []) => {
    if (!Array.isArray(agentIds) || agentIds.length === 0) {
        return [];
    }

    const results = await SecurityStatus.aggregate([
        {
            $match: {
                agentId: {
                    $in: agentIds
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $group: {
                _id: "$agentId",
                securityStatus: {
                    $first: "$$ROOT"
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: "$securityStatus"
            }
        }
    ]);

    return results;
};


module.exports = {
    createSecurityStatus,
    getLatestSecurityStatus,
    getLatestSecurityStatuses
};