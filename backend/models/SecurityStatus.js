const mongoose = require("mongoose");

const securityStatusSchema = new mongoose.Schema(
    {
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent",
            required: true,
            index: true
        },

        firewall: {
            type: Boolean,
            required: true
        },

        openPorts: {
            type: [Number],
            default: [],
            validate: {
                validator: (ports) =>
                    Array.isArray(ports) &&
                    ports.every(
                        (port) =>
                            Number.isInteger(port) &&
                            port >= 0 &&
                            port <= 65535
                    ),
                message: "Open ports must contain valid port numbers."
            }
        },

        runningServices: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Running services must be an integer."
            }
        },

        failedLoginAttempts: {
            type: Number,
            default: null,
            min: 0,
            validate: {
                validator: (value) =>
                    value === null ||
                    (
                        Number.isInteger(value) &&
                        value >= 0
                    ),
                message:
                    "Failed login attempts must be a non-negative integer or null."
            }
        },

        basicSecurity: {
            type: String,
            enum: ["secure", "warning", "critical"],
            default: "warning",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Optimize retrieval of the latest status for a device.
securityStatusSchema.index({
    agentId: 1,
    createdAt: -1
});

const SecurityStatus = mongoose.model(
    "SecurityStatus",
    securityStatusSchema
);

module.exports = SecurityStatus;