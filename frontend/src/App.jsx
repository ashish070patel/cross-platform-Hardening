import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import PlatformLayout from "./pages/PlatformLayout";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Security from "./pages/Security";
import Alerts from "./pages/Alerts";

import "./App.css";


function NotFound() {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Page Not Found</h1>
                <p>
                    The page you requested does not exist.
                </p>
            </div>

            <div className="security-section">
                <p>
                    Use the sidebar to navigate to Dashboard,
                    Devices, Security, or Alerts.
                </p>
            </div>
        </div>
    );
}


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PlatformLayout />}>
                    <Route
                        path="/"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/devices"
                        element={<Devices />}
                    />

                    <Route
                        path="/security"
                        element={<Security />}
                    />

                    <Route
                        path="/alerts"
                        element={<Alerts />}
                    />

                    <Route
                        path="*"
                        element={<NotFound />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;