import { NavLink } from "react-router-dom";

const navigationItems = [
    {
        label: "Dashboard",
        path: "/",
        end: true
    },
    {
        label: "Devices",
        path: "/devices"
    },
    {
        label: "Security",
        path: "/security"
    },
    {
        label: "Alerts",
        path: "/alerts"
    }
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>CyberSec</h2>
                <p>Security Platform</p>
            </div>

            <nav
                className="sidebar-nav"
                aria-label="Main navigation"
            >
                {navigationItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end || false}
                        className={({ isActive }) =>
                            isActive
                                ? "nav-item active"
                                : "nav-item"
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <span>OS Security Monitoring</span>
                <span>Agent Platform v1.0.0</span>
            </div>
        </aside>
    );
}

export default Sidebar;