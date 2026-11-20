const mongoose = require("mongoose");
const alertService = require("../services/alertService");

/**
 * Retrieve all security alerts.
 * GET /api/alerts
 */
const getAllAlerts = async (req, res) => {
    try {
        const alerts = await alertService.getAllAlerts();

        return res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (error) {
        console.error(
            "Failed to retrieve alerts:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve security alerts."
        });
    }
};

/**
 * Retrieve one alert by its MongoDB ID.
 * GET /api/alerts/:alertId
 */
const getAlertById = async (req, res) => {
    try {
        const { alertId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(alertId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid alert ID."
            });
        }

        const Alert = require("../models/Alert");

        const alert = await Alert.findById(alertId)
            .populate(
                "agentId",
                "agentId hostname os osVersion"
            );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found."
            });
        }

        return res.status(200).json({
            success: true,
            alert
        });
    } catch (error) {
        console.error(
            "Failed to retrieve alert:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve alert."
        });
    }
};

module.exports = {
    getAllAlerts,
    getAlertById
};