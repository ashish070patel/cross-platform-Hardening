import { useEffect, useState } from "react";

import api from "../services/api";


function Dashboard() {
    const [agents, setAgents] = useState([]);
    const [securityStatuses, setSecurityStatuses] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [alertError, setAlertError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        let isMounted = true;
        let isFetching = false;

        const fetchDashboardData = async (initialLoad = false) => {
            if (isFetching) {
                return;
            }

            isFetching = true;

            try {
                // 1. Fetch registered devices.
                const agentsResponse = await api.get("/agents");
                const agentList = agentsResponse.data.agents ?? [];

                // 2. Fetch the latest security status for each device.
                const statusResults = await Promise.all(
                    agentList.map(async (agent) => {
                        try {
                            const response = await api.get(
                                `/security/status/${agent._id}`
                            );

                            return {
                                agent,
                                status: response.data.securityStatus
                            };
                        } catch (requestError) {
                            console.error(
                                `Failed to fetch security status for ${agent.agentId}:`,
                                requestError
                            );

                            return {
                                agent,
                                status: null
                            };
                        }
                    })
                );

                // 3. Fetch alert records independently.
                let latestAlerts = null;
                let latestAlertError = "";

                try {
                    const alertsResponse = await api.get("/alerts");
                    latestAlerts = alertsResponse.data.alerts ?? [];
                } catch (requestError) {
                    console.error(
                        "Failed to fetch dashboard alerts:",
                        requestError
                    );

                    latestAlertError =
                        "Unable to refresh alerts. Showing previously loaded alert data.";
                }

                // 4. Update the dashboard.
                if (isMounted) {
                    setAgents(agentList);
                    setSecurityStatuses(statusResults);

                    if (latestAlerts !== null) {
                        setAlerts(latestAlerts);
                    }

                    setAlertError(latestAlertError);
                    setLastUpdated(new Date());
                    setError("");
                }
            } catch (requestError) {
                console.error(
                    "Failed to refresh dashboard:",
                    requestError
                );

                if (isMounted) {
                    setError(
                        "Unable to refresh dashboard data. Check the backend connection."
                    );
                }
            } finally {
                isFetching = false;

                if (isMounted && initialLoad) {
                    setLoading(false);
                }
            }
        };

        // Fetch data when the Dashboard opens.
        fetchDashboardData(true);

        // Refresh data every 30 seconds.
        const intervalId = setInterval(() => {
            fetchDashboardData();
        }, 30000);

        // Clean up the interval when leaving the page.
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    // Calculate dashboard statistics.
    const totalAgents = agents.length;

    const secureAgents = securityStatuses.filter(
        (item) => item.status?.basicSecurity === "secure"
    ).length;

    const warningAgents = securityStatuses.filter(
        (item) => item.status?.basicSecurity === "warning"
    ).length;

    // Count actual active critical alerts from MongoDB.
    const criticalAlerts = alerts.filter(
        (alert) =>
            alert.status === "active" &&
            alert.severity === "Critical"
    ).length;

    if (loading) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Security Dashboard</h1>
                    <p>Cross-Platform OS Security Monitoring</p>
                </div>

                <section className="security-section">
                    <p>Loading dashboard data...</p>
                </section>
            </div>
        );
    }

    if (error && agents.length === 0) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Security Dashboard</h1>
                    <p>Cross-Platform OS Security Monitoring</p>
                </div>

                <section className="security-section">
                    <p className="status-critical">{error}</p>
                    <p>The Dashboard will retry automatically.</p>
                </section>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Security Dashboard</h1>

                <p>Cross-Platform OS Security Monitoring</p>

                <p>Automatic refresh interval: 30 seconds</p>

                <p>
                    Last successful refresh:{" "}
                    {lastUpdated
                        ? lastUpdated.toLocaleTimeString()
                        : "Not available"}
                </p>
            </div>

            {error && (
                <section className="security-section">
                    <p className="status-critical">{error}</p>
                    <p>Displaying the last available device data.</p>
                </section>
            )}

            {alertError && (
                <section className="security-section">
                    <p className="status-critical">{alertError}</p>
                </section>
            )}

            <section className="summary-grid">
                <div className="summary-card">
                    <h3>Total Agents</h3>
                    <p>{totalAgents}</p>
                </div>

                <div className="summary-card">
                    <h3>Secure Agents</h3>
                    <p>{secureAgents}</p>
                </div>

                <div className="summary-card">
                    <h3>Warnings</h3>
                    <p>{warningAgents}</p>
                </div>

                <div className="summary-card">
                    <h3>Critical Alerts</h3>
                    <p>{criticalAlerts}</p>
                </div>
            </section>

            <section className="security-section">
                <h2>Recent Security Status</h2>

                {securityStatuses.length === 0 ? (
                    <p>No security data available.</p>
                ) : (
                    <table className="security-table">
                        <thead>
                            <tr>
                                <th>Device</th>
                                <th>Operating System</th>
                                <th>Agent Status</th>
                                <th>Security Status</th>
                                <th>Last Seen</th>
                            </tr>
                        </thead>

                        <tbody>
                            {securityStatuses.map((item) => {
                                const agentOnline =
                                    item.agent.status === "online";

                                const security = item.status?.basicSecurity;

                                const securityClass =
                                    security === "secure"
                                        ? "status-secure"
                                        : security === "critical"
                                            ? "status-critical"
                                            : "";

                                return (
                                    <tr key={item.agent._id}>
                                        <td>{item.agent.hostname}</td>

                                        <td>
                                            {item.agent.os}{" "}
                                            {item.agent.osVersion || ""}
                                        </td>

                                        <td
                                            className={
                                                agentOnline
                                                    ? "status-secure"
                                                    : "status-critical"
                                            }
                                        >
                                            {agentOnline ? "Online" : "Offline"}
                                        </td>

                                        <td className={securityClass}>
                                            {security || "No Data"}
                                        </td>

                                        <td>
                                            {item.agent.lastSeen
                                                ? new Date(
                                                    item.agent.lastSeen
                                                ).toLocaleString()
                                                : "Never"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default Dashboard;