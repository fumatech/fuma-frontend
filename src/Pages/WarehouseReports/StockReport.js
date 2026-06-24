import React from "react";
import WarehouseReportPage, { formatDate, formatNumber } from "./components/WarehouseReportPage";

const columns = [
  { label: "Date", accessor: (row) => formatDate(row.movementDate) },
  { label: "SKU", accessor: "sku" },
  { label: "Product", accessor: "productName" },
  { label: "Type", accessor: "movementType" },
  { label: "Quantity", accessor: (row) => formatNumber(row.quantity) },
  { label: "Reference", accessor: "reference" },
  { label: "Remarks", accessor: "remarks" },
];

const mapRow = (row, idx) => ({
  id: row.id || `stock-${idx}`,
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
  const inward = filteredRows.filter((r) => r.movementType.toLowerCase() === "inward").reduce((sum, r) => sum + r.quantity, 0);
  const outward = filteredRows.filter((r) => r.movementType.toLowerCase() === "outward").reduce((sum, r) => sum + r.quantity, 0);
  return [
    { label: "Records", value: formatNumber(filteredRows.length) },
    { label: "Total Quantity", value: formatNumber(totalQty) },
    { label: "Inward Qty", value: formatNumber(inward) },
    { label: "Outward Qty", value: formatNumber(outward) },
  ];
};

const StockReport = () => (
  <WarehouseReportPage
    title="Warehouse Stock Report"
    endpointCandidates={[
      "/api/reports/warehouse/:warehouseId/stock",
      "/reports/warehouse/:warehouseId/stock",
      "/stock-report/report",
    ]}
    columns={columns}
    summaryCards={summaryCards}
    mapRow={mapRow}
    searchableFields={["sku", "productName", "reference", "remarks"]}
  />
);

export default StockReport;
