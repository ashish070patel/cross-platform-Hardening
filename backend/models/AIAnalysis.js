
const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
    {
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent",
            required: true
        },
        reportId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SecurityStatus",
            required: true
        },
        analysis: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
