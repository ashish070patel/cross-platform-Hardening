const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
    {
        agentId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 1,
            maxlength: 100
        },

        hostname: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },

        os: {
            type: String,
            required: true,
            enum: ["Windows", "Linux", "macOS"]
        },

        osVersion: {
            type: String,
            default: "Unknown",
            trim: true,
            maxlength: 255
        },

        ipAddress: {
            type: String,
            default: "Unknown",
            trim: true,
            maxlength: 100
        },

        agentVersion: {
            type: String,
            default: "1.0.0",
            trim: true,
            maxlength: 50
        },

        status: {
            type: String,
            enum: ["online", "offline"],
            default: "offline",
            required: true,
            index: true
        },

        lastSeen: {
            type: Date,
            default: null,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Support listing agents by their most recently created records.
agentSchema.index({
    createdAt: -1
});

const Agent = mongoose.model("Agent", agentSchema);

module.exports = Agent;