import React from "react";
import WarehouseReportPage, { formatDate, formatNumber } from "./components/WarehouseReportPage";

const columns = [
  { label: "Date", accessor: (row) => formatDate(row.movementDate) },
  { label: "SKU", accessor: "sku" },
  { label: "Product", accessor: "productName" },
  { label: "Movement", accessor: "movementType" },
  { label: "Quantity", accessor: (row) => formatNumber(row.quantity) },
  { label: "Reference", accessor: "reference" },
  { label: "Remarks", accessor: "remarks" },
];

const mapRow = (row, idx) => ({
  id: row.id || `movement-${idx}`,
  movementDate: row.movementDate || row.date || row.createdAt,
  sku: row.sku || row.productSku || "-",
  productName: row.productName || row.product || `Product ${row.productId || ""}`.trim(),
  movementType: String(row.movementType || row.type || "-"),
  quantity: Number(row.quantity || row.qty || 0),
  reference: row.reference || row.referenceNo || "-",
  remarks: row.remarks || row.note || "-",
});

const summaryCards = (_allRows, filteredRows) => {
  const totalQty = filteredRows.reduce((sum, r) => sum + r.quantity, 0);
  const transfers = filteredRows.filter((r) => r.movementType.toLowerCase().includes("transfer")).length;
  return [
    { label: "Log Entries", value: formatNumber(filteredRows.length) },
    { label: "Total Movement Qty", value: formatNumber(totalQty) },
    { label: "Transfer Entries", value: formatNumber(transfers) },
    { label: "Latest Date", value: filteredRows[0] ? formatDate(filteredRows[0].movementDate) : "-" },
  ];
};

const MovementLogs = () => (
  <WarehouseReportPage
    title="Warehouse Movement Logs"
    endpointCandidates={[
      "/api/reports/warehouse/:warehouseId/movements",
      "/reports/warehouse/:warehouseId/movements",
      "/warehouse/reports/:warehouseId/movement-logs",
    ]}
    columns={columns}
    summaryCards={summaryCards}
    mapRow={mapRow}
    searchableFields={["sku", "productName", "reference", "remarks", "movementType"]}
  />
);

export default MovementLogs;
