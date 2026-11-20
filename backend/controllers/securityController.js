const mongoose = require("mongoose");

const Agent = require("../models/Agent");
const securityService = require("../services/securityService");
const alertService = require("../services/alertService");


const createSecurityStatus = async (req, res) => {
    try {
        const {
            agentId,
            firewall,
            openPorts,
            runningServices,
            failedLoginAttempts
        } = req.body || {};

        // Validate the MongoDB agent ID.
        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: "A valid MongoDB agent ID is required."
            });
        }

        // Verify that the agent exists.
        const agent = await Agent.findById(agentId);

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Registered agent not found."
            });
        }

        // Validate security data.
        if (typeof firewall !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Firewall status must be true or false."
            });
        }

        if (
            openPorts !== undefined &&
            (
                !Array.isArray(openPorts) ||
                !openPorts.every(
                    (port) =>
                        Number.isInteger(port) &&
                        port >= 0 &&
                        port <= 65535
                )
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Open ports must be an array of valid port numbers."
            });
        }

        if (
            runningServices !== undefined &&
            (
                !Number.isInteger(runningServices) ||
                runningServices < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Running services must be a non-negative integer."
            });
        }

        if (
            failedLoginAttempts !== undefined &&
            failedLoginAttempts !== null &&
            (
                !Number.isInteger(failedLoginAttempts) ||
                failedLoginAttempts < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Failed login attempts must be a non-negative integer or null."
            });
        }

        // Calculate the overall security status.
        // Unknown failed-login detection must not be treated as zero.
        let basicSecurity;

        if (!firewall) {
            basicSecurity = "critical";
        } else if (
            failedLoginAttempts === null ||
            failedLoginAttempts === undefined ||
            failedLoginAttempts > 0
        ) {
            basicSecurity = "warning";
        } else {
            basicSecurity = "secure";
        }

        const securityData = {
            agentId: agent._id,
            firewall,
            openPorts: openPorts ?? [],
            runningServices: runningServices ?? 0,
            failedLoginAttempts: failedLoginAttempts ?? null,
            basicSecurity
        };

        // Save the security status.
        const securityStatus =
            await securityService.createSecurityStatus(securityData);

        const warnings = [];

        // Update the agent's last communication time.
        try {
            await Agent.findByIdAndUpdate(agent._id, {
                $set: {
                    status: "online",
                    lastSeen: new Date()
                }
            });
        } catch (error) {
            console.error(
                "Failed to update agent activity:",
                error.message
            );

            warnings.push(
                "Security data was saved, but device activity could not be updated."
            );
        }

        // Create, update, or resolve alerts.
        try {
            await alertService.syncSecurityAlerts(
                agent._id,
                securityStatus.toObject()
            );
        } catch (error) {
            console.error(
                "Failed to process security alerts:",
                error.message
            );

            warnings.push(
                "Security data was saved, but alert processing failed."
            );
        }

        return res.status(201).json({
            success: true,
            message: "Security status saved successfully.",
            securityStatus,
            ...(warnings.length ? { warnings } : {})
        });
    } catch (error) {
        console.error(
            "Failed to save security status:",
            error.message
        );

        const isValidationError =
            error.name === "ValidationError" ||
            error.name === "CastError";

        return res.status(isValidationError ? 400 : 500).json({
            success: false,
            message: isValidationError
                ? "Invalid security-status data."
                : "Failed to save security status."
        });
    }
};


const getLatestSecurityStatus = async (req, res) => {
    try {
        const { agentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid MongoDB agent ID."
            });
        }

        const securityStatus =
            await securityService.getLatestSecurityStatus(agentId);

        if (!securityStatus) {
            return res.status(404).json({
                success: false,
                message: "No security status is available for this agent."
            });
        }

        return res.status(200).json({
            success: true,
            securityStatus
        });
    } catch (error) {
        console.error(
            "Failed to retrieve security status:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve security status."
        });
    }
};


module.exports = {
    createSecurityStatus,
    getLatestSecurityStatus
};