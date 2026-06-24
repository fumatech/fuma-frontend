import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000/api/v1";
const API_ORIGIN = (() => {
  try {
    return new URL(BASE_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? new Intl.NumberFormat("en-IN").format(num) : "0";
};

const defaultRowFilter = (row, query, searchableFields) => {
  if (!query) return true;
  const lower = query.trim().toLowerCase();
  return searchableFields.some((field) => String(row[field] ?? "").toLowerCase().includes(lower));
};

const rowsForExport = (columns, rows) =>
  rows.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      const raw = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
      obj[col.label] = raw ?? "";
    });
    return obj;
  });

const exportCsv = (filename, columns, rows) => {
  const headers = columns.map((col) => col.label);
  const body = rowsForExport(columns, rows).map((row) =>
    headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportExcel = (filename, columns, rows) => {
  const worksheet = XLSX.utils.json_to_sheet(rowsForExport(columns, rows));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const exportPdf = (filename, title, columns, rows) => {
  const doc = new jsPDF("l", "pt", "a4");
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  const head = [columns.map((c) => c.label)];
  const body = rows.map((row) =>
    columns.map((col) => {
      const raw = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
      return String(raw ?? "");
    })
  );
  doc.autoTable({ head, body, startY: 60, styles: { fontSize: 8 } });
  doc.save(`${filename}.pdf`);
};

const WarehouseReportPage = ({
  title,
  endpointCandidates,
  columns,
  summaryCards,
  mapRow,
  searchableFields,
  defaultMovement = "all",
}) => {
  const location = useLocation();
  const isFumaMain = !location.pathname.startsWith("/warehouse");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [movementType, setMovementType] = useState(defaultMovement);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const warehouseAuth = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("warehouseAuth") || "{}");
    } catch {
      return {};
    }
  }, []);

  const warehouseId = warehouseAuth?.id || warehouseAuth?.warehouseId || 1;

  const buildUrls = useCallback(
    (targetPage = 1) =>
      endpointCandidates.map((endpoint) => {
        const path = endpoint.includes(":warehouseId") ? endpoint.replace(":warehouseId", warehouseId) : endpoint;
        const baseForPath = path.startsWith("/api/") ? API_ORIGIN : BASE_URL;
        const url = new URL(`${baseForPath}${path.startsWith("/") ? "" : "/"}${path}`);
        // Server-side friendly query params (backend may ignore, but ready when supported)
        url.searchParams.set("page", String(targetPage));
        url.searchParams.set("limit", String(entriesPerPage));
        if (search) url.searchParams.set("search", search);
        if (sku) url.searchParams.set("sku", sku);
        if (category) url.searchParams.set("category", category);
        if (status) url.searchParams.set("status", status);
        if (movementType && movementType !== "all") url.searchParams.set("type", movementType);
        if (fromDate) url.searchParams.set("from", fromDate);
        if (toDate) url.searchParams.set("to", toDate);
        return url.toString();
      }),
    [endpointCandidates, warehouseId, entriesPerPage, search, sku, category, status, movementType, fromDate, toDate]
  );

  const fetchData = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError("");

    const urls = buildUrls(targetPage);
    let loaded = false;

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const json = await response.json();
        const normalized = toArray(json).map(mapRow);
        setRows(normalized);
        loaded = true;
        break;
      } catch {
        // try next endpoint
      }
    }

    if (!loaded) {
      setRows([]);
      setError("Unable to load report data from configured endpoints.");
    }

    setLoading(false);
  }, [buildUrls, mapRow, page]);

  useEffect(() => {
    fetchData(1);
    setPage(1);
  }, [fetchData]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((row) => defaultRowFilter(row, search, searchableFields))
        .filter((row) => (movementType === "all" ? true : String(row.movementType || "").toLowerCase() === movementType.toLowerCase()))
        .filter((row) => {
          if (!fromDate && !toDate) return true;
          const d = new Date(row.movementDate || row.snapshotDate || row.batchDate || row.date || "");
          if (Number.isNaN(d.getTime())) return false;
          if (fromDate && d < new Date(fromDate)) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
          }
          return true;
        }),
    [rows, search, searchableFields, movementType, fromDate, toDate]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / entriesPerPage));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * entriesPerPage;
    return filteredRows.slice(start, start + entriesPerPage);
  }, [filteredRows, page, entriesPerPage]);
  const pageStart = filteredRows.length === 0 ? 0 : (page - 1) * entriesPerPage + 1;
  const pageEnd = Math.min(page * entriesPerPage, filteredRows.length);

  useEffect(() => {
    setPage(1);
  }, [search, sku, category, status, movementType, fromDate, toDate, entriesPerPage]);

  const summaryData = useMemo(() => summaryCards(rows, filteredRows), [rows, filteredRows, summaryCards]);
  const fileBase = title.replace(/\s+/g, "_");

  const content = (
    <div className="w-100" style={{ background: "#eef1f5", minHeight: "calc(100vh - 120px)", padding: "16px" }}>
      <section className="content-header" style={{ padding: "0 0 8px 0" }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>{title}</h3>
      </section>

      <section className="content">
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap" style={{ gap: 8 }}>
            <div>
              <h6 className="mb-1">Report Period</h6>
              <small className="text-muted">Select date range for report analysis</small>
            </div>
            <div className="d-flex flex-wrap" style={{ gap: 8 }}>
              <button className="btn btn-outline-primary btn-sm" onClick={() => { setFromDate(""); setToDate(""); }}>This Month</button>
              <button className="btn btn-outline-primary btn-sm" onClick={() => { setSearch(""); setSku(""); setCategory(""); setStatus(""); setMovementType("all"); setFromDate(""); setToDate(""); }}>Reset</button>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <h4 className="mb-0">Inventory Dashboard</h4>
            </div>
            <div className="row">
              {summaryData.map((card) => (
                <div className="col-xl-3 col-md-6 mb-3" key={card.label}>
                  <div className="border rounded p-3 h-100 bg-white">
                    <div className="text-muted small">{card.label}</div>
                    <div className="h4 mb-0">{loading ? "..." : card.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body d-flex align-items-center flex-wrap" style={{ gap: 8 }}>
            <label className="mb-0">Show</label>
            <select className="form-control form-control-sm" style={{ width: 80 }} value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>Entries</span>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportCsv(fileBase, columns, filteredRows)}>Export CSV</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportExcel(fileBase, columns, filteredRows)}>Export Excel</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>Print</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => exportPdf(fileBase, title, columns, filteredRows)}>Export PDF</button>
            <input className="form-control form-control-sm ml-auto" style={{ maxWidth: 260 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <input className="form-control form-control-sm" style={{ width: 140 }} placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
            <input className="form-control form-control-sm" style={{ width: 140 }} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
            <input className="form-control form-control-sm" style={{ width: 140 }} placeholder="Status" value={status} onChange={(e) => setStatus(e.target.value)} />
            <select className="form-control form-control-sm" style={{ width: 140 }} value={movementType} onChange={(e) => setMovementType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <input className="form-control form-control-sm" style={{ width: 140 }} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input className="form-control form-control-sm" style={{ width: 140 }} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <button className="btn btn-outline-primary btn-sm" onClick={() => fetchData(1)}>Refresh</button>
          </div>

          <div className="table-responsive">
            <table className="table mb-0">
              <thead style={{ background: "#0c4461", color: "white" }}>
                <tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={columns.length} className="text-center py-4">Loading...</td></tr>}
                {!loading && error && <tr><td colSpan={columns.length} className="text-center text-danger py-4">{error}</td></tr>}
                {!loading && !error && paginatedRows.length === 0 && <tr><td colSpan={columns.length} className="text-center py-5"><strong>No records found.</strong></td></tr>}
                {!loading && !error && paginatedRows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => {
                      const value = typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor];
                      return <td key={`${row.id}-${col.label}`}>{value ?? "-"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-footer d-flex align-items-center flex-wrap" style={{ rowGap: 8 }}>
            <small className="text-muted font-weight-bold">
              Showing {pageStart} to {pageEnd} of {formatNumber(filteredRows.length)} entries
            </small>
            <div className="d-flex align-items-center ml-auto" style={{ gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  padding: 0,
                  color: "#6c757d",
                  background: "#f8f9fa",
                }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fas fa-chevron-left" />
              </button>
              <button
                className="btn btn-sm"
                style={{
                  border: "1px solid #0c5a7e",
                  background: "#0c5a7e",
                  color: "#fff",
                  borderRadius: 10,
                  minWidth: 38,
                  height: 36,
                  fontWeight: 700,
                }}
              >
                {page}
              </button>
              <button
                className="btn btn-sm"
                style={{
                  border: "1px solid #dee2e6",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  padding: 0,
                  color: "#6c757d",
                  background: "#f8f9fa",
                }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <i className="fas fa-chevron-right" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  if (isFumaMain) {
    return <div className="content-wrapper">{content}</div>;
  }

  return content;
};

export { formatDate, formatNumber };
export default WarehouseReportPage;
