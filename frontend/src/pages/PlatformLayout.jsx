import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function PlatformLayout() {
    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default PlatformLayout;