import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
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
    location: true,
    unitSellingPrice: true,
    currentStock: true,
    currentStockValueByPurchase: true,
    currentStockValueBySale: true,
    potentialProfit: true,
    totalUnitSold: true,
    totalUnitTransferred: true,
    totalUnitAdjusted: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch("http://localhost:8080/inventory/getall");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setInventoryItems(data);
        } else {
          console.error("Fetched data is not an array");
          setInventoryItems([]);
        }
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        setInventoryItems([]);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchInventoryItems();
  }, []);

  const exportCSV = () => {
    const csvData = inventoryItems.map((item) => ({
      Action: item.action,
      SKU: item.sku,
      Product: item.product,
      Variation: item.variation,
      Category: item.category,
      Location: item.location,
      UnitSellingPrice: item.unitSellingPrice,
      CurrentStock: item.currentStock,
      CurrentStockValueByPurchase: item.currentStockValueByPurchase,
      CurrentStockValueBySale: item.currentStockValueBySale,
      PotentialProfit: item.potentialProfit,
      TotalUnitSold: item.totalUnitSold,
      TotalUnitTransferred: item.totalUnitTransferred,
      TotalUnitAdjusted: item.totalUnitAdjusted,
    }));

    const csv = [
      [
        "Action",
        "SKU",
        "Product",
        "Variation",
        "Category",
        "Location",
        "Unit Selling Price",
        "Current Stock",
        "Current Stock Value (By Purchase Price)",
        "Current Stock Value (By Sale Price)",
        "Potential Profit",
        "Total Unit Sold",
        "Total Unit Transferred",
        "Total Unit Adjusted",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "inventory.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      inventoryItems.map((item) => ({
        Action: item.action,
        SKU: item.sku,
        Product: item.product,
        Variation: item.variation,
        Category: item.category,
        Location: item.location,
        UnitSellingPrice: item.unitSellingPrice,
        CurrentStock: item.currentStock,
        CurrentStockValueByPurchase: item.currentStockValueByPurchase,
        CurrentStockValueBySale: item.currentStockValueBySale,
        PotentialProfit: item.potentialProfit,
        TotalUnitSold: item.totalUnitSold,
        TotalUnitTransferred: item.totalUnitTransferred,
        TotalUnitAdjusted: item.totalUnitAdjusted,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "inventory.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Action",
          "SKU",
          "Product",
          "Variation",
          "Category",
          "Location",
          "Unit Selling Price",
          "Current Stock",
          "Current Stock Value (By Purchase Price)",
          "Current Stock Value (By Sale Price)",
          "Potential Profit",
          "Total Unit Sold",
          "Total Unit Transferred",
          "Total Unit Adjusted",
        ],
      ],
      body: inventoryItems.map((item) => [
        item.action,
        item.sku,
        item.product,
        item.variation,
        item.category,
        item.location,
        item.unitSellingPrice,
        item.currentStock,
        item.currentStockValueByPurchase,
        item.currentStockValueBySale,
        item.potentialProfit,
        item.totalUnitSold,
        item.totalUnitTransferred,
        item.totalUnitAdjusted,
      ]),
    });
    doc.save("inventory.pdf");
  };

  const printData = () => {
    const tableContent = `
      <html>
        <head>
          <title>Print Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
            .footer-total { background-color: #e9ecef; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Inventory Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.action ? "<th>Actions</th>" : ""}
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
                    ? "<th>Current Stock Value (By Purchase Price)</th>"
                    : ""
                }
                ${
                  columnsVisibility.currentStockValueBySale
                    ? "<th>Current Stock Value (By Sale Price)</th>"
                    : ""
                }
                ${
                  columnsVisibility.potentialProfit
                    ? "<th>Potential Profit</th>"
                    : ""
                }
                ${
                  columnsVisibility.totalUnitSold
                    ? "<th>Total Unit Sold</th>"
                    : ""
                }
                ${
                  columnsVisibility.totalUnitTransferred
                    ? "<th>Total Unit Transferred</th>"
                    : ""
                }
                ${
                  columnsVisibility.totalUnitAdjusted
                    ? "<th>Total Unit Adjusted</th>"
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${inventoryItems
                .slice(startIndex, endIndex)
                .map(
                  (item) => `
                  <tr>
                    ${
                      columnsVisibility.action
                        ? `<td><button class="btn-delete">Delete</button></td>`
                        : ""
                    }
                    ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
                    ${
                      columnsVisibility.product
                        ? `<td>${item.product}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.variation
                        ? `<td>${item.variation}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.category
                        ? `<td>${item.category}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.location
                        ? `<td>${item.location}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.unitSellingPrice
                        ? `<td>${item.unitSellingPrice}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.currentStock
                        ? `<td>${item.currentStock}</td>`
                        : ""
                    }
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
                    ${
                      columnsVisibility.totalUnitSold
                        ? `<td>${item.totalUnitSold}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalUnitTransferred
                        ? `<td>${item.totalUnitTransferred}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalUnitAdjusted
                        ? `<td>${item.totalUnitAdjusted}</td>`
                        : ""
                    }
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const response = await fetch(
          `http://localhost:8080/inventory/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setInventoryItems((prevItems) =>
            prevItems.filter((item) => item.id !== id)
          );
          alert("Item deleted successfully!");
        } else {
          alert("Failed to delete item.");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error deleting item");
      }
    }
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">Stock Report</h1>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="card-body">
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
                          <th>Current Stock Value (By Purchase Price)</th>
                        )}
                        {columnsVisibility.currentStockValueBySale && (
                          <th>Current Stock Value (By Sale Price)</th>
                        )}
                        {columnsVisibility.potentialProfit && (
                          <th>Potential Profit</th>
                        )}
                        {columnsVisibility.totalUnitSold && (
                          <th>Total Unit Sold</th>
                        )}
                        {columnsVisibility.totalUnitTransferred && (
                          <th>Total Unit Transferred</th>
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
                                <button
                                  className="btn btn-delete btn-sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </td>
                            )}
                            {columnsVisibility.sku && <td>{item.sku}</td>}
                            {columnsVisibility.product && (
                              <td>{item.product}</td>
                            )}
                            {columnsVisibility.variation && (
                              <td>{item.variation}</td>
                            )}
                            {columnsVisibility.category && (
                              <td>{item.category}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>{item.location}</td>
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
                              <td>{item.totalUnitSold}</td>
                            )}
                            {columnsVisibility.totalUnitTransferred && (
                              <td>{item.totalUnitTransferred}</td>
                            )}
                            {columnsVisibility.totalUnitAdjusted && (
                              <td>{item.totalUnitAdjusted}</td>
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
