import React from "react";
import WarehouseReportPage, { formatDate, formatNumber } from "./components/WarehouseReportPage";

const columns = [
  { label: "Date", accessor: (row) => formatDate(row.snapshotDate || row.movementDate || row.date) },
  { label: "Total Inward", accessor: (row) => formatNumber(row.totalInward) },
  { label: "Total Outward", accessor: (row) => formatNumber(row.totalOutward) },
  { label: "Dispatches", accessor: (row) => formatNumber(row.totalDispatches) },
  { label: "Fulfillment %", accessor: (row) => `${Number(row.orderFulfillmentRate || 0).toFixed(2)}%` },
  { label: "Accuracy %", accessor: (row) => `${Number(row.accuracyRate || 0).toFixed(2)}%` },
];

const mapRow = (row, idx) => ({
  id: row.id || `analytics-${idx}`,
  snapshotDate: row.snapshotDate || row.date,
  movementDate: row.snapshotDate || row.date,
  totalInward: Number(row.totalInward || 0),
  totalOutward: Number(row.totalOutward || 0),
  totalDispatches: Number(row.totalDispatches || 0),
  orderFulfillmentRate: Number(row.orderFulfillmentRate || 0),
  accuracyRate: Number(row.accuracyRate || 0),
  movementType: "analytics",
  reference: row.reference || "",
  productName: row.productName || "",
  sku: row.sku || "",
});

const summaryCards = (_allRows, filteredRows) => {
  const totals = filteredRows.reduce(
    (acc, row) => {
      acc.inward += row.totalInward;
      acc.outward += row.totalOutward;
      acc.dispatches += row.totalDispatches;
      acc.fulfillment += row.orderFulfillmentRate;
      acc.accuracy += row.accuracyRate;
      return acc;
    },
    { inward: 0, outward: 0, dispatches: 0, fulfillment: 0, accuracy: 0 }
  );

  const count = filteredRows.length || 1;

  return [
    { label: "Snapshots", value: formatNumber(filteredRows.length) },
    { label: "Total Inward", value: formatNumber(totals.inward) },
    { label: "Total Outward", value: formatNumber(totals.outward) },
    { label: "Avg Accuracy", value: `${(totals.accuracy / count).toFixed(2)}%` },
  ];
};

const AnalyticsDashboard = () => (
  <WarehouseReportPage
    title="Warehouse Analytics Dashboard"
    endpointCandidates={[
      "/api/reports/warehouse/:warehouseId/performance",
      "/reports/warehouse/:warehouseId/performance",
      "/warehouse/reports/:warehouseId/performance",
    ]}
    columns={columns}
    summaryCards={summaryCards}
    mapRow={mapRow}
    searchableFields={["reference", "productName", "sku"]}
    defaultMovement="all"
  />
);

export default AnalyticsDashboard;
