import { useEffect, useState } from "react";
import api from "../services/api";

function formatDate(dateValue) {
    if (!dateValue) {
        return "Never";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleString();
}

function Devices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        let isMounted = true;
        let isFetching = false;

        const fetchDevices = async (initialLoad = false) => {
            if (isFetching) {
                return;
            }

            isFetching = true;

            try {
                // The backend also checks for stale devices here.
                const response = await api.get("/agents");

                if (isMounted) {
                    setDevices(response.data.agents ?? []);
                    setLastUpdated(new Date());
                    setError("");
                }
            } catch (requestError) {
                console.error(
                    "Failed to fetch devices:",
                    requestError
                );

                if (isMounted) {
                    setError(
                        "Unable to refresh devices. Check that the backend is running."
                    );
                }
            } finally {
                isFetching = false;

                if (isMounted && initialLoad) {
                    setLoading(false);
                }
            }
        };

        fetchDevices(true);

        const intervalId = setInterval(() => {
            fetchDevices();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    if (loading) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <h1>Devices</h1>
                    <p>Manage registered security agents</p>
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
                <h1>Devices</h1>
                <p>
                    Manage and monitor registered security agents
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
                        Showing the last successfully loaded device data.
                    </p>
                </section>
            )}

            <section className="security-section">
                <h2>Registered Devices</h2>

                {devices.length === 0 ? (
                    <p>No registered agents found.</p>
                ) : (
                    <table className="security-table">
                        <thead>
                            <tr>
                                <th>Agent ID</th>
                                <th>Device</th>
                                <th>Operating System</th>
                                <th>Status</th>
                                <th>Last Seen</th>
                            </tr>
                        </thead>

                        <tbody>
                            {devices.map((device) => {
                                const isOnline =
                                    device.status === "online";

                                return (
                                    <tr key={device._id}>
                                        <td>{device.agentId}</td>
                                        <td>{device.hostname}</td>

                                        <td>
                                            {device.os}{" "}
                                            {device.osVersion || ""}
                                        </td>

                                        <td
                                            className={
                                                isOnline
                                                    ? "status-secure"
                                                    : "status-critical"
                                            }
                                        >
                                            {isOnline
                                                ? "Online"
                                                : "Offline"}
                                        </td>

                                        <td>
                                            {formatDate(device.lastSeen)}
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

export default Devices;