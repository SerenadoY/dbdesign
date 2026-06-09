import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useLayoutEffect, useContext } from "react";
import Editor from "./pages/Editor";
import BugReport from "./pages/BugReport";
import Templates from "./pages/Templates";
import SettingsContextProvider from "./context/SettingsContext";
import AuthContextProvider, { AuthContext } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import SharedDiagram from "./pages/SharedDiagram";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <SettingsContextProvider>
          <RestoreScroll />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/editor"
              element={<ProtectedRoute><Editor /></ProtectedRoute>}
            />
            <Route
              path="/editor/diagrams/:id"
              element={<ProtectedRoute><Editor /></ProtectedRoute>}
            />
            <Route path="/shared/:token" element={<SharedDiagram />} />
            <Route path="/editor/templates/:id" element={<Editor />} />
            <Route path="/bug-report" element={<BugReport />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SettingsContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
