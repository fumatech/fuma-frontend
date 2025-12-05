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

const OutputTaxSales = () => {
  const [outputTaxSales, setOutputTaxSales] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    date: true,
    invoiceNo: true,
    customer: true,
    taxNumber: true,
    totalAmount: true,
    paymentMethod: true,
    discount: true,
    vat: true,
    cgst: true,
    sgst: true,
    gst: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchOutputTaxSales = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/ProductPurchaseReport/getall"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setOutputTaxSales(data);
        } else {
          console.error("Fetched data is not an array");
          setOutputTaxSales([]);
        }
      } catch (error) {
        console.error("Error fetching report items:", error);
        setOutputTaxSales([]);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchOutputTaxSales();
  }, []);

  const exportCSV = () => {
    const csvData = outputTaxSales.map((item) => ({
      Date: item.date,
      InvoiceNo: item.invoiceNo,
      Customer: item.customer,
      TaxNumber: item.taxNumber,
      TotalAmount: item.totalAmount,
      PaymentMethod: item.paymentMethod,
      Discount: item.discount,
      VAT: item.vat,
      CGST: item.cgst,
      SGST: item.sgst,
      GST: item.gst,
    }));

    const csv = [
      [
        "Date",
        "Invoice No.",
        "Customer",
        "Tax Number",
        "Total Amount",
        "Payment Method",
        "Discount",
        "VAT@10%",
        "CGST@10%",
        "SGST@8%",
        "GST@18%",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "outputTaxSales.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      outputTaxSales.map((item) => ({
        Date: item.date,
        InvoiceNo: item.invoiceNo,
        Customer: item.customer,
        TaxNumber: item.taxNumber,
        TotalAmount: item.totalAmount,
        PaymentMethod: item.paymentMethod,
        Discount: item.discount,
        VAT: item.vat,
        CGST: item.cgst,
        SGST: item.sgst,
        GST: item.gst,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Items");
    XLSX.writeFile(wb, "outputTaxSales.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Define the column headers
    const headers = [
      "Date",
      "Invoice No.",
      "Customer",
      "Tax Number",
      "Total Amount",
      "Payment Method",
      "Discount",
      "VAT@10%",
      "CGST@10%",
      "SGST@8%",
      "GST@18%",
    ];

    // Prepare the data (assuming all fields are always included)
    const body = outputTaxSales
      .slice(startIndex, endIndex)
      .map((item) => [
        item.date,
        item.invoiceNo,
        item.customer,
        item.taxNumber,
        item.totalAmount,
        item.paymentMethod,
        item.discount,
        item.vat,
        item.cgst,
        item.sgst,
        item.gst,
      ]);

    // Add some space before the table
    doc.text("Output Tax Sales", 14, 20);
    doc.setFontSize(12);
    doc.text("Below is the list of output tax sales:", 14, 30);

    // Generate the PDF table with custom styles
    doc.autoTable({
      head: [headers],
      body: body,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: "middle",
        halign: "center",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: 50 },
    });

    // Calculate totals for the footer
    const totals = [
      totalAmount.toFixed(2),
      totalVAT.toFixed(2),
      totalCGST.toFixed(2),
      totalSGST.toFixed(2),
      totalDiscount.toFixed(2),
    ];

    // Add total amounts to the PDF
    let footerY = doc.autoTable.previous.finalY + 10;
    doc.text(`Total Amount: $${totals[0]}`, 14, footerY);
    footerY += 5;
    doc.text(`Total VAT: $${totals[1]}`, 14, footerY);
    footerY += 5;
    doc.text(`Total CGST: $${totals[2]}`, 14, footerY);
    footerY += 5;
    doc.text(`Total SGST: $${totals[3]}`, 14, footerY);
    footerY += 5;
    doc.text(`Total Discount: $${totals[4]}`, 14, footerY);

    // Save the PDF
    doc.save("OutputTaxSales.pdf");
  };

  const printData = () => {
    const tableContent = `
      <html>
        <head>
          <title>Print Tax Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
            .footer-total { background-color: #e9ecef; font-weight: bold; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Tax Sales Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${columnsVisibility.invoiceNo ? "<th>Invoice No.</th>" : ""}
                ${columnsVisibility.customer ? "<th>Customer</th>" : ""}
                ${columnsVisibility.taxNumber ? "<th>Tax Number</th>" : ""}
                ${columnsVisibility.totalAmount ? "<th>Total Amount</th>" : ""}
                ${
                  columnsVisibility.paymentMethod
                    ? "<th>Payment Method</th>"
                    : ""
                }
                ${columnsVisibility.discount ? "<th>Discount</th>" : ""}
                ${columnsVisibility.vat ? "<th>VAT@10%</th>" : ""}
                ${columnsVisibility.cgst ? "<th>CGST@10%</th>" : ""}
                ${columnsVisibility.sgst ? "<th>SGST@8%</th>" : ""}
                ${columnsVisibility.gst ? "<th>GST@18%</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${outputTaxSales
                .slice(startIndex, endIndex)
                .map(
                  (item) => `
                  <tr>
                    ${columnsVisibility.date ? `<td>${item.date}</td>` : ""}
                    ${
                      columnsVisibility.invoiceNo
                        ? `<td>${item.invoiceNo}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.customer
                        ? `<td>${item.customer}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.taxNumber
                        ? `<td>${item.taxNumber}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalAmount
                        ? `<td>${item.totalAmount}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.paymentMethod
                        ? `<td>${item.paymentMethod}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.discount
                        ? `<td>${item.discount}</td>`
                        : ""
                    }
                    ${columnsVisibility.vat ? `<td>${item.vat}</td>` : ""}
                    ${columnsVisibility.cgst ? `<td>${item.cgst}</td>` : ""}
                    ${columnsVisibility.sgst ? `<td>${item.sgst}</td>` : ""}
                    ${columnsVisibility.gst ? `<td>${item.gst}</td>` : ""}
                  </tr>`
                )
                .join("")}
              <tr class="footer-total text-center">
                <td colSpan="4"><strong>Total:</strong></td>
                <td>${totalAmount.toFixed(2)}</td>
                <td>${totalPaymentMethods}</td>
                <td>&nbsp;</td>
                <td>${totalVAT.toFixed(2)}</td>
                <td>${totalCGST.toFixed(2)}</td>
                <td>${totalSGST.toFixed(2)}</td>
                <td>${totalDiscount.toFixed(2)}</td>
              </tr>
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

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const calculateTotals = () => {
    const displayedItems = outputTaxSales.slice(startIndex, endIndex);
    const totalAmount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.totalAmount) || 0),
      0
    );
    const totalVAT = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.vat) || 0),
      0
    );
    const totalCGST = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.cgst) || 0),
      0
    );
    const totalSGST = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.sgst) || 0),
      0
    );
    const totalDiscount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.discount) || 0),
      0
    );

    return {
      totalAmount,
      totalVAT,
      totalCGST,
      totalSGST,
      totalDiscount,
      totalPaymentMethods: displayedItems.length, // Counting total entries
    };
  };

  const {
    totalAmount,
    totalVAT,
    totalCGST,
    totalSGST,
    totalDiscount,
    totalPaymentMethods,
  } = calculateTotals();

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
                        <i className="fa fa-eye"></i> Columns
                      </button>
                      <div
                        className="dropdown-menu"
                        aria-labelledby="dropdownMenuButton"
                      >
                        {Object.keys(columnsVisibility).map((col) => (
                          <div className="dropdown-item" key={col}>
                            <label>
                              <input
                                type="checkbox"
                                checked={columnsVisibility[col]}
                                onChange={() => toggleColumn(col)}
                              />
                              {col.charAt(0).toUpperCase() + col.slice(1)}
                            </label>
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
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.invoiceNo && <th>Invoice No.</th>}
                        {columnsVisibility.customer && <th>Customer</th>}
                        {columnsVisibility.taxNumber && <th>Tax Number</th>}
                        {columnsVisibility.totalAmount && <th>Total Amount</th>}
                        {columnsVisibility.paymentMethod && (
                          <th>Payment Method</th>
                        )}
                        {columnsVisibility.discount && <th>Discount</th>}
                        {columnsVisibility.vat && <th>VAT@10%</th>}
                        {columnsVisibility.cgst && <th>CGST@10%</th>}
                        {columnsVisibility.sgst && <th>SGST@8%</th>}
                        {columnsVisibility.gst && <th>GST@18%</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {outputTaxSales
                        .slice(startIndex, endIndex)
                        .map((item, index) => (
                          <tr key={index}>
                            {columnsVisibility.date && <td>{item.date}</td>}
                            {columnsVisibility.invoiceNo && (
                              <td>{item.invoiceNo}</td>
                            )}
                            {columnsVisibility.customer && (
                              <td>{item.customer}</td>
                            )}
                            {columnsVisibility.taxNumber && (
                              <td>{item.taxNumber}</td>
                            )}
                            {columnsVisibility.totalAmount && (
                              <td>{item.totalAmount}</td>
                            )}
                            {columnsVisibility.paymentMethod && (
                              <td>{item.paymentMethod}</td>
                            )}
                            {columnsVisibility.discount && (
                              <td>{item.discount}</td>
                            )}
                            {columnsVisibility.vat && <td>{item.vat}</td>}
                            {columnsVisibility.cgst && <td>{item.cgst}</td>}
                            {columnsVisibility.sgst && <td>{item.sgst}</td>}
                            {columnsVisibility.gst && <td>{item.gst}</td>}
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray font-17 text-center footer-total">
                        <td colSpan="4" rowSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="purchase_total"
                            data-currency_symbol="true"
                          >
                            ${totalAmount.toFixed(2)}
                          </span>
                        </td>
                        <td
                          className="output_payment_method_count"
                          rowSpan="1"
                          colSpan="1"
                        >
                          <p className="text-left">
                            <small>
                              Cash - {totalPaymentMethods}
                              <br />
                            </small>
                          </p>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          &nbsp;
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="total_output_1"
                            data-currency_symbol="true"
                          >
                            ${totalVAT.toFixed(2)}
                          </span>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="total_output_2"
                            data-currency_symbol="true"
                          >
                            ${totalCGST.toFixed(2)}
                          </span>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="total_output_3"
                            data-currency_symbol="true"
                          >
                            ${totalSGST.toFixed(2)}
                          </span>
                        </td>
                        <td rowSpan="1" colSpan="1">
                          <span
                            className="display_currency"
                            id="total_output_4"
                            data-currency_symbol="true"
                          >
                            ${totalDiscount.toFixed(2)}
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

export default OutputTaxSales;
