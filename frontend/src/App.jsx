import React, { useEffect, useState } from "react";
import { Api, clearSession, getSession, getToken } from "./api.js";
import { ToastContext, ToastStack, LoadingRow, AppShell } from "./components.jsx";
import {
  LoginPage,
  AdminDashboard,
  FlatsPage,
  ResidentsPage,
  BillsPage,
  PaymentsPage,
  ComplaintsPage,
  ExpensesPage,
  ResidentDashboard,
  MyBillsPage,
  MyPaymentsPage,
  ProfilePage,
} from "./pages.jsx";

function App() {
  const [session, setSession] = useState(undefined);
  const [page, setPage] = useState("dashboard");
  const [toasts, setToasts] = useState([]);

  const pushToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const stored = getSession();
    if (!stored || !getToken()) {
      setSession(null);
      return;
    }
    Api.me()
      .then((me) => {
        setSession({ userId: me.id, role: me.role, name: me.name, flat: me.flat });
      })
      .catch(() => {
        clearSession();
        setSession(null);
      });
  }, []);

  function handleLogin(data) {
    setPage("dashboard");
    setSession(data);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setPage("dashboard");
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingRow label="Loading Apartment Society Manager…" />
      </div>
    );
  }

  return (
    <ToastContext.Provider value={pushToast}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {!session ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <AppShell session={session} page={page} setPage={setPage} onLogout={handleLogout}>
          {renderPage(page, session)}
        </AppShell>
      )}
    </ToastContext.Provider>
  );
}

function renderPage(page, session) {
  if (session.role === "ADMIN") {
    switch (page) {
      case "dashboard": return <AdminDashboard />;
      case "flats": return <FlatsPage />;
      case "residents": return <ResidentsPage />;
      case "bills": return <BillsPage />;
      case "payments": return <PaymentsPage />;
      case "complaints": return <ComplaintsPage role="ADMIN" />;
      case "expenses": return <ExpensesPage />;
      default: return <AdminDashboard />;
    }
  }

  switch (page) {
    case "dashboard": return <ResidentDashboard session={session} />;
    case "my-bills": return <MyBillsPage />;
    case "my-payments": return <MyPaymentsPage />;
    case "complaints": return <ComplaintsPage role="RESIDENT" />;
    case "profile": return <ProfilePage />;
    default: return <ResidentDashboard session={session} />;
  }
}

export default App;
