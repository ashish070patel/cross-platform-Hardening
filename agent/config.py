import os
from pathlib import Path

from dotenv import load_dotenv


# Locate the .env file alongside this Python file.
AGENT_DIRECTORY = Path(__file__).resolve().parent
ENV_FILE = AGENT_DIRECTORY / ".env"

load_dotenv(dotenv_path=ENV_FILE)


# Backend API base URL.
API_BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://localhost:5000/api"
).strip().rstrip("/")


# Public identifier assigned to this endpoint.
AGENT_ID = os.getenv(
    "AGENT_ID",
    "AGENT-001"
).strip()


# Version of the Security Agent.
AGENT_VERSION = os.getenv(
    "AGENT_VERSION",
    "1.0.0"
).strip()


# Monitoring interval in seconds.
try:
    MONITORING_INTERVAL = int(
        os.getenv("MONITORING_INTERVAL", "30")
    )
except ValueError:
    MONITORING_INTERVAL = 30


if not API_BASE_URL:
    raise ValueError("API_BASE_URL cannot be empty.")

if not AGENT_ID:
    raise ValueError("AGENT_ID cannot be empty.")

if not AGENT_VERSION:
    raise ValueError("AGENT_VERSION cannot be empty.")

if MONITORING_INTERVAL < 5:
    raise ValueError(
        "MONITORING_INTERVAL must be at least 5 seconds."
    )