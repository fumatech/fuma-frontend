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

const ProductPurchaseReport = () => {
  const [ProductPurchaseReport, setProductPurchaseReport] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    product: true,
    sku: true,
    supplier: true,
    referenceNo: true,
    date: true,
    quantity: true,
    totalUnitAdjusted: true,
    unitPurchasePrice: true,
    subtotal: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchProductPurchaseReport = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/ProductPurchaseReport/getall`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setProductPurchaseReport(data);
        } else {
          console.error("Fetched data is not an array");
          setProductPurchaseReport([]);
        }
      } catch (error) {
        console.error("Error fetching report items:", error);
        setProductPurchaseReport([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchProductPurchaseReport();
  }, []);

  const exportCSV = () => {
    const csvData = ProductPurchaseReport.map((item) => ({
      Product: item.product,
      SKU: item.sku,
      Supplier: item.supplier,
      ReferenceNo: item.referenceNo,
      Date: item.date,
      Quantity: item.quantity,
      TotalUnitAdjusted: item.totalUnitAdjusted,
      UnitPurchasePrice: item.unitPurchasePrice,
      Subtotal: item.subtotal,
    }));

    const csv = [
      [
        "Product",
        "SKU",
        "Supplier",
        "Reference No",
        "Date",
        "Quantity",
        "Total Unit Adjusted",
        "Unit Purchase Price",
        "Subtotal",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "productPurchaseReport.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      ProductPurchaseReport.map((item) => ({
        Product: item.product,
        SKU: item.sku,
        Supplier: item.supplier,
        ReferenceNo: item.referenceNo,
        Date: item.date,
        Quantity: item.quantity,
        TotalUnitAdjusted: item.totalUnitAdjusted,
        UnitPurchasePrice: item.unitPurchasePrice,
        Subtotal: item.subtotal,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Items");
    XLSX.writeFile(wb, "productPurchaseReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Product",
          "SKU",
          "Supplier",
          "Reference No",
          "Date",
          "Quantity",
          "Total Unit Adjusted",
          "Unit Purchase Price",
          "Subtotal",
        ],
      ],
      body: ProductPurchaseReport.map((item) => [
        item.product,
        item.sku,
        item.supplier,
        item.referenceNo,
        item.date,
        item.quantity,
        item.totalUnitAdjusted,
        item.unitPurchasePrice,
        item.subtotal,
      ]),
    });
    doc.save("productPurchaseReport.pdf");
  };

  const printData = () => {
    const tableContent = `
      <html>
        <head>
          <title>Print Product Purchase Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
            .footer-total { background-color: #e9ecef; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <h2>Product Purchase Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.product ? "<th>Product</th>" : ""}
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${columnsVisibility.supplier ? "<th>Supplier</th>" : ""}
                ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${columnsVisibility.quantity ? "<th>Quantity</th>" : ""}
                ${
                  columnsVisibility.totalUnitAdjusted
                    ? "<th>Total Unit Adjusted</th>"
                    : ""
                }
                ${
                  columnsVisibility.unitPurchasePrice
                    ? "<th>Unit Purchase Price</th>"
                    : ""
                }
                ${columnsVisibility.subtotal ? "<th>Subtotal</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${ProductPurchaseReport.slice(startIndex, endIndex)
                .map(
                  (item) => `
                  <tr>
                    ${
                      columnsVisibility.product
                        ? `<td>${item.product}</td>`
                        : ""
                    }
                    ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
                    ${
                      columnsVisibility.supplier
                        ? `<td>${item.supplier}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.referenceNo
                        ? `<td>${item.referenceNo}</td>`
                        : ""
                    }
                    ${columnsVisibility.date ? `<td>${item.date}</td>` : ""}
                    ${
                      columnsVisibility.quantity
                        ? `<td>${item.quantity}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalUnitAdjusted
                        ? `<td>${item.totalUnitAdjusted}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.unitPurchasePrice
                        ? `<td>${item.unitPurchasePrice}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.subtotal
                        ? `<td>${item.subtotal}</td>`
                        : ""
                    }
                  </tr>
                `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="footer-total">
                <td colSpan="5"><strong>Total:</strong></td>
                <td>
                  <p class="text-left">
                    <small>
                      <span class="display_currency" data-is_quantity="true">
                        ${totalQuantity.toLocaleString()}
                      </span> Pc(s)
                      <br />
                      <span class="display_currency" data-is_quantity="true">
                        ${Math.ceil(
                          totalQuantity / 1000
                        ).toLocaleString()} packets
                      </span>
                      <br />
                    </small>
                  </p>
                </td>
                <td id="footer_total_adjusted"></td>
                <td></td>
                <td>
                  <span class="display_currency" id="footer_subtotal" data-currency_symbol="true">
                    $${totalSubtotal.toLocaleString()}
                  </span>
                </td>
              </tr>
            </tfoot>
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

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const calculateTotals = () => {
    const displayedItems = ProductPurchaseReport.slice(startIndex, endIndex);
    const totalQuantity = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.quantity) || 0),
      0
    );
    const totalUnitPurchasePrice = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.unitPurchasePrice) || 0),
      0
    );
    const totalSubtotal = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.subtotal) || 0),
      0
    );

    return {
      totalQuantity,
      totalUnitPurchasePrice,
      totalSubtotal,
    };
  };

  const { totalQuantity, totalUnitPurchasePrice, totalSubtotal } =
    calculateTotals();

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6 ">
                <h1 className="all-heading">Product Purchase Report</h1>
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
                          <div className="form-check" key={col}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={columnsVisibility[col]}
                              onChange={() => toggleColumn(col)}
                            />
                            <label className="form-check-label">{col}</label>
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
                    {" "}
                    <thead>
                      <tr>
                        {columnsVisibility.product && <th>Product</th>}
                        {columnsVisibility.sku && <th>SKU</th>}
                        {columnsVisibility.supplier && <th>Supplier</th>}
                        {columnsVisibility.referenceNo && <th>Reference No</th>}
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.quantity && <th>Quantity</th>}
                        {columnsVisibility.totalUnitAdjusted && (
                          <th>Total Unit Adjusted</th>
                        )}
                        {columnsVisibility.unitPurchasePrice && (
                          <th>Unit Purchase Price</th>
                        )}
                        {columnsVisibility.subtotal && <th>Subtotal</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {ProductPurchaseReport.slice(startIndex, endIndex).map(
                        (item, index) => (
                          <tr key={index}>
                            {columnsVisibility.product && (
                              <td>
                                {item.productName}
                                {item.variationValue
                                  ? ` - ${item.variationValue}`
                                  : ""}
                              </td>
                            )}
                            {columnsVisibility.sku && <td>{item.sku}</td>}
                            {columnsVisibility.supplier && (
                              <td>{item.supplier}</td>
                            )}
                            {columnsVisibility.referenceNo && (
                              <td>{item.referenceNumber}</td>
                            )}
                            {columnsVisibility.date && <td>{item.date}</td>}
                            {columnsVisibility.quantity && (
                              <td>{item.quantity}</td>
                            )}
                            {columnsVisibility.totalUnitAdjusted && (
                              <td>{item.totalUnitAdjusted}</td>
                            )}
                            {columnsVisibility.unitPurchasePrice && (
                              <td>{item.unitPurchasePrice}</td>
                            )}
                            {columnsVisibility.subtotal && (
                              <td>{item.subtotal}</td>
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray font-17 footer-total text-center">
                        <td colSpan={5} rowSpan={1}>
                          <strong>Total:</strong>
                        </td>
                        <td id="footer_total_purchase" rowSpan={1} colSpan={1}>
                          <p className="text-left">
                            <small>
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {totalQuantity.toLocaleString()}
                              </span>{" "}
                              Pc(s)
                              <br />
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {Math.ceil(
                                  totalQuantity / 1000
                                ).toLocaleString()}{" "}
                                packets
                              </span>
                              <br />
                            </small>
                          </p>
                        </td>
                        <td id="footer_total_adjusted" rowSpan={1} colSpan={1}>
                          <p className="text-left">
                            <small></small>
                          </p>
                        </td>
                        <td rowSpan={1} colSpan={1}></td>
                        <td rowSpan={1} colSpan={1}>
                          <span
                            className="display_currency"
                            id="footer_subtotal"
                            data-currency_symbol="true"
                          >
                            ${totalSubtotal.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* <div className="row">
                  <div className="col-md-12 text-right">
                    <strong>Total Quantity:</strong> {totalQuantity} &nbsp; |
                    &nbsp;
                    <strong>Total Unit Purchase Price:</strong>{" "}
                    {totalUnitPurchasePrice} &nbsp; | &nbsp;
                    <strong>Total Subtotal:</strong> {totalSubtotal}
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductPurchaseReport;
