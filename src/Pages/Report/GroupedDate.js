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

const GroupedDate = () => {
  const [groupedDate, setGroupedDate] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    products: true,
    sku: true,
    date: true,
    currentStock: true,
    totalUnitsSold: true,
    total: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);

  useEffect(() => {
    const fetchGroupedDate = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/reports/date-wise`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setGroupedDate(data);
        } else {
          console.error("Fetched data is not an array");
          setGroupedDate([]);
        }
      } catch (error) {
        console.error("Error fetching product sell report:", error);
        setGroupedDate([]);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchGroupedDate();
  }, []);

  const exportCSV = () => {
    const csvData = groupedDate.map((item) => ({
      Products: item.products,
      SKU: item.sku,
      Date: item.date,
      CurrentStock: item.currentStock,
      TotalUnitsSold: item.totalUnitsSold,
      Total: item.totalAmount,
    }));

    const csv = [
      ["Products", "SKU", "Date", "Current Stock", "Total Units Sold", "Total"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "groupedDateReport.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      groupedDate.map((item) => ({
        Products: item.products,
        SKU: item.sku,
        Date: item.date,
        CurrentStock: item.currentStock,
        TotalUnitsSold: item.totalUnitsSold,
        Total: item.totalAmount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grouped Date Report");
    XLSX.writeFile(wb, "groupedDateReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Products",
          "SKU",
          "Date",
          "Current Stock",
          "Total Units Sold",
          "Total",
        ],
      ],
      body: groupedDate.map((item) => [
        item.products,
        item.sku,
        item.date,
        item.currentStock,
        item.totalUnitsSold,
        item.totalAmount,
      ]),
    });
    doc.save("groupedDateReport.pdf");
  };

  const printTable = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const tableContent = `
      <html>
        <head>
          <title>Print Table</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Grouped Date Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.products ? "<th>Products</th>" : ""}
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${
                  columnsVisibility.currentStock ? "<th>Current Stock</th>" : ""
                }
                ${
                  columnsVisibility.totalUnitsSold
                    ? "<th>Total Units Sold</th>"
                    : ""
                }
                ${columnsVisibility.total ? "<th>Total</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${groupedDate
                .slice(
                  (currentPage - 1) * entriesPerPage,
                  currentPage * entriesPerPage
                )
                .map(
                  (item) => `
                <tr>
                  ${
                    columnsVisibility.products
                      ? `<td>${item.products}</td>`
                      : ""
                  }
                  ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
                  ${columnsVisibility.date ? `<td>${item.date}</td>` : ""}
                  ${
                    columnsVisibility.currentStock
                      ? `<td>${item.currentStock}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.totalUnitsSold
                      ? `<td>${item.totalUnitsSold}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.total
                      ? `<td>${item.totalAmount}</td>`
                      : ""
                  }
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const calculateTotals = () => {
    const displayedItems = groupedDate.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage
    );

    const totalUnits = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.totalUnitsSold) || 0),
      0
    );
    const totalPackets = Math.floor(totalUnits / 10);
    const totalAmount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.totalAmount) || 0),
      0
    );

    return { totalUnits, totalPackets, totalAmount };
  };

  const { totalUnits, totalPackets, totalAmount } = calculateTotals();

  return (
    <div className="wrapper">
      <div className="">
        <section className="content py-3">
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
                      onChange={(e) => {
                        setEntriesPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
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
                      onClick={printTable}
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
                              onChange={() =>
                                setColumnsVisibility((prev) => ({
                                  ...prev,
                                  [col]: !prev[col],
                                }))
                              }
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
                        {columnsVisibility.products && <th>Products</th>}
                        {columnsVisibility.sku && <th>SKU</th>}
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.currentStock && (
                          <th>Current Stock</th>
                        )}
                        {columnsVisibility.totalUnitsSold && (
                          <th>Total Units Sold</th>
                        )}
                        {columnsVisibility.total && <th>Total</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {groupedDate
                        .slice(
                          (currentPage - 1) * entriesPerPage,
                          currentPage * entriesPerPage
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            {columnsVisibility.products && (
                              <td>{item.productName}</td>
                            )}
                            {columnsVisibility.sku && <td>{item.sku}</td>}
                            {columnsVisibility.date && <td>{item.saleDate}</td>}
                            {columnsVisibility.currentStock && (
                              <td>{item.currentStock}</td>
                            )}
                            {columnsVisibility.totalUnitsSold && (
                              <td>{item.totalUnitsSold}</td>
                            )}
                            {columnsVisibility.total && (
                              <td>{item.totalAmount}</td>
                            )}
                          </tr>
                        ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray font-17 footer-total text-center">
                        <td colSpan="4" rowSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td
                          id="footer_total_grouped_sold"
                          rowSpan="1"
                          colSpan="1"
                        >
                          <p className="text-center">
                            <span
                              className="display_currency"
                              data-is_quantity="true"
                            >
                              {totalUnits}
                            </span>{" "}
                          </p>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="footer_grouped_subtotal"
                            data-currency_symbol="true"
                          >
                            ${totalAmount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
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

export default GroupedDate;
