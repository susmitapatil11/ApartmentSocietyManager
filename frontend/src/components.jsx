/* =========================================================================
   components.js — shared building blocks used across pages
   ========================================================================= */

import React, { useState, useEffect, useContext, createContext, useMemo, useRef } from "react";
import { Icon } from "./icons.jsx";

/* ---------------------------- Toast system ------------------------------ */
const ToastContext = createContext(() => {});
function useToast() {
  return useContext(ToastContext);
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={"toast toast-" + t.type}>
          <Icon name={t.type === "success" ? "check" : t.type === "error" ? "alert" : "info"} size={16} />
          <div>
            <b>{t.title}</b>
            {t.message && <span>{t.message}</span>}
          </div>
          <button className="toast-dismiss" onClick={() => onDismiss(t.id)}>
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- Modal ---------------------------------- */
function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------- Badge ---------------------------------- */
const STATUS_STYLES = {
  PAID: "badge-green",
  PENDING: "badge-red",
  OPEN: "badge-red",
  IN_PROGRESS: "badge-blue",
  RESOLVED: "badge-green",
};
const STATUS_LABELS = {
  PAID: "Paid",
  PENDING: "Pending",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};
function Badge({ status }) {
  const cls = STATUS_STYLES[status] || "badge-brass";
  return (
    <span className={"badge " + cls}>
      <span className="badge-dot"></span>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/* ------------------------------ Small bits -------------------------------- */
function Spinner() {
  return <div className="spinner"></div>;
}
function LoadingRow({ label = "Loading…" }) {
  return (
    <div className="loading-row">
      <Spinner /> {label}
    </div>
  );
}
function EmptyState({ icon = "inbox", title, sub }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={34} />
      <div className="es-title">{title}</div>
      {sub && <div className="es-sub">{sub}</div>}
    </div>
  );
}
function StatCard({ icon, label, value, tint }) {
  const tints = {
    brass: { bg: "var(--brass-soft)", fg: "var(--brass-dark)" },
    green: { bg: "var(--green-soft)", fg: "#1F5C3B" },
    red: { bg: "var(--red-soft)", fg: "#7E3421" },
    blue: { bg: "var(--blue-soft)", fg: "#22456A" },
  };
  const t = tints[tint] || tints.brass;
  return (
    <div className="stat-card">
      <div className="top-row">
        <span className="icon-badge" style={{ background: t.bg, color: t.fg }}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
function ProgressRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="progress-row">
      <div className="pr-labels">
        <span className="l">{label}</span>
        <span className="v">
          {value} / {total}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + "%", background: color }}></div>
      </div>
    </div>
  );
}

function money(n) {
  const num = Number(n || 0);
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return d;
  }
}
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || "")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

/* --------------------------------- Sidebar --------------------------------- */
const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "flats", label: "Flats", icon: "building" },
  { key: "residents", label: "Residents", icon: "users" },
  { key: "bills", label: "Maintenance bills", icon: "receipt" },
  { key: "payments", label: "Payments", icon: "wallet" },
  { key: "complaints", label: "Complaints", icon: "alert" },
  { key: "expenses", label: "Expenses", icon: "chart" },
];
const RESIDENT_NAV = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "my-bills", label: "My bills", icon: "receipt" },
  { key: "my-payments", label: "My payments", icon: "wallet" },
  { key: "complaints", label: "Complaints", icon: "alert" },
  { key: "profile", label: "Profile", icon: "user" },
];

function Sidebar({ session, page, setPage, onLogout }) {
  const items = session.role === "ADMIN" ? ADMIN_NAV : RESIDENT_NAV;
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="mark">
          <Icon name="building" size={18} />
        </span>
        <div className="wordmark">
          Greenview Society
          <span>Management console</span>
        </div>
      </div>

      <div className="side-section-label">{session.role === "ADMIN" ? "Administration" : "My society"}</div>
      <ul className="side-nav">
        {items.map((item) => (
          <li key={item.key}>
            <button className={page === item.key ? "active" : ""} onClick={() => setPage(item.key)}>
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-user">
        <span className="avatar">{initials(session.name)}</span>
        <div className="who">
          <div className="name">{session.name}</div>
          <div className="role">{session.role === "ADMIN" ? "Administrator" : "Resident"}</div>
        </div>
        <button className="logout-btn" title="Log out" onClick={onLogout}>
          <Icon name="logout" size={17} />
        </button>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle, actions }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </div>
  );
}

function AppShell({ session, page, setPage, onLogout, children }) {
  return (
    <div className="shell">
      <Sidebar session={session} page={page} setPage={setPage} onLogout={onLogout} />
      <div className="main">{children}</div>
    </div>
  );
}

export { ToastContext, useToast, ToastStack, Modal, Badge, Spinner, LoadingRow, EmptyState, StatCard, ProgressRow, money, formatDate, initials, Sidebar, TopBar, AppShell };
