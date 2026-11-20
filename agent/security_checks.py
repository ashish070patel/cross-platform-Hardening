import platform
import shutil
import subprocess

import psutil


def run_command(command, timeout=15):
    """Execute a system command safely."""
    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=timeout
    )


def check_firewall():
    """Check whether the system firewall is enabled."""
    system = platform.system()

    try:
        if system == "Windows":
            result = run_command([
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-NetFirewallProfile | "
                "Select-Object -ExpandProperty Enabled"
            ])

            if result.returncode != 0:
                print("Warning: Could not read Windows firewall status.")
                return False

            values = [
                line.strip().lower()
                for line in result.stdout.splitlines()
                if line.strip()
            ]

            return bool(values) and all(
                value == "true" for value in values
            )

        elif system == "Linux":
            # Try UFW first.
            if shutil.which("ufw"):
                result = run_command(["ufw", "status"])

                if result.returncode == 0:
                    return "Status: active" in result.stdout

            # Try firewalld if UFW is not available or usable.
            if shutil.which("firewall-cmd"):
                result = run_command([
                    "firewall-cmd",
                    "--state"
                ])

                if result.returncode == 0:
                    return result.stdout.strip().lower() == "running"

            print(
                "Warning: Could not determine Linux firewall status."
            )
            return False

        elif system == "Darwin":
            result = run_command([
                "/usr/libexec/ApplicationFirewall/socketfilterfw",
                "--getglobalstate"
            ])

            if result.returncode != 0:
                print("Warning: Could not read macOS firewall status.")
                return False

            return "enabled" in result.stdout.lower()

        print(f"Unsupported operating system: {system}")
        return False

    except (subprocess.SubprocessError, OSError) as error:
        print(f"Firewall check failed: {error}")
        return False


def get_open_ports():
    """Collect listening TCP and UDP port numbers."""
    ports = set()

    try:
        connections = psutil.net_connections(kind="inet")

        for connection in connections:
            if connection.status == psutil.CONN_LISTEN:
                if connection.laddr:
                    ports.add(connection.laddr.port)

    except (psutil.Error, OSError) as error:
        print(f"Warning: Could not collect all listening ports: {error}")

    return sorted(ports)


def get_running_services():
    """Count running services or service-like processes."""
    system = platform.system()

    try:
        if system == "Windows":
            result = run_command([
                "powershell",
                "-NoProfile",
                "-Command",
                "(Get-Service | "
                "Where-Object {$_.Status -eq 'Running'}).Count"
            ])

            if result.returncode == 0:
                return int(result.stdout.strip())

        elif system == "Linux":
            if not shutil.which("systemctl"):
                print("Warning: systemctl is unavailable.")
                return 0

            result = run_command([
                "systemctl",
                "list-units",
                "--type=service",
                "--state=running",
                "--no-legend",
                "--no-pager"
            ])

            if result.returncode == 0:
                return sum(
                    1
                    for line in result.stdout.splitlines()
                    if line.strip()
                )

        elif system == "Darwin":
            result = run_command([
                "launchctl",
                "list"
            ])

            if result.returncode == 0:
                return sum(
                    1
                    for line in result.stdout.splitlines()
                    if line.strip()
                )

        print("Warning: Could not determine running service count.")
        return 0

    except (
        subprocess.SubprocessError,
        OSError,
        ValueError
    ) as error:
        print(f"Service check failed: {error}")
        return 0


def get_failed_login_attempts():
    """
    Count matching failed-login events from the last 30 seconds.

    Windows:
        Security Event ID 4625.

    Linux:
        Matching authentication messages in the systemd journal.

    Returns None if detection is unsupported or fails.
    """
    system = platform.system()

    if system == "Windows":
        powershell_script = r"""
        $startTime = (Get-Date).AddSeconds(-30)

        try {
            $events = @(
                Get-WinEvent -FilterHashtable @{
                    LogName = 'Security'
                    Id = 4625
                    StartTime = $startTime
                } -ErrorAction Stop
            )

            Write-Output $events.Count
            exit 0
        }
        catch {
            if ($_.FullyQualifiedErrorId -like '*NoMatchingEventsFound*') {
                Write-Output 0
                exit 0
            }

            [Console]::Error.WriteLine($_.Exception.Message)
            exit 1
        }
        """

        command = [
            "powershell",
            "-NoProfile",
            "-Command",
            powershell_script
        ]

    elif system == "Linux":
        if not shutil.which("journalctl"):
            print("Warning: journalctl is unavailable.")
            return None

        command = [
            "journalctl",
            "--since",
            "30 seconds ago",
            "--no-pager",
            "--output=cat"
        ]

    else:
        print(
            f"Failed-login detection is not implemented for {system}."
        )
        return None

    try:
        result = run_command(command)

        if result.returncode != 0:
            print(
                "Warning: Could not read authentication logs. "
                "Check permissions and log availability."
            )
            return None

        output = result.stdout.strip()

        if system == "Windows":
            if not output:
                return None

            return int(output.splitlines()[-1])

        keywords = (
            "failed password",
            "failed publickey",
            "authentication failure",
            "authentication failed",
            "failed login",
            "login failed"
        )

        return sum(
            1
            for line in output.splitlines()
            if any(keyword in line.lower() for keyword in keywords)
        )

    except (
        subprocess.SubprocessError,
        OSError,
        ValueError,
        IndexError
    ) as error:
        print(f"Failed-login detection failed: {error}")
        return None


def get_security_status():
    """Collect and combine the endpoint's security status."""
    firewall = check_firewall()
    open_ports = get_open_ports()
    running_services = get_running_services()
    failed_logins = get_failed_login_attempts()

    if not firewall:
        basic_security = "critical"
    elif failed_logins is None or failed_logins > 0:
        basic_security = "warning"
    else:
        basic_security = "secure"

    return {
        "firewall": firewall,
        "openPorts": open_ports,
        "runningServices": running_services,
        "failedLoginAttempts": failed_logins,
        "basicSecurity": basic_security
    }


if __name__ == "__main__":
    print("CyberSec Security Checks")
    print("========================")

    status = get_security_status()

    for key, value in status.items():
        print(f"{key}: {value}")