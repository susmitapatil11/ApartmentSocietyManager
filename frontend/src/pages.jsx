import React, { useState, useEffect } from "react";
import {
  ToastContext, useToast, ToastStack, Modal, Badge, Spinner, LoadingRow, EmptyState,
  StatCard, ProgressRow, money, formatDate, initials, TopBar
} from "./components.jsx";
import { Icon } from "./icons.jsx";
import { Api, saveSession } from "./api.js";

const STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  PENDING: "Pending"
};

function useList(fetcher, deps = []) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetcher()
      .then((data) => {
        if (alive) {
          setItems(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { items, setItems, loading, error, reload };
}

function PageContainer({ title, subtitle, actions, children }) {
  return (
    <React.Fragment>
      <TopBar title={title} subtitle={subtitle} actions={actions} />
      <div className="content">{children}</div>
    </React.Fragment>
  );
}

/* =============================== LOGIN =================================== */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@society.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await Api.login(email.trim(), password);
      saveSession(data);
      onLogin({ userId: data.userId, role: data.role, name: data.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(role) {
    if (role === "ADMIN") {
      setEmail("admin@society.com");
      setPassword("admin123");
    } else {
      setEmail("resident@society.com");
      setPassword("resident123");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-mark">
            <Icon name="building" size={20} />
          </span>
          <div>
            <div className="login-logo-title">Apartment Society Manager</div>
            <div className="login-logo-subtitle">Simple society management</div>
          </div>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to manage your society.</p>
        </div>

        {error && (
          <div className="error-banner">
            <Icon name="alert" size={15} /> {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? <Spinner /> : "Sign in"}
          </button>
        </form>

        <div className="demo-chips">
          <button className="demo-chip" onClick={() => fillDemo("ADMIN")} type="button">
            <Icon name="user" size={13} /> Use admin demo
          </button>
          <button className="demo-chip" onClick={() => fillDemo("RESIDENT")} type="button">
            <Icon name="user" size={13} /> Use resident demo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ ADMIN: DASHBOARD ============================= */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentBills, setRecentBills] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.all([Api.dashboard(), Api.bills.list(), Api.complaints.list()])
      .then(([dash, bills, complaints]) => {
        if (!alive) return;
        setStats(dash);
        setRecentBills(bills.filter((b) => b.status === "PENDING").slice(0, 5));
        setRecentComplaints(complaints.filter((c) => c.status !== "RESOLVED").slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageContainer title="Dashboard" subtitle="A quick look at how the society is running today.">
      {loading && <LoadingRow label="Loading dashboard…" />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && stats && (
        <React.Fragment>
          <div className="stat-grid">
            <StatCard icon="building" label="Total flats" value={stats.flats} tint="brass" />
            <StatCard icon="users" label="Residents" value={stats.residents} tint="blue" />
            <StatCard icon="receipt" label="Bills raised" value={stats.bills} tint="brass" />
            <StatCard icon="wallet" label="Bills pending" value={stats.pendingBills} tint="red" />
            <StatCard icon="alert" label="Complaints" value={stats.complaints} tint="blue" />
            <StatCard icon="alert" label="Open complaints" value={stats.openComplaints} tint="red" />
            <StatCard icon="chart" label="Expense entries" value={stats.expenses} tint="brass" />
            <StatCard icon="chart" label="Total expenses" value={money(stats.expenseAmount)} tint="green" />
          </div>

          <div className="panel-grid">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Society health</h3>
                  <div className="panel-sub">Bills settled and complaints resolved</div>
                </div>
              </div>
              <ProgressRow
                label="Bills paid"
                value={stats.bills - stats.pendingBills}
                total={stats.bills}
                color="var(--green)"
              />
              <ProgressRow
                label="Complaints resolved"
                value={stats.complaints - stats.openComplaints}
                total={stats.complaints}
                color="var(--blue)"
              />
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Needs attention</h3>
                  <div className="panel-sub">Pending bills &amp; open complaints</div>
                </div>
              </div>
              {recentBills.length === 0 && recentComplaints.length === 0 ? (
                <EmptyState icon="check" title="All caught up" sub="No pending bills or open complaints right now." />
              ) : (
                <ul className="mini-list">
                  {recentBills.map((b) => (
                    <li key={"b" + b.id}>
                      <div>
                        <div className="mi-title">{b.flat ? b.flat.flatNumber : "—"} · {b.month}</div>
                        <div className="mi-sub">Bill due {formatDate(b.dueDate)}</div>
                      </div>
                      <Badge status="PENDING" />
                    </li>
                  ))}
                  {recentComplaints.map((c) => (
                    <li key={"c" + c.id}>
                      <div>
                        <div className="mi-title">{c.title}</div>
                        <div className="mi-sub">{c.resident ? c.resident.name : "Resident"}</div>
                      </div>
                      <Badge status={c.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </React.Fragment>
      )}
    </PageContainer>
  );
}

/* ============================== ADMIN: FLATS =============================== */
function FlatsPage() {
  const toast = useToast();
  const { items: flats, loading, error, reload, setItems } = useList(Api.flats.list);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | flat-object being edited
  const [form, setForm] = useState({ flatNumber: "", block: "", floor: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setForm({ flatNumber: "", block: "", floor: "", type: "" });
    setModal("create");
  }
  function openEdit(flat) {
    setForm({ flatNumber: flat.flatNumber || "", block: flat.block || "", floor: flat.floor ?? "", type: flat.type || "" });
    setModal(flat);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    const payload = { flatNumber: form.flatNumber, block: form.block, floor: form.floor ? Number(form.floor) : null, type: form.type };
    try {
      if (modal === "create") {
        await Api.flats.create(payload);
        toast({ type: "success", title: "Flat added", message: `${payload.flatNumber} has been created.` });
      } else {
        await Api.flats.update(modal.id, payload);
        toast({ type: "success", title: "Flat updated" });
      }
      setModal(null);
      reload();
    } catch (err) {
      toast({ type: "error", title: "Couldn't save flat", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = flats.filter((f) => {
    const q = search.toLowerCase();
    return !q || (f.flatNumber || "").toLowerCase().includes(q) || (f.block || "").toLowerCase().includes(q) || (f.type || "").toLowerCase().includes(q);
  });

  return (
    <PageContainer
      title="Flats"
      subtitle={`${flats.length} flat${flats.length === 1 ? "" : "s"} registered in the society`}
      actions={
        <button className="btn btn-brass" onClick={openCreate}>
          <Icon name="plus" size={15} /> Add flat
        </button>
      }
    >
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input placeholder="Search flat, block or type…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="building" title="No flats found" sub="Try a different search, or add the first flat to get started." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Flat number</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td className="cell-strong">{f.flatNumber}</td>
                    <td>{f.block || "—"}</td>
                    <td>{f.floor ?? "—"}</td>
                    <td>{f.type || "—"}</td>
                    <td className="cell-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>
                        <Icon name="edit" size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "create" ? "Add a flat" : `Edit ${modal.flatNumber}`}
          onClose={() => setModal(null)}
          footer={
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" form="flat-form" disabled={submitting}>
                {submitting ? <Spinner /> : modal === "create" ? "Add flat" : "Save changes"}
              </button>
            </React.Fragment>
          }
        >
          <form id="flat-form" onSubmit={submit}>
            <div className="field">
              <label>Flat number</label>
              <input value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} placeholder="e.g. A-103" required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Block</label>
                <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="e.g. A" />
              </div>
              <div className="field">
                <label>Floor</label>
                <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. 3" />
              </div>
            </div>
            <div className="field">
              <label>Type</label>
              <input list="flat-types" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. 2 BHK" />
              <datalist id="flat-types">
                <option value="1 RK" />
                <option value="1 BHK" />
                <option value="2 BHK" />
                <option value="3 BHK" />
                <option value="4 BHK" />
                <option value="Penthouse" />
              </datalist>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}

/* ============================ ADMIN: RESIDENTS ============================== */
function ResidentsPage() {
  const toast = useToast();
  const { items: residents, loading, error, reload } = useList(Api.residents.list);
  const { items: flats } = useList(Api.flats.list);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", flatId: "" });
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setForm({ name: "", email: "", password: "", flatId: flats[0] ? String(flats[0].id) : "" });
    setModal("create");
  }
  function openEdit(r) {
    setForm({ name: r.name || "", email: r.email || "", password: "", flatId: r.flat ? String(r.flat.id) : "" });
    setModal(r);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.flatId) {
      toast({ type: "error", title: "Select a flat", message: "Every resident needs a flat assigned." });
      return;
    }
    setSubmitting(true);
    const payload = { name: form.name, email: form.email, password: form.password || null, flatId: Number(form.flatId) };
    try {
      if (modal === "create") {
        if (!form.password) {
          toast({ type: "error", title: "Password required" });
          setSubmitting(false);
          return;
        }
        await Api.residents.create(payload);
        toast({ type: "success", title: "Resident added", message: `${payload.name} can now sign in.` });
      } else {
        await Api.residents.update(modal.id, payload);
        toast({ type: "success", title: "Resident updated" });
      }
      setModal(null);
      reload();
    } catch (err) {
      toast({ type: "error", title: "Couldn't save resident", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = residents.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.flat && r.flat.flatNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageContainer
      title="Residents"
      subtitle={`${residents.length} resident account${residents.length === 1 ? "" : "s"}`}
      actions={
        flats.length > 0 && (
          <button className="btn btn-brass" onClick={openCreate}>
            <Icon name="plus" size={15} /> Add resident
          </button>
        )
      }
    >
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input placeholder="Search name, email or flat…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="users" title="No residents found" sub="Add a flat first, then create resident accounts for it." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Email</th>
                  <th>Flat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="cell-strong" style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                          {initials(r.name)}
                        </span>
                        {r.name}
                      </div>
                    </td>
                    <td className="cell-muted">{r.email}</td>
                    <td>{r.flat ? `${r.flat.flatNumber}${r.flat.block ? " · " + r.flat.block : ""}` : "—"}</td>
                    <td className="cell-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                        <Icon name="edit" size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "create" ? "Add a resident" : `Edit ${modal.name}`}
          onClose={() => setModal(null)}
          footer={
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" form="resident-form" disabled={submitting}>
                {submitting ? <Spinner /> : modal === "create" ? "Add resident" : "Save changes"}
              </button>
            </React.Fragment>
          }
        >
          <form id="resident-form" onSubmit={submit}>
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>{modal === "create" ? "Password" : "New password"}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={modal === "create" ? "" : "Leave blank to keep current password"}
                required={modal === "create"}
              />
            </div>
            <div className="field">
              <label>Flat</label>
              <select value={form.flatId} onChange={(e) => setForm({ ...form, flatId: e.target.value })} required>
                <option value="" disabled>
                  Select a flat
                </option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flatNumber} {f.block ? `(Block ${f.block})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}

/* =============================== ADMIN: BILLS ================================ */
function BillsPage() {
  const toast = useToast();
  const { items: bills, loading, error, reload, setItems } = useList(Api.bills.list);
  const { items: flats } = useList(Api.flats.list);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ flatId: "", month: "", amount: "", dueDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  function openCreate() {
    setForm({ flatId: flats[0] ? String(flats[0].id) : "", month: "", amount: "", dueDate: "" });
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Api.bills.create({
        flatId: Number(form.flatId),
        month: form.month,
        amount: Number(form.amount),
        dueDate: form.dueDate,
      });
      toast({ type: "success", title: "Bill generated", message: `${form.month} bill created.` });
      setModal(false);
      reload();
    } catch (err) {
      toast({ type: "error", title: "Couldn't generate bill", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(bill, status) {
    if (status === bill.status) return;
    setUpdatingId(bill.id);
    try {
      const updated = await Api.bills.setStatus(bill.id, status);
      setItems((prev) => prev.map((b) => (b.id === bill.id ? updated : b)));
      toast({ type: "success", title: "Bill status updated", message: `${bill.month} marked as ${STATUS_LABELS[status]}.` });
    } catch (err) {
      toast({ type: "error", title: "Couldn't update status", message: err.message });
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = bills.filter((b) => {
    if (tab !== "ALL" && b.status !== tab) return false;
    const q = search.toLowerCase();
    return !q || (b.flat && b.flat.flatNumber || "").toLowerCase().includes(q) || (b.month || "").toLowerCase().includes(q);
  });

  return (
    <PageContainer
      title="Maintenance bills"
      subtitle={`${bills.length} bill${bills.length === 1 ? "" : "s"} raised across all flats`}
      actions={
        flats.length > 0 && (
          <button className="btn btn-brass" onClick={openCreate}>
            <Icon name="plus" size={15} /> Generate bill
          </button>
        )
      }
    >
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input placeholder="Search flat or month…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="tabs">
            {["ALL", "PENDING", "PAID"].map((t) => (
              <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                {t === "ALL" ? "All" : STATUS_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="receipt" title="No bills found" sub="Generate a maintenance bill for a flat to get started." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Flat</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-strong">{b.flat ? b.flat.flatNumber : "—"}</td>
                    <td>{b.month}</td>
                    <td>{money(b.amount)}</td>
                    <td className="cell-muted">{formatDate(b.dueDate)}</td>
                    <td>
                      <select
                        className="status-select"
                        value={b.status}
                        disabled={updatingId === b.id}
                        onChange={(e) => changeStatus(b, e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Generate a maintenance bill"
          onClose={() => setModal(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" form="bill-form" disabled={submitting}>
                {submitting ? <Spinner /> : "Generate bill"}
              </button>
            </React.Fragment>
          }
        >
          <form id="bill-form" onSubmit={submit}>
            <div className="field">
              <label>Flat</label>
              <select value={form.flatId} onChange={(e) => setForm({ ...form, flatId: e.target.value })} required>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flatNumber} {f.block ? `(Block ${f.block})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Billing month</label>
              <input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} placeholder="e.g. October 2026" required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label>Due date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}

/* ============================== ADMIN: PAYMENTS ============================== */
function PaymentsPage() {
  const toast = useToast();
  const { items: payments, loading, error, reload } = useList(Api.payments.list);
  const { items: flats } = useList(Api.flats.list);
  const { items: bills } = useList(Api.bills.list);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ flatId: "", billId: "", amount: "", paymentDate: "", mode: "UPI", referenceNumber: "" });
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setForm({ flatId: flats[0] ? String(flats[0].id) : "", billId: "", amount: "", paymentDate: "", mode: "UPI", referenceNumber: "" });
    setModal(true);
  }

  const billsForFlat = bills.filter((b) => form.flatId && b.flat && String(b.flat.id) === String(form.flatId) && b.status === "PENDING");

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Api.payments.create({
        flatId: Number(form.flatId),
        billId: form.billId ? Number(form.billId) : null,
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        mode: form.mode,
        referenceNumber: form.referenceNumber || null,
      });
      toast({ type: "success", title: "Payment recorded", message: form.billId ? "Linked bill marked as paid." : undefined });
      setModal(false);
      reload();
    } catch (err) {
      toast({ type: "error", title: "Couldn't record payment", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (p.flat && p.flat.flatNumber || "").toLowerCase().includes(q) ||
      (p.mode || "").toLowerCase().includes(q) ||
      (p.referenceNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageContainer
      title="Payments"
      subtitle={`${payments.length} payment${payments.length === 1 ? "" : "s"} recorded`}
      actions={
        flats.length > 0 && (
          <button className="btn btn-brass" onClick={openCreate}>
            <Icon name="plus" size={15} /> Record payment
          </button>
        )
      }
    >
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input placeholder="Search flat, mode or reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="wallet" title="No payments yet" sub="Record a payment once a resident pays a bill." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Flat</th>
                  <th>For bill</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-strong">{p.flat ? p.flat.flatNumber : "—"}</td>
                    <td className="cell-muted">{p.bill ? p.bill.month : "General payment"}</td>
                    <td>{money(p.amount)}</td>
                    <td className="cell-muted">{formatDate(p.paymentDate)}</td>
                    <td>{p.mode || "—"}</td>
                    <td className="cell-muted">{p.referenceNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Record a payment"
          onClose={() => setModal(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" form="payment-form" disabled={submitting}>
                {submitting ? <Spinner /> : "Record payment"}
              </button>
            </React.Fragment>
          }
        >
          <form id="payment-form" onSubmit={submit}>
            <div className="field">
              <label>Flat</label>
              <select value={form.flatId} onChange={(e) => setForm({ ...form, flatId: e.target.value, billId: "" })} required>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flatNumber} {f.block ? `(Block ${f.block})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Apply to bill (optional)</label>
              <select value={form.billId} onChange={(e) => setForm({ ...form, billId: e.target.value })}>
                <option value="">No specific bill — general payment</option>
                {billsForFlat.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.month} — {money(b.amount)}
                  </option>
                ))}
              </select>
              {form.flatId && billsForFlat.length === 0 && <div className="hint">No pending bills for this flat.</div>}
            </div>
            <div className="field-row">
              <div className="field">
                <label>Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label>Payment date</label>
                <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Mode</label>
                <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Card</option>
                </select>
              </div>
              <div className="field">
                <label>Reference no. (optional)</label>
                <input value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} placeholder="e.g. UPI ref / cheque no." />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}

/* ============================ COMPLAINTS (both roles) ========================= */
function ComplaintsPage({ role }) {
  const toast = useToast();
  const { items: complaints, loading, error, reload, setItems } = useList(Api.complaints.list);
  const [tab, setTab] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Api.complaints.create(form);
      toast({ type: "success", title: "Complaint raised", message: "The admin has been notified." });
      setModal(false);
      setForm({ title: "", description: "" });
      reload();
    } catch (err) {
      toast({ type: "error", title: "Couldn't raise complaint", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(complaint, status) {
    if (status === complaint.status) return;
    setUpdatingId(complaint.id);
    try {
      const updated = await Api.complaints.setStatus(complaint.id, status);
      setItems((prev) => prev.map((c) => (c.id === complaint.id ? updated : c)));
      toast({ type: "success", title: "Complaint updated", message: `Marked as ${STATUS_LABELS[status]}.` });
    } catch (err) {
      toast({ type: "error", title: "Couldn't update complaint", message: err.message });
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = complaints.filter((c) => tab === "ALL" || c.status === tab);
  const isAdmin = role === "ADMIN";

  return (
    <PageContainer
      title="Complaints"
      subtitle={isAdmin ? `${complaints.length} complaint${complaints.length === 1 ? "" : "s"} from residents` : "Raise an issue and track its progress"}
      actions={
        !isAdmin && (
          <button className="btn btn-brass" onClick={() => setModal(true)}>
            <Icon name="plus" size={15} /> Raise complaint
          </button>
        )
      }
    >
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="tabs">
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((t) => (
              <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                {t === "ALL" ? "All" : STATUS_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="alert"
            title="No complaints here"
            sub={isAdmin ? "Nothing in this category right now." : "Raise a complaint and the admin team will take a look."}
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Resident</th>}
                  <th>Title</th>
                  <th>Description</th>
                  <th>Raised</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    {isAdmin && <td className="cell-strong">{c.resident ? c.resident.name : "—"}</td>}
                    <td className="cell-strong">{c.title}</td>
                    <td className="cell-muted" style={{ maxWidth: 260, cursor: "pointer" }} onClick={() => setViewing(c)}>
                      {(c.description || "").length > 60 ? c.description.slice(0, 60) + "…" : c.description || "—"}
                    </td>
                    <td className="cell-muted">{formatDate(c.createdAt)}</td>
                    <td>
                      {isAdmin ? (
                        <select
                          className="status-select"
                          value={c.status}
                          disabled={updatingId === c.id}
                          onChange={(e) => changeStatus(c, e.target.value)}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      ) : (
                        <Badge status={c.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Raise a complaint"
          onClose={() => setModal(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" form="complaint-form" disabled={submitting}>
                {submitting ? <Spinner /> : "Submit complaint"}
              </button>
            </React.Fragment>
          }
        >
          <form id="complaint-form" onSubmit={submit}>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Leaking pipe in parking area" required />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add any details that will help resolve this faster." required />
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} footer={<button className="btn btn-ghost" onClick={() => setViewing(null)}>Close</button>}>
          {isAdmin && (
            <p style={{ marginBottom: 12, fontSize: 13, color: "var(--muted)" }}>
              Raised by <b style={{ color: "var(--ink)" }}>{viewing.resident ? viewing.resident.name : "—"}</b> on {formatDate(viewing.createdAt)}
            </p>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{viewing.description || "No description provided."}</p>
          <div style={{ marginTop: 14 }}>
            <Badge status={viewing.status} />
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

/* ============================== ADMIN: EXPENSES ============================== */
function ExpensesPage() {
  const toast = useToast();
  const { items: expenses, loading, error, reload } = useList(Api.expenses.list);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", amount: "", expenseDate: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  function openCreate() {
    setForm({ title: "", category: "", amount: "", expenseDate: "", description: "" });
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Api.expenses.create({
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        description: form.description || null,
      });
      toast({ type: "success", title: "Expense added" });
      setModal(false);
      reload();
    } catch (err) {
      toast({ type: "error", title: "Couldn't add expense", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    return !q || (e.title || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q);
  });

  return (
    <PageContainer
      title="Expenses"
      subtitle={`${expenses.length} entr${expenses.length === 1 ? "y" : "ies"} · ${money(total)} total spent`}
      actions={
        <button className="btn btn-brass" onClick={openCreate}>
          <Icon name="plus" size={15} /> Add expense
        </button>
      }
    >
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input placeholder="Search title or category…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="chart" title="No expenses logged" sub="Track society spending — repairs, housekeeping, utilities and more." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="cell-strong">{e.title}</td>
                    <td>
                      <span className="badge badge-brass">{e.category || "General"}</span>
                    </td>
                    <td>{money(e.amount)}</td>
                    <td className="cell-muted">{formatDate(e.expenseDate)}</td>
                    <td className="cell-muted">{e.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title="Add an expense"
          onClose={() => setModal(false)}
          footer={
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" form="expense-form" disabled={submitting}>
                {submitting ? <Spinner /> : "Add expense"}
              </button>
            </React.Fragment>
          }
        >
          <form id="expense-form" onSubmit={submit}>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lift servicing" required />
            </div>
            <div className="field">
              <label>Category</label>
              <input
                list="expense-categories"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Maintenance"
                required
              />
              <datalist id="expense-categories">
                <option value="Maintenance" />
                <option value="Security" />
                <option value="Housekeeping" />
                <option value="Utilities" />
                <option value="Repairs" />
                <option value="Landscaping" />
                <option value="Other" />
              </datalist>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
              </div>
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any extra detail worth noting" />
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}

/* ============================ RESIDENT: DASHBOARD ============================= */
function ResidentDashboard({ session }) {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([Api.bills.list(), Api.payments.list(), Api.complaints.list()])
      .then(([b, p, c]) => {
        if (!alive) return;
        setBills(b);
        setPayments(p);
        setComplaints(c);
        setLoading(false);
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const pendingBills = bills.filter((b) => b.status === "PENDING");
  const totalDue = pendingBills.reduce((s, b) => s + Number(b.amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const openComplaints = complaints.filter((c) => c.status !== "RESOLVED");

  return (
    <PageContainer title={`Hi, ${session.name.split(" ")[0]}`} subtitle="Here's what's happening with your flat.">
      {loading && <LoadingRow />}
      {error && <div className="error-banner">{error}</div>}
      {!loading && !error && (
        <React.Fragment>
          <div className="stat-grid">
            <StatCard icon="receipt" label="Bills due" value={money(totalDue)} tint="red" />
            <StatCard icon="wallet" label="Total paid" value={money(totalPaid)} tint="green" />
            <StatCard icon="receipt" label="Bills pending" value={pendingBills.length} tint="brass" />
            <StatCard icon="alert" label="Open complaints" value={openComplaints.length} tint="blue" />
          </div>

          <div className="panel-grid">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Recent bills</h3>
                  <div className="panel-sub">Your latest maintenance bills</div>
                </div>
              </div>
              {bills.length === 0 ? (
                <EmptyState icon="receipt" title="No bills yet" sub="Bills raised for your flat will show up here." />
              ) : (
                <ul className="mini-list">
                  {bills.slice(0, 5).map((b) => (
                    <li key={b.id}>
                      <div>
                        <div className="mi-title">{b.month}</div>
                        <div className="mi-sub">{money(b.amount)} · due {formatDate(b.dueDate)}</div>
                      </div>
                      <Badge status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Your complaints</h3>
                  <div className="panel-sub">Status of what you've raised</div>
                </div>
              </div>
              {complaints.length === 0 ? (
                <EmptyState icon="alert" title="Nothing raised" sub="Raise a complaint from the Complaints tab any time." />
              ) : (
                <ul className="mini-list">
                  {complaints.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <div>
                        <div className="mi-title">{c.title}</div>
                        <div className="mi-sub">{formatDate(c.createdAt)}</div>
                      </div>
                      <Badge status={c.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </React.Fragment>
      )}
    </PageContainer>
  );
}

/* ============================== RESIDENT: MY BILLS ============================= */
function MyBillsPage() {
  const { items: bills, loading, error } = useList(Api.bills.list);
  const [tab, setTab] = useState("ALL");
  const filtered = bills.filter((b) => tab === "ALL" || b.status === tab);
  const hasPending = bills.some((b) => b.status === "PENDING");

  return (
    <PageContainer title="My bills" subtitle="Maintenance bills raised for your flat">
      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="tabs">
            {["ALL", "PENDING", "PAID"].map((t) => (
              <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                {t === "ALL" ? "All" : STATUS_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="receipt" title="No bills here" sub="Nothing in this category yet." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-strong">{b.month}</td>
                    <td>{money(b.amount)}</td>
                    <td className="cell-muted">{formatDate(b.dueDate)}</td>
                    <td>
                      <Badge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasPending && (
        <div className="info-note">
          <Icon name="info" size={15} />
          <span>You have pending bills. Payments are recorded by the society office once received — reach out to them to settle a bill.</span>
        </div>
      )}
    </PageContainer>
  );
}

/* ============================ RESIDENT: MY PAYMENTS ============================ */
function MyPaymentsPage() {
  const { items: payments, loading, error } = useList(Api.payments.list);

  return (
    <PageContainer title="My payments" subtitle="Every payment recorded against your flat">
      <div className="table-card">
        {loading ? (
          <LoadingRow />
        ) : error ? (
          <div className="error-banner" style={{ margin: 20 }}>
            {error}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon="wallet" title="No payments yet" sub="Payments made against your bills will appear here." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>For bill</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-muted">{formatDate(p.paymentDate)}</td>
                    <td className="cell-strong">{p.bill ? p.bill.month : "General payment"}</td>
                    <td>{money(p.amount)}</td>
                    <td>{p.mode || "—"}</td>
                    <td className="cell-muted">{p.referenceNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

/* ================================ RESIDENT: PROFILE ============================= */
function ProfilePage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Api.me()
      .then((data) => {
        if (alive) {
          setMe(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageContainer title="Profile" subtitle="Your account details">
      {loading ? (
        <LoadingRow />
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : (
        <React.Fragment>
          <div className="panel profile-card">
            <span className="avatar-lg">{initials(me.name)}</span>
            <div>
              <h3 style={{ fontSize: 18 }}>{me.name}</h3>
              <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 3 }}>{me.email}</p>
            </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <div className="pf-label">ROLE</div>
              <div className="pf-value">Resident</div>
            </div>
            <div className="profile-field">
              <div className="pf-label">FLAT NUMBER</div>
              <div className="pf-value">{me.flat ? me.flat.flatNumber : "—"}</div>
            </div>
            <div className="profile-field">
              <div className="pf-label">BLOCK</div>
              <div className="pf-value">{me.flat ? me.flat.block || "—" : "—"}</div>
            </div>
            <div className="profile-field">
              <div className="pf-label">FLOOR</div>
              <div className="pf-value">{me.flat ? me.flat.floor ?? "—" : "—"}</div>
            </div>
            <div className="profile-field">
              <div className="pf-label">FLAT TYPE</div>
              <div className="pf-value">{me.flat ? me.flat.type || "—" : "—"}</div>
            </div>
          </div>

          <div className="info-note">
            <Icon name="info" size={15} />
            <span>Profile details are managed by the society admin. Contact your admin office to update your name, email or flat.</span>
          </div>
        </React.Fragment>
      )}
    </PageContainer>
  );
}

export { LoginPage, AdminDashboard, FlatsPage, ResidentsPage, BillsPage, PaymentsPage, ComplaintsPage, ExpensesPage, ResidentDashboard, MyBillsPage, MyPaymentsPage, ProfilePage };
