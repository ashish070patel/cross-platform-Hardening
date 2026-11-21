require("dotenv").config();

const { analyzeSecurityReport } = require("./services/aiService");

async function test() {
    try {
        const report = {
            firewall: true,
            openPorts: [135, 445, 3306, 5000, 27017],
            runningServices: 140,
            failedLoginAttempts: 3,
            basicSecurity: "warning"
        };

        const result = await analyzeSecurityReport(report);
        console.log(result);

    } catch (error) {
        console.error(error.message);
    }
}

test();