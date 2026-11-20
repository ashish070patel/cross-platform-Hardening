const Alert = require("../models/Alert");

/**
 * Create, update, or resolve alerts based on a device's
 * latest security status.
 */
const syncSecurityAlerts = async (agentId, securityData) => {
    if (!agentId || !securityData) {
        throw new Error("Agent ID and security data are required");
    }

    const alertsToKeep = [];
    const checkedTypes = new Set();

    // 1. Check firewall status.
    if (typeof securityData.firewall === "boolean") {
        checkedTypes.add("Firewall");

        if (securityData.firewall === false) {
            alertsToKeep.push({
                agentId,
                type: "Firewall",
                severity: "Critical",
                message: "The endpoint firewall is disabled."
            });
        }
    }

    // 2. Check failed-login detection.
    const failedLogins = securityData.failedLoginAttempts;

    if (
        typeof failedLogins === "number" &&
        Number.isFinite(failedLogins) &&
        failedLogins >= 0
    ) {
        checkedTypes.add("Failed Login");

        if (failedLogins > 0) {
            alertsToKeep.push({
                agentId,
                type: "Failed Login",
                severity: "High",
                message:
                    `${failedLogins} failed login attempt(s) ` +
                    "detected during the latest monitoring interval."
            });
        }
    }

    // 3. Create or update alerts that are currently detected.
    for (const alertData of alertsToKeep) {
        const existingAlert = await Alert.findOne({
            agentId,
            type: alertData.type,
            status: "active"
        });

        if (existingAlert) {
            existingAlert.severity = alertData.severity;
            existingAlert.message = alertData.message;
            existingAlert.lastSeen = new Date();
            existingAlert.occurrences += 1;

            await existingAlert.save();
        } else {
            await Alert.create({
                ...alertData,
                status: "active",
                occurrences: 1,
                lastSeen: new Date()
            });
        }
    }

    // 4. Resolve alerts only when a check has a known result.
    const activeTypes = new Set(
        alertsToKeep.map((alert) => alert.type)
    );

    for (const type of checkedTypes) {
        if (!activeTypes.has(type)) {
            await Alert.updateMany(
                {
                    agentId,
                    type,
                    status: "active"
                },
                {
                    $set: {
                        status: "resolved"
                    }
                }
            );
        }
    }
};

/**
 * Retrieve alerts with their associated device information.
 */
const getAllAlerts = async () => {
    return Alert.find()
        .populate("agentId", "agentId hostname os osVersion")
        .sort({ lastSeen: -1 });
};

module.exports = {
    syncSecurityAlerts,
    getAllAlerts
};