import React from "react";
import WarehouseReportPage, { formatDate, formatNumber } from "./components/WarehouseReportPage";

const columns = [
  { label: "Batch Date", accessor: (row) => formatDate(row.batchDate) },
  { label: "SKU", accessor: "sku" },
  { label: "Product", accessor: "productName" },
  { label: "Quantity", accessor: (row) => formatNumber(row.quantity) },
  { label: "Aging (Days)", accessor: (row) => formatNumber(row.agingDays) },
  { label: "Status", accessor: (row) => (row.agingDays > 90 ? "Critical" : row.agingDays > 60 ? "High" : row.agingDays > 30 ? "Medium" : "Healthy") },
];

const mapRow = (row, idx) => ({
  id: row.id || `aging-${idx}`,
  batchDate: row.batchDate || row.date || row.createdAt,
  movementDate: row.batchDate || row.date || row.createdAt,
  sku: row.sku || row.productSku || "-",
  productName: row.productName || row.product || `Product ${row.productId || ""}`.trim(),
  quantity: Number(row.quantity || row.qty || 0),
  agingDays: Number(row.agingDays || 0),
  movementType: "aging",
  reference: row.reference || row.referenceNo || "-",
});

const summaryCards = (_allRows, filteredRows) => {
  const critical = filteredRows.filter((r) => r.agingDays > 90).length;
  const high = filteredRows.filter((r) => r.agingDays > 60 && r.agingDays <= 90).length;
  const avgAging = filteredRows.length
    ? filteredRows.reduce((sum, r) => sum + r.agingDays, 0) / filteredRows.length
    : 0;

  return [
    { label: "Batches", value: formatNumber(filteredRows.length) },
    { label: "Critical Aging", value: formatNumber(critical) },
    { label: "High Aging", value: formatNumber(high) },
    { label: "Avg Aging", value: `${avgAging.toFixed(1)} days` },
  ];
};

const AgingReport = () => (
  <WarehouseReportPage
    title="Warehouse Aging Report"
    endpointCandidates={[
      "/api/reports/warehouse/:warehouseId/aging",
      "/reports/warehouse/:warehouseId/aging",
      "/warehouse/reports/:warehouseId/aging",
    ]}
    columns={columns}
    summaryCards={summaryCards}
    mapRow={mapRow}
    searchableFields={["sku", "productName", "reference"]}
    defaultMovement="all"
  />
);

export default AgingReport;
