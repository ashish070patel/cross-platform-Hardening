const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent",
            required: true
        },

        type: {
            type: String,
            required: true,
            enum: [
                "Failed Login",
                "Firewall",
                "Security Configuration"
            ],
            trim: true
        },

        severity: {
            type: String,
            required: true,
            enum: [
                "Low",
                "Medium",
                "High",
                "Critical"
            ],
            default: "Medium"
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        status: {
            type: String,
            enum: ["active", "resolved"],
            default: "active",
            required: true
        },

        occurrences: {
            type: Number,
            default: 1,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Occurrences must be an integer."
            }
        },

        firstSeen: {
            type: Date,
            default: Date.now
        },

        lastSeen: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Helps retrieve active alerts for a particular device and type.
alertSchema.index({
    agentId: 1,
    status: 1,
    type: 1
});

// Helps display the most recently detected alerts first.
alertSchema.index({
    lastSeen: -1
});

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;