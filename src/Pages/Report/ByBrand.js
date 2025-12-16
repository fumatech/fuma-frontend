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

const ByBrand = () => {
  const [byBrand, setByBrand] = useState([]);
  const [brandsMap, setBrandsMap] = useState({});

  const [columnsVisibility, setColumnsVisibility] = useState({
    brand: true,
    currentStock: true,
    totalUnitsSold: true,
    total: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/brands/getall`
        );
        const data = await res.json();

        // Create map: { "5": "FUMA-IGNYTE", "6": "FUMA-GENXT" }
        const map = {};
        data.forEach((b) => {
          map[b.id.toString()] = b.brandName;
        });

        setBrandsMap(map);
      } catch (err) {
        console.error("Error fetching brands", err);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchByBrand = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/reports/brand-wise`
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          const updatedData = data.map((item) => ({
            ...item,
            brandName: brandsMap[item.brand] || "Unknown Brand",
          }));

          setByBrand(updatedData);
        } else {
          setByBrand([]);
        }
      } catch (error) {
        console.error("Error fetching brand-wise report:", error);
        setByBrand([]);
      }
    };

    if (Object.keys(brandsMap).length > 0) {
      fetchByBrand();
    }
  }, [brandsMap]);

  const exportCSV = () => {
    const csvData = byBrand.map((item) => ({
      Brand: item.brand,
      CurrentStock: item.currentStock,
      TotalUnitsSold: item.totalUnitsSold,
      Total: item.totalAmount,
    }));

    const csv = [
      ["Brand", "Current Stock", "Total Units Sold", "Total"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "byBrandReport.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      byBrand.map((item) => ({
        Brand: item.brand,
        CurrentStock: item.currentStock,
        TotalUnitsSold: item.totalUnitsSold,
        Total: item.totalAmount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "By Brand Report");
    XLSX.writeFile(wb, "byBrandReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Brand", "Current Stock", "Total Units Sold", "Total"]],
      body: byBrand.map((item) => [
        item.brand,
        item.currentStock,
        item.totalUnitsSold,
        item.totalAmount,
      ]),
    });
    doc.save("byBrandReport.pdf");
  };

  const printTable = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const tableContent = `
      <html>
        <head>
          <title>Print Table</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Brand Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.brand ? "<th>Brand</th>" : ""}
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
              ${byBrand
                .map(
                  (item) => `
                  <tr>
                    ${columnsVisibility.brand ? `<td>${item.brand}</td>` : ""}
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
    const displayedItems = byBrand.slice(
      (currentPage - 1) * entriesPerPage,
      currentPage * entriesPerPage
    );

    const totalStock = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.currentStock) || 0),
      0
    );
    const totalUnitsSold = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.totalUnitsSold) || 0),
      0
    );
    const totalAmount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.totalAmount) || 0),
      0
    );

    return { totalStock, totalUnitsSold, totalAmount };
  };

  const { totalStock, totalUnitsSold, totalAmount } = calculateTotals();

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
                        {columnsVisibility.brand && <th>Brand</th>}
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
                      {byBrand
                        .slice(
                          (currentPage - 1) * entriesPerPage,
                          currentPage * entriesPerPage
                        )
                        .map((item) => (
                          <tr key={item.id}>
                            {columnsVisibility.brand && (
                              <td>{item.brandName}</td>
                            )}
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
                        <td rowSpan="1" colSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td
                          id="footer_psr_by_brand_total_stock"
                          rowSpan="1"
                          colSpan="1"
                        >
                          <p className="text-center">
                            <span
                              className="display_currency"
                              data-is_quantity="true"
                            >
                              {totalStock}
                            </span>{" "}
                            <br />
                          </p>
                        </td>
                        <td
                          id="footer_psr_by_brand_total_sold"
                          rowSpan="1"
                          colSpan="1"
                        >
                          <p className="text-center">
                            <span
                              className="display_currency"
                              data-is_quantity="true"
                            >
                              {totalUnitsSold}
                            </span>{" "}
                            <br />
                          </p>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="footer_psr_by_brand_total_sell"
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

export default ByBrand;
