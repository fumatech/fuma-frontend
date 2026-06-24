import React from "react";
import WarehouseReportPage, { formatDate, formatNumber } from "./components/WarehouseReportPage";

const columns = [
  { label: "Date", accessor: (row) => formatDate(row.movementDate) },
  { label: "SKU", accessor: "sku" },
  { label: "Product", accessor: "productName" },
  { label: "Type", accessor: "movementType" },
  { label: "Quantity", accessor: (row) => formatNumber(row.quantity) },
  { label: "Turnover Rate", accessor: (row) => `${Number(row.turnoverRate || 0).toFixed(2)}%` },
  { label: "Reference", accessor: "reference" },
];

const mapRow = (row, idx) => ({
  id: row.id || `turnover-${idx}`,
  movementDate: row.movementDate || row.date || row.createdAt,
  sku: row.sku || row.productSku || "-",
  productName: row.productName || row.product || `Product ${row.productId || ""}`.trim(),
  movementType: String(row.movementType || row.type || "-"),
  quantity: Number(row.quantity || row.qty || 0),
  turnoverRate: Number(row.turnoverRate || row.rate || 0),
  reference: row.reference || row.referenceNo || "-",
  remarks: row.remarks || row.note || "-",
});

const summaryCards = (_allRows, filteredRows) => {
  const avgTurnover = filteredRows.length
    ? filteredRows.reduce((sum, r) => sum + r.turnoverRate, 0) / filteredRows.length
    : 0;
  const fastMoving = filteredRows.filter((r) => r.turnoverRate >= 50).length;
  const slowMoving = filteredRows.filter((r) => r.turnoverRate > 0 && r.turnoverRate < 20).length;

  return [
    { label: "Records", value: formatNumber(filteredRows.length) },
    { label: "Avg Turnover", value: `${avgTurnover.toFixed(2)}%` },
    { label: "Fast Moving", value: formatNumber(fastMoving) },
    { label: "Slow Moving", value: formatNumber(slowMoving) },
  ];
};

const TurnoverAnalysis = () => (
  <WarehouseReportPage
    title="Warehouse Turnover Analysis"
    endpointCandidates={[
      "/api/reports/warehouse/:warehouseId/turnover",
      "/reports/warehouse/:warehouseId/turnover",
      "/warehouse/reports/:warehouseId/turnover",
    ]}
    columns={columns}
    summaryCards={summaryCards}
    mapRow={mapRow}
    searchableFields={["sku", "productName", "reference", "movementType"]}
  />
);

export default TurnoverAnalysis;
