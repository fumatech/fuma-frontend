import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { Link, useNavigate } from "react-router-dom";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";

const StockReport = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    sku: true,
    product: true,
    variation: true,
    category: true,
    location: false,
    unitSellingPrice: true,
    currentStock: true,
    currentStockValueByPurchase: true,
    currentStockValueBySale: true,
    potentialProfit: true,
    totalUnitSold: true,
    totalUnitAdjusted: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // ============================ FETCH API ============================
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-report/report`
        );

        const data = await response.json();
        if (Array.isArray(data)) {
          setInventoryItems(data);
        } else {
          setInventoryItems([]);
        }
      } catch (err) {
        console.error("Error fetching stock report:", err);
        setInventoryItems([]);
      }
    };

    fetchInventoryItems();
  }, []);

  useEffect(() => {
    if (inventoryItems.length > 0) {
      if ($.fn.dataTable.isDataTable("#example1")) {
        $("#example1").DataTable().destroy();
      }

      $("#example1").DataTable({
        paging: true,
        searching: true,
        ordering: true,
        lengthChange: false,
        pageLength: entriesPerPage,
      });
    }
  }, [inventoryItems, entriesPerPage]);

  // ============================ PAGINATION ============================
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ============================ EXPORTS ============================
  const exportCSV = () => {
    const csvData = inventoryItems.map((item) => ({
      SKU: item.sku,
      Product: item.productName,
      Variation: item.variationValue || "-",
      Category: item.category?.categoryName || "",
      Location: item.businessLocation?.locationName || "",
      UnitSellingPrice: item.unitSellingPrice,
      CurrentStock: item.currentStock,
      CurrentStockValueByPurchase: item.currentStockValueByPurchase,
      CurrentStockValueBySale: item.currentStockValueBySale,
      PotentialProfit: item.potentialProfit,
      TotalUnitSold: item.totalSold,
      TotalUnitAdjusted: item.totalAdjusted,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    saveAs(new Blob([csv], { type: "text/csv" }), "stock_report.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(inventoryItems);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StockReport");
    XLSX.writeFile(wb, "stock_report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "SKU",
          "Product",
          "Variation",
          "Category",
          "Location",
          "Unit SP",
          "Stock",
          "Stock Value (Purchase)",
          "Stock Value (Sale)",
          "Profit",
          "Sold",
          "Adjusted",
        ],
      ],
      body: inventoryItems.map((item) => [
        item.sku,
        item.productName,
        item.variationValue || "-",
        item.category?.categoryName || "",
        item.businessLocation?.locationName || "",
        item.unitSellingPrice,
        item.currentStock,
        item.currentStockValueByPurchase,
        item.currentStockValueBySale,
        item.potentialProfit,
        item.totalSold,
        item.totalAdjusted,
      ]),
    });

    doc.save("stock_report.pdf");
  };

  // ============================ PRINT ============================
  const printData = () => {
    const rows = inventoryItems
      .slice(startIndex, endIndex)
      .map(
        (item) => `
      <tr>
        ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
        ${columnsVisibility.product ? `<td>${item.productName}</td>` : ""}
        ${
          columnsVisibility.variation
            ? `<td>${item.variationValue || "-"}</td>`
            : ""
        }
        ${
          columnsVisibility.category
            ? `<td>${item.category?.categoryName || ""}</td>`
            : ""
        }
        ${
          columnsVisibility.location
            ? `<td>${item.businessLocation?.locationName || ""}</td>`
            : ""
        }
        ${
          columnsVisibility.unitSellingPrice
            ? `<td>${item.unitSellingPrice}</td>`
            : ""
        }
        ${columnsVisibility.currentStock ? `<td>${item.currentStock}</td>` : ""}
        ${
          columnsVisibility.currentStockValueByPurchase
            ? `<td>${item.currentStockValueByPurchase}</td>`
            : ""
        }
        ${
          columnsVisibility.currentStockValueBySale
            ? `<td>${item.currentStockValueBySale}</td>`
            : ""
        }
        ${
          columnsVisibility.potentialProfit
            ? `<td>${item.potentialProfit}</td>`
            : ""
        }
        ${columnsVisibility.totalUnitSold ? `<td>${item.totalSold}</td>` : ""}
        ${
          columnsVisibility.totalUnitAdjusted
            ? `<td>${item.totalAdjusted}</td>`
            : ""
        }
      </tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Report</title>
          <style>
            table { width:100%; border-collapse:collapse; }
            th, td { border:1px solid #ddd; padding:8px; }
            th { background:#f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Stock Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${columnsVisibility.product ? "<th>Product</th>" : ""}
                ${columnsVisibility.variation ? "<th>Variation</th>" : ""}
                ${columnsVisibility.category ? "<th>Category</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${
                  columnsVisibility.unitSellingPrice
                    ? "<th>Unit Selling Price</th>"
                    : ""
                }
                ${
                  columnsVisibility.currentStock ? "<th>Current Stock</th>" : ""
                }
                ${
                  columnsVisibility.currentStockValueByPurchase
                    ? "<th>Stock Value (Purchase)</th>"
                    : ""
                }
                ${
                  columnsVisibility.currentStockValueBySale
                    ? "<th>Stock Value (Sale)</th>"
                    : ""
                }
                ${columnsVisibility.potentialProfit ? "<th>Profit</th>" : ""}
                ${columnsVisibility.totalUnitSold ? "<th>Sold</th>" : ""}
                ${
                  columnsVisibility.totalUnitAdjusted ? "<th>Adjusted</th>" : ""
                }
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // ============================ DELETE ============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await fetch(`${process.env.REACT_APP_BASE_URL}/inventory/delete/${id}`, {
        method: "DELETE",
      });

      setInventoryItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // ============================ UI (UNCHANGED) ============================
  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <h1 className="all-heading">Stock Report</h1>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="card-body">
                {/* TOP BAR (EXPORT, ENTRIES, COLUMNS) — SAME DESIGN */}
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                      Show
                    </label>
                    <select
                      id="entriesPerPage"
                      className="form-control form-control-sm mr-2"
                      value={entriesPerPage}
                      onChange={handleEntriesChange}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                    Entries
                  </div>

                  <div className="col d-flex flex-wrap align-items-center">
                    <button
                      onClick={exportCSV}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-csv"></i> Export CSV
                    </button>

                    <button
                      onClick={exportExcel}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-excel"></i> Export Excel
                    </button>

                    <button
                      onClick={printData}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-print"></i> Print
                    </button>

                    <button
                      onClick={exportPDF}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-pdf"></i> Export PDF
                    </button>

                    <div className="dropdown mt-lg-2 mb-lg-2">
                      <button
                        className="btn Export-Btn dropdown-toggle"
                        type="button"
                        id="dropdownMenuButton"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="fa fa-columns"></i> Column Visibility
                      </button>
                      <div
                        className="dropdown-menu pointer-event"
                        aria-labelledby="dropdownMenuButton"
                      >
                        {Object.keys(columnsVisibility).map((col) => (
                          <div
                            key={col}
                            className="dropdown-item d-flex align-items-center"
                          >
                            <input
                              type="checkbox"
                              checked={columnsVisibility[col]}
                              onChange={() => toggleColumn(col)}
                              className="mr-2"
                            />
                            {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLE (DESIGN UNCHANGED) */}
                <div id="table-container" style={{ overflowX: "auto" }}>
                  <table
                    id="example1"
                    className="table table-bordered table-hover"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.action && <th>Actions</th>}
                        {columnsVisibility.sku && <th>SKU</th>}
                        {columnsVisibility.product && <th>Product</th>}
                        {columnsVisibility.variation && <th>Variation</th>}
                        {columnsVisibility.category && <th>Category</th>}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.unitSellingPrice && (
                          <th>Unit Selling Price</th>
                        )}
                        {columnsVisibility.currentStock && (
                          <th>Current Stock</th>
                        )}
                        {columnsVisibility.currentStockValueByPurchase && (
                          <th>Current Stock Value (By Purchase)</th>
                        )}
                        {columnsVisibility.currentStockValueBySale && (
                          <th>Current Stock Value (By Sale)</th>
                        )}
                        {columnsVisibility.potentialProfit && (
                          <th>Potential Profit</th>
                        )}
                        {columnsVisibility.totalUnitSold && (
                          <th>Total Unit Sold</th>
                        )}
                        {columnsVisibility.totalUnitAdjusted && (
                          <th>Total Unit Adjusted</th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {inventoryItems
                        .slice(startIndex, endIndex)
                        .map((item) => (
                          <tr key={item.id}>
                            {columnsVisibility.action && (
                              <td>
                                <td>
                                  <Link
                                    className="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-info tw-w-max"
                                    to={`/ProductStockHistory?productId=${item.productId}&variationId=${item.variationId}`}
                                  >
                                    <i className="fas fa-history"></i> Product
                                    stock history
                                  </Link>
                                </td>
                              </td>
                            )}

                            {columnsVisibility.sku && <td>{item.sku}</td>}
                            {columnsVisibility.product && (
                              <td>{item.productName}</td>
                            )}
                            {columnsVisibility.variation && (
                              <td>{item.variationValue || "-"}</td>
                            )}
                            {columnsVisibility.category && (
                              <td>{item.category}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>
                                {item.businessLocation?.locationName || ""}
                              </td>
                            )}
                            {columnsVisibility.unitSellingPrice && (
                              <td>{item.unitSellingPrice}</td>
                            )}
                            {columnsVisibility.currentStock && (
                              <td>{item.currentStock}</td>
                            )}
                            {columnsVisibility.currentStockValueByPurchase && (
                              <td>{item.currentStockValueByPurchase}</td>
                            )}
                            {columnsVisibility.currentStockValueBySale && (
                              <td>{item.currentStockValueBySale}</td>
                            )}
                            {columnsVisibility.potentialProfit && (
                              <td>{item.potentialProfit}</td>
                            )}
                            {columnsVisibility.totalUnitSold && (
                              <td>{item.totalSold}</td>
                            )}
                            {columnsVisibility.totalUnitAdjusted && (
                              <td>{item.totalAdjusted}</td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StockReport;
