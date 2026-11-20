const express = require("express");

const router = express.Router();

const {
    getAllAlerts,
    getAlertById
} = require("../controllers/alertController");

// GET /api/alerts
// Retrieve all security alerts.
router.get("/", getAllAlerts);

// GET /api/alerts/:alertId
// Retrieve one alert by MongoDB ID.
router.get("/:alertId", getAlertById);

module.exports = router;