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

const Detailed = () => {
  const [productSellReport, setProductSellReport] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    products: true,
    sku: true,
    customerName: true,
    contactID: true,
    invoiceNo: true,
    date: true,
    quantity: true,
    unitPrice: true,
    discount: true,
    tax: true,
    priceIncTax: true,
    total: true,
    paymentMethod: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchProductSellReport = async () => {
      try {
        const response = await fetch("http://localhost:8080/itemReport/getall");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProductSellReport(data);
        } else {
          console.error("Fetched data is not an array");
          setProductSellReport([]);
        }
      } catch (error) {
        console.error("Error fetching product sell report:", error);
        setProductSellReport([]);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchProductSellReport();
  }, []);

  const exportCSV = () => {
    const csvData = productSellReport.map((item) => ({
      Products: item.products,
      SKU: item.sku,
      CustomerName: item.customerName,
      ContactID: item.contactID,
      InvoiceNo: item.invoiceNo,
      Date: item.date,
      Quantity: item.quantity,
      UnitPrice: item.unitPrice,
      Discount: item.discount,
      Tax: item.tax,
      PriceIncTax: item.priceIncTax,
      Total: item.total,
      PaymentMethod: item.paymentMethod,
    }));

    const csv = [
      [
        "Products",
        "SKU",
        "Customer Name",
        "Contact ID",
        "Invoice No",
        "Date",
        "Quantity",
        "Unit Price",
        "Discount",
        "Tax",
        "Price Inc. Tax",
        "Total",
        "Payment Method",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "productSellReport.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      productSellReport.map((item) => ({
        Products: item.products,
        SKU: item.sku,
        CustomerName: item.customerName,
        ContactID: item.contactID,
        InvoiceNo: item.invoiceNo,
        Date: item.date,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        Discount: item.discount,
        Tax: item.tax,
        PriceIncTax: item.priceIncTax,
        Total: item.total,
        PaymentMethod: item.paymentMethod,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product Sell Report");
    XLSX.writeFile(wb, "productSellReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Products",
          "SKU",
          "Customer Name",
          "Contact ID",
          "Invoice No",
          "Date",
          "Quantity",
          "Unit Price",
          "Discount",
          "Tax",
          "Price Inc. Tax",
          "Total",
          "Payment Method",
        ],
      ],
      body: productSellReport.map((item) => [
        item.products,
        item.sku,
        item.customerName,
        item.contactID,
        item.invoiceNo,
        item.date,
        item.quantity,
        item.unitPrice,
        item.discount,
        item.tax,
        item.priceIncTax,
        item.total,
        item.paymentMethod,
      ]),
    });
    doc.save("productSellReport.pdf");
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
          <h2>Product Sell Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.products ? "<th>Products</th>" : ""}
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${
                  columnsVisibility.customerName ? "<th>Customer Name</th>" : ""
                }
                ${columnsVisibility.contactID ? "<th>Contact ID</th>" : ""}
                ${columnsVisibility.invoiceNo ? "<th>Invoice No</th>" : ""}
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${columnsVisibility.quantity ? "<th>Quantity</th>" : ""}
                ${columnsVisibility.unitPrice ? "<th>Unit Price</th>" : ""}
                ${columnsVisibility.discount ? "<th>Discount</th>" : ""}
                ${columnsVisibility.tax ? "<th>Tax</th>" : ""}
                ${
                  columnsVisibility.priceIncTax ? "<th>Price Inc. Tax</th>" : ""
                }
                ${columnsVisibility.total ? "<th>Total</th>" : ""}
                ${
                  columnsVisibility.paymentMethod
                    ? "<th>Payment Method</th>"
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${productSellReport
                .slice(startIndex, endIndex)
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
                    columnsVisibility.contactID
                      ? `<td>${item.contactID}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.invoiceNo
                      ? `<td>${item.invoiceNo}</td>`
                      : ""
                  }
                  ${columnsVisibility.date ? `<td>${item.date}</td>` : ""}
                  ${
                    columnsVisibility.quantity
                      ? `<td>${item.quantity}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.unitPrice
                      ? `<td>${item.unitPrice}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.discount
                      ? `<td>${item.discount}</td>`
                      : ""
                  }
                  ${columnsVisibility.tax ? `<td>${item.tax}</td>` : ""}
                  ${
                    columnsVisibility.priceIncTax
                      ? `<td>${item.priceIncTax}</td>`
                      : ""
                  }
                  ${columnsVisibility.total ? `<td>${item.total}</td>` : ""}
                  ${
                    columnsVisibility.paymentMethod
                      ? `<td>${item.paymentMethod}</td>`
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

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Calculate totals dynamically

  const calculateTotals = () => {
    const displayedItems = productSellReport.slice(startIndex, endIndex);
    const totalQuantity = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.quantity) || 0),
      0
    );
    const totalPackets = Math.floor(totalQuantity / 10); // Example: 10 units make a packet
    const totalUnitPrice = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.unitPrice) || 0),
      0
    );
    const totalDiscount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.discount) || 0),
      0
    );
    const totalTax = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.tax) || 0),
      0
    );
    const vatAmount = totalTax * 0.1; // Assuming VAT is 10%
    const totalPriceIncTax = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.priceIncTax) || 0),
      0
    );
    const totalAmount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.total) || 0),
      0
    );

    return {
      totalQuantity,
      totalPackets,
      totalUnitPrice,
      totalDiscount,
      totalTax,
      vatAmount,
      totalPriceIncTax,
      totalAmount,
    };
  };

  const {
    totalQuantity,
    totalPackets,
    totalUnitPrice,
    totalDiscount,
    totalTax,
    vatAmount,
    totalPriceIncTax,
    totalAmount,
  } = calculateTotals();

  return (
    <div className="wrapper">
      <div className="">
        <section className="content py-3">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 ">
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
                        {columnsVisibility.contactID && <th>Contact ID</th>}
                        {columnsVisibility.invoiceNo && <th>Invoice No</th>}
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.quantity && <th>Quantity</th>}
                        {columnsVisibility.unitPrice && <th>Unit Price</th>}
                        {columnsVisibility.discount && <th>Discount</th>}
                        {columnsVisibility.tax && <th>Tax</th>}
                        {columnsVisibility.priceIncTax && (
                          <th>Price Inc. Tax</th>
                        )}
                        {columnsVisibility.total && <th>Total</th>}
                        {columnsVisibility.paymentMethod && (
                          <th>Payment Method</th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {productSellReport
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
                            {columnsVisibility.contactID && (
                              <td>{item.contactID}</td>
                            )}
                            {columnsVisibility.invoiceNo && (
                              <td>{item.invoiceNo}</td>
                            )}
                            {columnsVisibility.date && <td>{item.date}</td>}
                            {columnsVisibility.quantity && (
                              <td>{item.quantity}</td>
                            )}
                            {columnsVisibility.unitPrice && (
                              <td>{item.unitPrice}</td>
                            )}
                            {columnsVisibility.discount && (
                              <td>{item.discount}</td>
                            )}
                            {columnsVisibility.tax && <td>{item.tax}</td>}
                            {columnsVisibility.priceIncTax && (
                              <td>{item.priceIncTax}</td>
                            )}
                            {columnsVisibility.total && <td>{item.total}</td>}
                            {columnsVisibility.paymentMethod && (
                              <td>{item.paymentMethod}</td>
                            )}
                          </tr>
                        ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray text-center">
                        <td colSpan="6" rowSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td id="footer_total_sold" rowSpan="1" colSpan="1">
                          <p className="text-left">
                            <small>
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {totalQuantity.toFixed(2)}
                              </span>{" "}
                              Pc(s)
                              <br />
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {totalPackets.toFixed(2)}
                              </span>{" "}
                              packets
                              <br />
                            </small>
                          </p>
                        </td>
                        <td rowSpan="1" colSpan="1"></td>
                        <td rowSpan="1" colSpan="1"></td>
                        <td id="footer_tax" rowSpan="1" colSpan="1">
                          <p className="text-left">
                            <small>
                              :{" "}
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {totalTax.toFixed(2)}
                              </span>{" "}
                              <br />
                              VAT@10% :{" "}
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {vatAmount.toFixed(2)}
                              </span>{" "}
                              <br />
                            </small>
                          </p>
                        </td>
                        <td rowSpan="1" colSpan="1"></td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="footer_subtotal"
                            data-currency_symbol="true"
                          >
                            ${totalAmount.toFixed(2)}
                          </span>
                        </td>
                        <td rowSpan="1" colSpan="1"></td>
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

export default Detailed;
