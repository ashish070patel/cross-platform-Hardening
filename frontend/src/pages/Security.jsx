import { useEffect, useState } from "react";

import api from "../services/api";

function formatDate(dateValue) {
    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
        ? "Unknown"
        : date.toLocaleString();
}

function Security() {
    const [agents, setAgents] = useState([]);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [securityStatus, setSecurityStatus] = useState(null);

    const [loadingAgents, setLoadingAgents] = useState(true);
    const [loadingSecurity, setLoadingSecurity] = useState(false);

    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    // Load registered devices when the page opens.
    useEffect(() => {
        let isMounted = true;

        const fetchAgents = async () => {
            try {
                const response = await api.get("/agents");
                const agentList = response.data.agents ?? [];

                if (isMounted) {
                    setAgents(agentList);

                    if (agentList.length > 0) {
                        setSelectedAgentId(agentList[0]._id);
                    }
                }
            } catch (requestError) {
                console.error(
                    "Failed to load registered devices:",
                    requestError
                );

                if (isMounted) {
                    setError("Failed to load registered devices.");
                }
            } finally {
                if (isMounted) {
                    setLoadingAgents(false);
                }
            }
        };

        fetchAgents();

        return () => {
            isMounted = false;
        };
    }, []);

    // Load and refresh security status for the selected device.
    useEffect(() => {
        if (!selectedAgentId) {
            setSecurityStatus(null);
            setLastUpdated(null);
            setLoadingSecurity(false);
            return;
        }

        let isMounted = true;
        let isFetching = false;

        setSecurityStatus(null);
        setLastUpdated(null);
        setError("");
        setLoadingSecurity(true);

        const fetchSecurityStatus = async (initialLoad = false) => {
            if (isFetching) {
                return;
            }

            isFetching = true;

            try {
                const response = await api.get(
                    `/security/status/${selectedAgentId}`
                );

                if (isMounted) {
                    setSecurityStatus(
                        response.data.securityStatus
                    );

                    setLastUpdated(new Date());
                    setError("");
                }
            } catch (requestError) {
                console.error(
                    "Failed to fetch security status:",
                    requestError
                );

                if (isMounted) {
                    if (requestError.response?.status === 404) {
                        setSecurityStatus(null);
                        setError(
                            "No security status is available for this device yet."
                        );
                    } else {
                        setError(
                            "Failed to refresh security status. Check the backend connection."
                        );
                    }
                }
            } finally {
                isFetching = false;

                if (isMounted && initialLoad) {
                    setLoadingSecurity(false);
                }
            }
        };

        // Retrieve data immediately.
        fetchSecurityStatus(true);

        // Refresh every 30 seconds.
        const intervalId = setInterval(() => {
            fetchSecurityStatus();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [selectedAgentId]);

    const selectedAgent = agents.find(
        (agent) => agent._id === selectedAgentId
    );

    const openPorts = securityStatus?.openPorts ?? [];

    const failedLoginAttempts =
        securityStatus?.failedLoginAttempts;

    const overallSecurity = securityStatus?.basicSecurity;

    const overallSecurityClass =
        overallSecurity === "secure"
            ? "status-secure"
            : overallSecurity === "critical"
                ? "status-critical"
                : "";

    if (loadingAgents) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Security Status</h1>
                    <p>
                        Current security condition of an endpoint
                    </p>
                </div>

                <section className="security-section">
                    <p>Loading registered devices...</p>
                </section>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Security Status</h1>
                <p>
                    Current security condition of registered endpoints
                </p>
                <p>Automatic refresh interval: 30 seconds</p>
                <p>
                    Last successful refresh:{" "}
                    {lastUpdated
                        ? lastUpdated.toLocaleTimeString()
                        : "Not available"}
                </p>
            </div>

            <section className="security-section">
                <h2>Select Device</h2>

                {agents.length === 0 ? (
                    <p>No registered devices found.</p>
                ) : (
                    <select
                        value={selectedAgentId}
                        onChange={(event) =>
                            setSelectedAgentId(event.target.value)
                        }
                        aria-label="Select a device to inspect"
                        style={{
                            padding: "10px",
                            minWidth: "250px"
                        }}
                    >
                        {agents.map((agent) => (
                            <option
                                key={agent._id}
                                value={agent._id}
                            >
                                {agent.hostname} - {agent.os} (
                                {agent.agentId})
                            </option>
                        ))}
                    </select>
                )}
            </section>

            {error && (
                <section className="security-section">
                    <p className="status-critical">{error}</p>

                    {securityStatus && (
                        <p>
                            Displaying the last successfully retrieved
                            security report.
                        </p>
                    )}
                </section>
            )}

            {loadingSecurity && (
                <section className="security-section">
                    <p>Loading security status...</p>
                </section>
            )}

            {!loadingSecurity && !securityStatus && !error &&
                selectedAgentId && (
                    <section className="security-section">
                        <p>No security report is available yet.</p>
                    </section>
                )}

            {securityStatus && (
                <>
                    <section className="security-section">
                        <h2>
                            {selectedAgent?.hostname ?? "Selected Device"}
                        </h2>

                        <p>
                            Agent ID: {selectedAgent?.agentId ?? "Unknown"}
                        </p>

                        <p>
                            Operating System:{" "}
                            {selectedAgent?.os ?? "Unknown"}{" "}
                            {selectedAgent?.osVersion ?? ""}
                        </p>

                        <p>
                            Device last seen:{" "}
                            {formatDate(selectedAgent?.lastSeen)}
                        </p>
                    </section>

                    <section className="security-status-grid">
                        <div className="security-status-card">
                            <h3>Firewall</h3>

                            <p
                                className={
                                    securityStatus.firewall
                                        ? "status-secure"
                                        : "status-critical"
                                }
                            >
                                {securityStatus.firewall
                                    ? "Enabled"
                                    : "Disabled"}
                            </p>
                        </div>

                        <div className="security-status-card">
                            <h3>Listening Ports</h3>
                            <p>{openPorts.length}</p>
                        </div>

                        <div className="security-status-card">
                            <h3>Running Services</h3>
                            <p>
                                {securityStatus.runningServices ?? "Unknown"}
                            </p>
                        </div>

                        <div className="security-status-card">
                            <h3>Failed Logins</h3>
                            <p>
                                {failedLoginAttempts == null
                                    ? "Unavailable"
                                    : failedLoginAttempts}
                            </p>
                        </div>
                    </section>

                    <section className="security-section">
                        <h2>Security Details</h2>

                        <table className="security-table">
                            <thead>
                                <tr>
                                    <th>Security Check</th>
                                    <th>Current Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td>Firewall</td>
                                    <td
                                        className={
                                            securityStatus.firewall
                                                ? "status-secure"
                                                : "status-critical"
                                        }
                                    >
                                        {securityStatus.firewall
                                            ? "Enabled"
                                            : "Disabled"}
                                    </td>
                                </tr>

                                <tr>
                                    <td>Listening Ports</td>
                                    <td>
                                        {openPorts.length > 0
                                            ? openPorts.join(", ")
                                            : "None reported"}
                                    </td>
                                </tr>

                                <tr>
                                    <td>Running Services</td>
                                    <td>
                                        {securityStatus.runningServices ?? "Unknown"}
                                    </td>
                                </tr>

                                <tr>
                                    <td>Failed Login Attempts (last 30 seconds)</td>
                                    <td>
                                        {failedLoginAttempts == null
                                            ? "Unavailable"
                                            : failedLoginAttempts}
                                    </td>
                                </tr>

                                <tr>
                                    <td>Overall Security</td>
                                    <td className={overallSecurityClass}>
                                        {overallSecurity ?? "Unknown"}
                                    </td>
                                </tr>

                                <tr>
                                    <td>Report Created</td>
                                    <td>
                                        {formatDate(
                                            securityStatus.createdAt
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </div>
    );
}

export default Security;