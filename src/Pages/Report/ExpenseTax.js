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

const ExpenseTax = () => {
  const [ExpenseTax, setExpenseTax] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    date: true,
    referenceNo: false,
    taxNumber: true,
    totalAmount: true,
    discount: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Fetch tax types
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/tax/getall`)
      .then((res) => res.json())
      .then((data) => setTaxes(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/add-expenses/getall-with-tax`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((item) => ({
          ...item,
          orderDate: item.date,
          purchaseTax: Number(item.tax),
          grossAmount: Number(item.totalAmount), // amount INCLUDING tax
          discountAmount: 0,
        }));
  
        setExpenseTax(mapped);
      })
      .catch(console.error);
  
    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
  
    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const getOrderTaxAmounts = (order, taxes = []) => {
    const result = {};

    if (!Array.isArray(taxes)) return result;

    // initialize columns
    taxes.forEach((tax) => {
      result[tax.taxName] = 0;
    });

    if (!order.purchaseTax || !order.grossAmount) return result;

    const tax = taxes.find((t) => t.id === order.purchaseTax);
    if (!tax) return result;

    const taxRate = Number(tax.taxValue);
    const taxAmount = (order.grossAmount * taxRate) / (100 + taxRate);

    result[tax.taxName] = Number(taxAmount.toFixed(2));

    return result;
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Calculate totals for visible page
  const displayedItems = ExpenseTax.slice(startIndex, endIndex);
  const totalAmount = displayedItems.reduce((acc, item) => {
    const taxAmt = Object.values(getOrderTaxAmounts(item, taxes)).reduce(
      (a, b) => a + b,
      0
    );

    return acc + (item.grossAmount - taxAmt);
  }, 0);

  const totalDiscount = displayedItems.reduce(
    (acc, order) => acc + parseFloat(order.discountAmount || 0),
    0
  );

  // CSV Export
  const exportCSV = () => {
    const headers = [
      "Date",
      "Reference No",
      "Tax Number",
      "Total Amount",
      "Discount",
      ...taxes.map((tax) => `${tax.name}@${tax.rate}%`),
    ];
    const csvData = ExpenseTax.map((order) => {
      const orderTaxes = getOrderTaxAmounts(order);
      return [
        order.orderDate,
        order.referenceNumber,
        order.vendor,
        order.purchaseTax || "-",
        order.netTotalAmount,
        order.discountAmount || 0,
        ...taxes.map((tax) => orderTaxes[tax.name].toFixed(2)),
      ];
    });
    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    saveAs(new Blob([csv], { type: "text/csv" }), "ExpenseTax.csv");
  };

  // Excel Export
  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Date",
        "Reference No",
        "Tax Number",
        "Total Amount",
        "Discount",
        ...taxes.map((tax) => `${tax.name}@${tax.rate}%`),
      ],
      ...ExpenseTax.map((order) => {
        const orderTaxes = getOrderTaxAmounts(order);
        return [
          order.orderDate,
          order.referenceNumber,
          order.vendor,
          order.purchaseTax || "-",
          order.netTotalAmount,
          order.discountAmount || 0,
          ...taxes.map((tax) => orderTaxes[tax.name].toFixed(2)),
        ];
      }),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(ws, wb, "ExpenseTax");
    XLSX.writeFile(wb, "ExpenseTax.xlsx");
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    const headers = [
      "Date",
      "Reference No",
      "Tax Number",
      "Total Amount",
      "Discount",
      ...taxes.map((tax) => `${tax.name}@${tax.rate}%`),
    ];
    const body = ExpenseTax.map((order) => {
      const orderTaxes = getOrderTaxAmounts(order);
      return [
        order.orderDate,
        order.referenceNumber,
        order.vendor,
        order.purchaseTax || "-",
        order.netTotalAmount,
        order.discountAmount || 0,
        ...taxes.map((tax) => orderTaxes[tax.name].toFixed(2)),
      ];
    });
    doc.text("Input Tax Purchases Report", 14, 15);
    doc.autoTable({ head: [headers], body, startY: 20 });
    doc.save("ExpenseTax.pdf");
  };

  // Handle entries per page
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalTaxes = {};

  taxes.forEach((tax) => {
    totalTaxes[tax.taxName] = displayedItems.reduce((acc, order) => {
      const orderTaxes = getOrderTaxAmounts(order, taxes);
      return acc + (orderTaxes[tax.taxName] || 0);
    }, 0);
  });

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
                      // onClick={printData}
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
                  <table  id="example1" className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.referenceNo && <th>Reference No</th>}
                        {columnsVisibility.totalAmount && (
                          <th>Total Amount (Excl. Tax)</th>
                        )}
                        {columnsVisibility.discount && <th>Discount</th>}
                        {taxes.map((tax) => (
                          <th key={tax.id}>
                            {tax.taxName} @{tax.taxValue}%
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {ExpenseTax.slice(startIndex, endIndex).map(
                        (item, index) => {
                          const orderTaxes = getOrderTaxAmounts(item, taxes);

                          const totalTax = Object.values(orderTaxes).reduce(
                            (a, b) => a + b,
                            0
                          );

                          const netAmount = (item.grossAmount || 0) - totalTax;

                          return (
                            <tr key={index}>
                              {columnsVisibility.date && (
                                <td>{item.purchaseDate || item.orderDate}</td>
                              )}

                              {columnsVisibility.referenceNo && (
                                <td>{item.referenceNumber || "-"}</td>
                              )}

                              {columnsVisibility.totalAmount && (
                                <td>{netAmount.toFixed(2)}</td>
                              )}

                              {columnsVisibility.discount && (
                                <td>{(item.discountAmount || 0).toFixed(2)}</td>
                              )}

                              {taxes.map((tax) => (
                                <td key={tax.id}>
                                  {(orderTaxes[tax.taxName] || 0).toFixed(2)}
                                </td>
                              ))}
                            </tr>
                          );
                        }
                      )}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td
                          colSpan={
                            (columnsVisibility.date ? 1 : 0) +
                            (columnsVisibility.referenceNo ? 1 : 0)
                          }
                        >
                          <strong>Totals</strong>
                        </td>

                        {columnsVisibility.totalAmount && (
                          <td>{totalAmount.toFixed(2)}</td>
                        )}

                        {columnsVisibility.discount && (
                          <td>{totalDiscount.toFixed(2)}</td>
                        )}

                        {taxes.map((tax) => (
                          <td key={tax.id}>
                            {(totalTaxes[tax.taxName] || 0).toFixed(2)}
                          </td>
                        ))}
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

export default ExpenseTax;
