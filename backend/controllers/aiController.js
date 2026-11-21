
const { analyzeSecurityReport } = require("../services/aiService");
const SecurityStatus = require("../models/SecurityStatus");
const AIAnalysis = require("../models/AIAnalysis");
const mongoose = require("mongoose");

async function analyzeSecurity(req, res) {
    try {
        const { agentId } = req.params;

        if (!mongoose.isValidObjectId(agentId)) {
            return res.status(400).json({
                message: "Invalid agent ID"
            });
        }

        const report = await SecurityStatus.findOne({
            agentId
        }).sort({ createdAt: -1 });

        if (!report) {
            return res.status(404).json({
                message: "Security report not found"
            });
        }

        const analysis = await analyzeSecurityReport({
            firewall: report.firewall,
            openPorts: report.openPorts,
            runningServices: report.runningServices,
            failedLoginAttempts: report.failedLoginAttempts,
            basicSecurity: report.basicSecurity
        });

        const savedAnalysis = await AIAnalysis.create({
            agentId,
            reportId: report._id,
            analysis
        });

        return res.status(200).json({
            success: true,
            agentId,
            analysis,
            analysisId: savedAnalysis._id
        });

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            message: "AI security analysis failed"
        });
    }
}
async function getAIAnalysis(req, res) {
    try {
        const { agentId } = req.params;

        if (!mongoose.isValidObjectId(agentId)) {
            return res.status(400).json({
                message: "Invalid agent ID"
            });
        }

        const analyses = await AIAnalysis.find({
            agentId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: analyses.length,
            analyses
        });

    } catch (error) {
        console.error(error.message);

        return res.status(500).json({
            message: "Failed to fetch AI analysis"
        });
    }
}
module.exports = { analyzeSecurity, getAIAnalysis };
