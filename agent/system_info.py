import platform
import socket


def get_hostname():
    """Return the current machine's hostname."""
    return socket.gethostname()


def get_os():
    """Return the operating system name used by the backend."""
    system = platform.system()

    if system == "Windows":
        return "Windows"

    if system == "Linux":
        return "Linux"

    if system == "Darwin":
        return "macOS"

    return system


def get_os_version():
    """Return a readable operating system version."""
    try:
        system = platform.system()
        release = platform.release()

        if system == "Windows":
            return release or platform.version()

        if system in ("Linux", "Darwin"):
            return release or platform.version()

        return platform.version() or "Unknown"

    except Exception:
        return "Unknown"


def get_ip_address():
    """
    Determine the local IP address selected for a network route.
    No application data is sent by this socket operation.
    """
    sock = None

    try:
        sock = socket.socket(
            socket.AF_INET,
            socket.SOCK_DGRAM
        )

        # The address is a documentation-only IP.
        # connect() selects a local interface without sending a packet.
        sock.connect(("192.0.2.1", 80))

        ip_address = sock.getsockname()[0]

        if ip_address and not ip_address.startswith("127."):
            return ip_address

    except OSError:
        pass

    finally:
        if sock is not None:
            sock.close()

    # Fallback for machines without a usable route.
    try:
        hostname = socket.gethostname()
        addresses = socket.getaddrinfo(
            hostname,
            None,
            socket.AF_INET
        )

        for address in addresses:
            ip_address = address[4][0]

            if not ip_address.startswith("127."):
                return ip_address

    except OSError:
        pass

    return "Unknown"


def get_system_info():
    """Return basic endpoint information."""
    return {
        "hostname": get_hostname(),
        "os": get_os(),
        "osVersion": get_os_version(),
        "ipAddress": get_ip_address()
    }


if __name__ == "__main__":
    print("CyberSec System Information")
    print("============================")

    for key, value in get_system_info().items():
        print(f"{key}: {value}")