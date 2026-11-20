const getSystemHealth = (req, res) => {
    res.json({
        success: true,
        message: "CyberSec Backend is healthy"
    });
};

module.exports = {
    getSystemHealth
};