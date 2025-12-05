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

const DetailedPurchase = () => {
  const [detailedPurchase, setDetailedPurchase] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    products: true,
    sku: true,
    customerName: true,
    invoiceNo: true,
    date: true,
    purchaseRefNo: true,
    supplierName: true,
    quantity: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchDetailedPurchase = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/DetailedPurchase/getall"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setDetailedPurchase(data);
        } else {
          console.error("Fetched data is not an array");
          setDetailedPurchase([]);
        }
      } catch (error) {
        console.error("Error fetching detailed purchase report:", error);
        setDetailedPurchase([]);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchDetailedPurchase();
  }, []);

  const exportCSV = () => {
    const csvData = detailedPurchase.map((item) => ({
      Products: item.products,
      SKU: item.sku,
      CustomerName: item.customerName,
      InvoiceNo: item.invoiceNo,
      Date: item.date,
      PurchaseRefNo: item.purchaseRefNo,
      SupplierName: item.supplierName,
      Quantity: item.quantity,
    }));

    const csv = [
      [
        "Products",
        "SKU",
        "Customer Name",
        "Invoice No",
        "Date",
        "Purchase Ref No",
        "Supplier Name",
        "Quantity",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "detailedPurchaseReport.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      detailedPurchase.map((item) => ({
        Products: item.products,
        SKU: item.sku,
        CustomerName: item.customerName,
        InvoiceNo: item.invoiceNo,
        Date: item.date,
        PurchaseRefNo: item.purchaseRefNo,
        SupplierName: item.supplierName,
        Quantity: item.quantity,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detailed Purchase Report");
    XLSX.writeFile(wb, "detailedPurchaseReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Products",
          "SKU",
          "Customer Name",
          "Invoice No",
          "Date",
          "Purchase Ref No",
          "Supplier Name",
          "Quantity",
        ],
      ],
      body: detailedPurchase.map((item) => [
        item.products,
        item.sku,
        item.customerName,
        item.invoiceNo,
        item.date,
        item.purchaseRefNo,
        item.supplierName,
        item.quantity,
      ]),
    });
    doc.save("detailedPurchaseReport.pdf");
  };

  const printTable = () => {
    // const printContent = document.getElementById("table-container").innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
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
          <h2>Detailed Purchase Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.products ? "<th>Products</th>" : ""}
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${
                  columnsVisibility.customerName ? "<th>Customer Name</th>" : ""
                }
                ${columnsVisibility.invoiceNo ? "<th>Invoice No</th>" : ""}
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${
                  columnsVisibility.purchaseRefNo
                    ? "<th>Purchase Ref No</th>"
                    : ""
                }
                ${
                  columnsVisibility.supplierName ? "<th>Supplier Name</th>" : ""
                }
                ${columnsVisibility.quantity ? "<th>Quantity</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${detailedPurchase
                .map(
                  (item) => `
                <tr>
                  ${
                    columnsVisibility.products
                      ? `<td>${item.products}</td>`
                      : ""
                  }
                  ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
                  ${
                    columnsVisibility.customerName
                      ? `<td>${item.customerName}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.invoiceNo
                      ? `<td>${item.invoiceNo}</td>`
                      : ""
                  }
                  ${columnsVisibility.date ? `<td>${item.date}</td>` : ""}
                  ${
                    columnsVisibility.purchaseRefNo
                      ? `<td>${item.purchaseRefNo}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.supplierName
                      ? `<td>${item.supplierName}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.quantity
                      ? `<td>${item.quantity}</td>`
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
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

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
                        {columnsVisibility.products && <th>Products</th>}
                        {columnsVisibility.sku && <th>SKU</th>}
                        {columnsVisibility.customerName && (
                          <th>Customer Name</th>
                        )}
                        {columnsVisibility.invoiceNo && <th>Invoice No</th>}
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.purchaseRefNo && (
                          <th>Purchase Ref No</th>
                        )}
                        {columnsVisibility.supplierName && (
                          <th>Supplier Name</th>
                        )}
                        {columnsVisibility.quantity && <th>Quantity</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {detailedPurchase
                        .slice(startIndex, endIndex)
                        .map((item) => (
                          <tr key={item.id}>
                            {columnsVisibility.products && (
                              <td>{item.products}</td>
                            )}
                            {columnsVisibility.sku && <td>{item.sku}</td>}
                            {columnsVisibility.customerName && (
                              <td>{item.customerName}</td>
                            )}
                            {columnsVisibility.invoiceNo && (
                              <td>{item.invoiceNo}</td>
                            )}
                            {columnsVisibility.date && <td>{item.date}</td>}
                            {columnsVisibility.purchaseRefNo && (
                              <td>{item.purchaseRefNo}</td>
                            )}
                            {columnsVisibility.supplierName && (
                              <td>{item.supplierName}</td>
                            )}
                            {columnsVisibility.quantity && (
                              <td>{item.quantity}</td>
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

export default DetailedPurchase;
