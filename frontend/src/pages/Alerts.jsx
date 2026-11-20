import { useEffect, useState } from "react";

import api from "../services/api";

function formatDate(dateValue) {
    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleString();
}

function getSeverityClass(severity) {
    if (severity === "High" || severity === "Critical") {
        return "status-critical";
    }

    if (severity === "Low") {
        return "status-secure";
    }

    return "";
}

function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        let isMounted = true;
        let isFetching = false;

        const fetchAlerts = async (initialLoad = false) => {
            if (isFetching) {
                return;
            }

            isFetching = true;

            try {
                const response = await api.get("/alerts");

                if (isMounted) {
                    setAlerts(response.data.alerts ?? []);
                    setLastUpdated(new Date());
                    setError("");
                }
            } catch (requestError) {
                console.error(
                    "Failed to fetch security alerts:",
                    requestError
                );

                if (isMounted) {
                    setError(
                        "Unable to refresh alerts. Check that the backend is running."
                    );
                }
            } finally {
                isFetching = false;

                if (isMounted && initialLoad) {
                    setLoading(false);
                }
            }
        };

        // Fetch alerts immediately.
        fetchAlerts(true);

        // Automatically refresh every 30 seconds.
        const intervalId = setInterval(() => {
            fetchAlerts();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const activeAlerts = alerts.filter(
        (alert) => alert.status === "active"
    );

    const criticalAlerts = activeAlerts.filter(
        (alert) => alert.severity === "Critical"
    );

    const highSeverityAlerts = activeAlerts.filter(
        (alert) => alert.severity === "High"
    );

    const mediumSeverityAlerts = activeAlerts.filter(
        (alert) => alert.severity === "Medium"
    );

    const affectedDevices = new Set(
        activeAlerts
            .map((alert) => alert.agentId?._id)
            .filter(Boolean)
    ).size;

    if (loading) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Security Alerts</h1>
                    <p>
                        Monitor security issues detected on endpoints
                    </p>
                </div>

                <section className="security-section">
                    <p>Loading security alerts...</p>
                </section>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Security Alerts</h1>

                <p>
                    Monitor security issues detected on endpoints
                </p>

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
                    <p>
                        Showing the last successfully retrieved alerts.
                    </p>
                </section>
            )}

            <section className="summary-grid">
                <div className="summary-card">
                    <h3>Total Alerts</h3>
                    <p>{alerts.length}</p>
                </div>

                <div className="summary-card">
                    <h3>Active Alerts</h3>
                    <p>{activeAlerts.length}</p>
                </div>

                <div className="summary-card">
                    <h3>Critical / High</h3>
                    <p>
                        {criticalAlerts.length +
                            highSeverityAlerts.length}
                    </p>
                </div>

                <div className="summary-card">
                    <h3>Devices Affected</h3>
                    <p>{affectedDevices}</p>
                </div>
            </section>

            <section className="security-section">
                <h2>Security Alert Records</h2>

                <p>
                    Critical: {criticalAlerts.length}
                    {" | "}
                    High: {highSeverityAlerts.length}
                    {" | "}
                    Medium: {mediumSeverityAlerts.length}
                </p>

                {alerts.length === 0 ? (
                    <p>No security alerts available.</p>
                ) : (
                    <table className="security-table">
                        <thead>
                            <tr>
                                <th>Alert ID</th>
                                <th>Device</th>
                                <th>Alert Type</th>
                                <th>Severity</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Occurrences</th>
                                <th>First Seen</th>
                                <th>Last Seen</th>
                            </tr>
                        </thead>

                        <tbody>
                            {alerts.map((alert) => (
                                <tr key={alert._id}>
                                    <td>
                                        {alert._id
                                            ? alert._id.slice(-6)
                                            : "Unknown"}
                                    </td>

                                    <td>
                                        {alert.agentId?.hostname ??
                                            "Unknown device"}
                                    </td>

                                    <td>{alert.type}</td>

                                    <td
                                        className={getSeverityClass(
                                            alert.severity
                                        )}
                                    >
                                        {alert.severity}
                                    </td>

                                    <td>{alert.message}</td>

                                    <td>{alert.status}</td>

                                    <td>{alert.occurrences ?? 1}</td>

                                    <td>
                                        {formatDate(
                                            alert.firstSeen ??
                                                alert.createdAt
                                        )}
                                    </td>

                                    <td>
                                        {formatDate(
                                            alert.lastSeen ??
                                                alert.updatedAt
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default Alerts;