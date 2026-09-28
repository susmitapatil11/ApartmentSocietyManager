/* =========================================================================
   api.js — talks to the Spring Boot backend.
   Matches: AuthController, FlatController, ResidentController, BillController,
   PaymentController, ComplaintController, ExpenseController, DashboardController.
   ========================================================================= */

const DEFAULT_API_BASE = "http://localhost:8083/api";

function getApiBase() {
  return localStorage.getItem("asm_api_base") || DEFAULT_API_BASE;
}
function setApiBase(url) {
  if (url && url.trim()) localStorage.setItem("asm_api_base", url.trim().replace(/\/$/, ""));
}

function getToken() {
  return localStorage.getItem("asm_token");
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("asm_session") || "null");
  } catch (e) {
    return null;
  }
}
function saveSession(loginResponse) {
  localStorage.setItem("asm_token", loginResponse.token);
  localStorage.setItem(
    "asm_session",
    JSON.stringify({
      userId: loginResponse.userId,
      role: loginResponse.role,
      name: loginResponse.name,
    })
  );
}
function clearSession() {
  localStorage.removeItem("asm_token");
  localStorage.removeItem("asm_session");
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let response;
  try {
    response = await fetch(getApiBase() + path, { ...options, headers });
  } catch (networkErr) {
    throw new Error(
      "Couldn't reach the server at " + getApiBase() + ". Check the API URL and that the backend is running."
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error((data && data.message) || "You're not authorized to do that.");
    }
    const message = (data && data.message) || (typeof data === "string" && data) || "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return data;
}

const Api = {
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  me: () => apiRequest("/residents/me"),

  flats: {
    list: () => apiRequest("/flats"),
    create: (flat) => apiRequest("/flats", { method: "POST", body: JSON.stringify(flat) }),
    update: (id, flat) => apiRequest(`/flats/${id}`, { method: "PUT", body: JSON.stringify(flat) }),
  },

  residents: {
    list: () => apiRequest("/residents"),
    create: (resident) => apiRequest("/residents", { method: "POST", body: JSON.stringify(resident) }),
    update: (id, resident) => apiRequest(`/residents/${id}`, { method: "PUT", body: JSON.stringify(resident) }),
  },

  bills: {
    list: () => apiRequest("/bills"),
    create: (bill) => apiRequest("/bills", { method: "POST", body: JSON.stringify(bill) }),
    setStatus: (id, status) => apiRequest(`/bills/${id}/status?status=${status}`, { method: "PUT" }),
  },

  payments: {
    list: () => apiRequest("/payments"),
    create: (payment) => apiRequest("/payments", { method: "POST", body: JSON.stringify(payment) }),
  },

  complaints: {
    list: () => apiRequest("/complaints"),
    create: (complaint) => apiRequest("/complaints", { method: "POST", body: JSON.stringify(complaint) }),
    setStatus: (id, status) =>
      apiRequest(`/complaints/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  },

  expenses: {
    list: () => apiRequest("/expenses"),
    create: (expense) => apiRequest("/expenses", { method: "POST", body: JSON.stringify(expense) }),
  },

  dashboard: () => apiRequest("/dashboard"),
};

export { DEFAULT_API_BASE, getApiBase, setApiBase, getToken, getSession, saveSession, clearSession, apiRequest, Api };
