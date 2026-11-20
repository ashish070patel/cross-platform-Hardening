import time

from config import (
    AGENT_ID,
    AGENT_VERSION,
    MONITORING_INTERVAL
)
from system_info import get_system_info
from security_checks import get_security_status
from api_client import (
    register_agent,
    get_agent,
    send_security_status
)


def build_agent_data():
    """Collect the endpoint information required for registration."""
    system_info = get_system_info()

    return {
        "agentId": AGENT_ID,
        "hostname": system_info["hostname"],
        "os": system_info["os"],
        "osVersion": system_info["osVersion"],
        "ipAddress": system_info["ipAddress"],
        "agentVersion": AGENT_VERSION
    }


def register_or_get_agent():
    """Register the agent or retrieve an existing registration."""
    agent_data = build_agent_data()

    print(f"Connecting to backend as {AGENT_ID}...")

    registration_response = register_agent(agent_data)

    if registration_response:
        agent = registration_response.get("agent")

        if agent:
            print("Agent registration successful.")
            return agent

    print("Checking for an existing registration...")

    existing_agent = get_agent(AGENT_ID)

    if existing_agent:
        print("Existing agent registration found.")
        return existing_agent

    return None


def run_agent_once(agent):
    """Collect security information and upload a report."""
    try:
        security_status = get_security_status()

        print("\nSecurity Monitoring Report")
        print("--------------------------")
        print(f"Agent ID: {AGENT_ID}")
        print(f"Firewall enabled: {security_status['firewall']}")
        print(f"Listening ports: {security_status['openPorts']}")
        print(
            f"Running services: "
            f"{security_status['runningServices']}"
        )

        failed_logins = security_status["failedLoginAttempts"]

        if failed_logins is None:
            print("Failed login attempts: Unavailable")
        else:
            print(f"Failed login attempts: {failed_logins}")

        print(
            f"Overall security: "
            f"{security_status['basicSecurity']}"
        )

        response = send_security_status(
            agent["_id"],
            security_status
        )

        if response and response.get("success"):
            print("Security report uploaded successfully.")
            return True

        print("Security report upload failed.")
        return False

    except Exception as error:
        print(f"Monitoring cycle failed: {error}")
        return False


def main():
    print("====================================")
    print("       CyberSec Security Agent")
    print("====================================")
    print(f"Agent ID: {AGENT_ID}")
    print(f"Agent version: {AGENT_VERSION}")
    print(f"Monitoring interval: {MONITORING_INTERVAL} seconds")

    agent = None

    # Retry registration if the backend is unavailable.
    while agent is None:
        agent = register_or_get_agent()

        if agent is None:
            print(
                "Could not register or retrieve the agent. "
                f"Retrying in {MONITORING_INTERVAL} seconds..."
            )
            time.sleep(MONITORING_INTERVAL)

    print(f"Hostname: {agent.get('hostname', 'Unknown')}")
    print(f"Operating system: {agent.get('os', 'Unknown')}")

    try:
        while True:
            print("\nStarting monitoring cycle...")

            run_agent_once(agent)

            print(
                f"Next monitoring cycle in "
                f"{MONITORING_INTERVAL} seconds."
            )

            time.sleep(MONITORING_INTERVAL)

    except KeyboardInterrupt:
        print("\nSecurity Agent stopped by user.")


if __name__ == "__main__":
    main()