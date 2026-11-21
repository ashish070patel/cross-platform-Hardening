const express = require("express");
const router = express.Router();

const {
    analyzeSecurity,
    getAIAnalysis
} = require("../controllers/aiController");

router.post("/analyze/:agentId", analyzeSecurity);

router.get("/history/:agentId", getAIAnalysis);

module.exports = router;