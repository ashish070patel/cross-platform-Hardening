const express = require("express");

const router = express.Router();

const {
    createSecurityStatus,
    getLatestSecurityStatus
} = require("../controllers/securityController");

// POST /api/security/status
// Receive, validate, and store a security report.
router.post("/status", createSecurityStatus);

// GET /api/security/status/:agentId
// Retrieve the latest report using the MongoDB agent ID.
router.get("/status/:agentId", getLatestSecurityStatus);

module.exports = router;