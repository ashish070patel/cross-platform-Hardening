import requests

from config import API_BASE_URL


REQUEST_TIMEOUT = 10


def register_agent(agent_data):
    """Register this endpoint with the backend."""
    url = f"{API_BASE_URL}/agents/register"

    try:
        response = requests.post(
            url,
            json=agent_data,
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code == 201:
            print("Agent registered successfully.")
            return response.json()

        if response.status_code == 409:
            print("Agent is already registered.")
            return None

        print(
            f"Agent registration failed "
            f"({response.status_code}): {response.text}"
        )
        return None

    except requests.RequestException as error:
        print(f"Could not connect to backend: {error}")
        return None


def get_agent(agent_id):
    """Retrieve an existing endpoint by its public agent ID."""
    url = f"{API_BASE_URL}/agents/{agent_id}"

    try:
        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code == 200:
            return response.json().get("agent")

        if response.status_code == 404:
            print(f"Agent {agent_id} was not found.")
            return None

        print(
            f"Failed to retrieve agent "
            f"({response.status_code}): {response.text}"
        )
        return None

    except requests.RequestException as error:
        print(f"Could not retrieve agent: {error}")
        return None


def send_security_status(agent_mongodb_id, security_data):
    """Upload a security report to the backend."""
    url = f"{API_BASE_URL}/security/status"

    payload = {
        "agentId": agent_mongodb_id,
        "firewall": security_data["firewall"],
        "openPorts": security_data.get("openPorts", []),
        "runningServices": security_data.get("runningServices", 0),
        "failedLoginAttempts": security_data.get(
            "failedLoginAttempts"
        )
    }

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code == 201:
            print("Security status uploaded successfully.")
            return response.json()

        print(
            f"Security status upload failed "
            f"({response.status_code}): {response.text}"
        )
        return None

    except requests.RequestException as error:
        print(f"Could not upload security status: {error}")
        return None