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

const ItemReport = () => {
  const [reportItems, setReportItems] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    product: true,
    sku: true,
    description: true,
    purchaseDate: true,
    purchase: true,
    lotNumber: true,
    supplier: true,
    purchasePrice: true,
    sellDate: true,
    sale: true,
    customer: true,
    location: true,
    sellQuantity: true,
    selling: true,
    subtotal: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchReportItems = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/itemReport/getall`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setReportItems(data);
        } else {
          console.error("Fetched data is not an array");
          setReportItems([]);
        }
      } catch (error) {
        console.error("Error fetching report items:", error);
        setReportItems([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchReportItems();
  }, []);

  const exportCSV = () => {
    const csvData = reportItems.map((item) => ({
      Product: item.product,
      SKU: item.sku,
      Description: item.description,
      PurchaseDate: item.purchaseDate,
      Purchase: item.purchase,
      LotNumber: item.lotNumber,
      Supplier: item.supplier,
      PurchasePrice: item.purchasePrice,
      SellDate: item.sellDate,
      Sale: item.sale,
      Customer: item.customer,
      Location: item.location,
      SellQuantity: item.sellQuantity,
      Selling: item.selling,
      Subtotal: item.subtotal,
    }));

    const csv = [
      [
        "Product",
        "SKU",
        "Description",
        "Purchase Date",
        "Purchase",
        "Lot Number",
        "Supplier",
        "Purchase Price",
        "Sell Date",
        "Sale",
        "Customer",
        "Location",
        "Sell Quantity",
        "Selling",
        "Subtotal",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "reportItems.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      reportItems.map((item) => ({
        Product: item.product,
        SKU: item.sku,
        Description: item.description,
        PurchaseDate: item.purchaseDate,
        Purchase: item.purchase,
        LotNumber: item.lotNumber,
        Supplier: item.supplier,
        PurchasePrice: item.purchasePrice,
        SellDate: item.sellDate,
        Sale: item.sale,
        Customer: item.customer,
        Location: item.location,
        SellQuantity: item.sellQuantity,
        Selling: item.selling,
        Subtotal: item.subtotal,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Items");
    XLSX.writeFile(wb, "reportItems.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Product",
          "SKU",
          "Description",
          "Purchase Date",
          "Purchase",
          "Lot Number",
          "Supplier",
          "Purchase Price",
          "Sell Date",
          "Sale",
          "Customer",
          "Location",
          "Sell Quantity",
          "Selling",
          "Subtotal",
        ],
      ],
      body: reportItems.map((item) => [
        item.product,
        item.sku,
        item.description,
        item.purchaseDate,
        item.purchase,
        item.lotNumber,
        item.supplier,
        item.purchasePrice,
        item.sellDate,
        item.sale,
        item.customer,
        item.location,
        item.sellQuantity,
        item.selling,
        item.subtotal,
      ]),
    });
    doc.save("reportItems.pdf");
  };

  const printData = () => {
    const tableContent = `
      <html>
        <head>
          <title>Print Report</title>
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
          <h2>Report Items</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.product ? "<th>Product</th>" : ""}
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${columnsVisibility.description ? "<th>Description</th>" : ""}
                ${
                  columnsVisibility.purchaseDate ? "<th>Purchase Date</th>" : ""
                }
                ${columnsVisibility.purchase ? "<th>Purchase</th>" : ""}
                ${columnsVisibility.lotNumber ? "<th>Lot Number</th>" : ""}
                ${columnsVisibility.supplier ? "<th>Supplier</th>" : ""}
                ${
                  columnsVisibility.purchasePrice
                    ? "<th>Purchase Price</th>"
                    : ""
                }
                ${columnsVisibility.sellDate ? "<th>Sell Date</th>" : ""}
                ${columnsVisibility.sale ? "<th>Sale</th>" : ""}
                ${columnsVisibility.customer ? "<th>Customer</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${
                  columnsVisibility.sellQuantity ? "<th>Sell Quantity</th>" : ""
                }
                ${columnsVisibility.selling ? "<th>Selling</th>" : ""}
                ${columnsVisibility.subtotal ? "<th>Subtotal</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${reportItems
                .slice(startIndex, endIndex)
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
                      columnsVisibility.description
                        ? `<td>${item.description}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.purchaseDate
                        ? `<td>${item.purchaseDate}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.purchase
                        ? `<td>${item.purchase}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.lotNumber
                        ? `<td>${item.lotNumber}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.supplier
                        ? `<td>${item.supplier}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.purchasePrice
                        ? `<td>${item.purchasePrice}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.sellDate
                        ? `<td>${item.sellDate}</td>`
                        : ""
                    }
                    ${columnsVisibility.sale ? `<td>${item.sale}</td>` : ""}
                    ${
                      columnsVisibility.customer
                        ? `<td>${item.customer}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.location
                        ? `<td>${item.location}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.sellQuantity
                        ? `<td>${item.sellQuantity}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.selling
                        ? `<td>${item.selling}</td>`
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
                <td colSpan="7"><strong>Total:</strong></td>
                <td>${totalPurchasePrice.toFixed(2)}</td>
                <td colSpan="4"></td>
                <td>
                  <small>${totalSellQuantity.toFixed(2)} Pc(s)</small>
                </td>
                <td>${totalSelling.toFixed(2)}</td>
                <td>${totalSubtotal.toFixed(2)}</td>
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

  // Calculate totals dynamically
  const calculateTotals = () => {
    const displayedItems = reportItems.slice(startIndex, endIndex);
    const totalPurchasePrice = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.purchasePrice) || 0),
      0
    );
    const totalSellQuantity = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.sellQuantity) || 0),
      0
    );
    const totalSelling = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.selling) || 0),
      0
    );
    const totalSubtotal = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.subtotal) || 0),
      0
    );

    return {
      totalPurchasePrice,
      totalSellQuantity,
      totalSelling,
      totalSubtotal,
    };
  };

  const { totalPurchasePrice, totalSellQuantity, totalSelling, totalSubtotal } =
    calculateTotals();

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">Items Report</h1>
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
                        {columnsVisibility.product && <th>Product</th>}
                        {columnsVisibility.sku && <th>SKU</th>}
                        {columnsVisibility.description && <th>Description</th>}
                        {columnsVisibility.purchaseDate && (
                          <th>Purchase Date</th>
                        )}
                        {columnsVisibility.purchase && <th>Purchase</th>}
                        {columnsVisibility.lotNumber && <th>Lot Number</th>}
                        {columnsVisibility.supplier && <th>Supplier</th>}
                        {columnsVisibility.purchasePrice && (
                          <th>Purchase Price</th>
                        )}
                        {columnsVisibility.sellDate && <th>Sell Date</th>}
                        {columnsVisibility.sale && <th>Sale</th>}
                        {columnsVisibility.customer && <th>Customer</th>}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.sellQuantity && (
                          <th>Sell Quantity</th>
                        )}
                        {columnsVisibility.selling && <th>Selling</th>}
                        {columnsVisibility.subtotal && <th>Subtotal</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {reportItems.slice(startIndex, endIndex).map((item) => (
                        <tr key={item.id}>
                          {columnsVisibility.product && <td>{item.product}</td>}
                          {columnsVisibility.sku && <td>{item.sku}</td>}
                          {columnsVisibility.description && (
                            <td>{item.description}</td>
                          )}
                          {columnsVisibility.purchaseDate && (
                            <td>{item.purchaseDate}</td>
                          )}
                          {columnsVisibility.purchase && (
                            <td>{item.purchase}</td>
                          )}
                          {columnsVisibility.lotNumber && (
                            <td>{item.lotNumber}</td>
                          )}
                          {columnsVisibility.supplier && (
                            <td>{item.supplier}</td>
                          )}
                          {columnsVisibility.purchasePrice && (
                            <td>{item.purchasePrice}</td>
                          )}
                          {columnsVisibility.sellDate && (
                            <td>{item.sellDate}</td>
                          )}
                          {columnsVisibility.sale && <td>{item.sale}</td>}
                          {columnsVisibility.customer && (
                            <td>{item.customer}</td>
                          )}
                          {columnsVisibility.location && (
                            <td>{item.location}</td>
                          )}
                          {columnsVisibility.sellQuantity && (
                            <td>{item.sellQuantity}</td>
                          )}
                          {columnsVisibility.selling && <td>{item.selling}</td>}
                          {columnsVisibility.subtotal && (
                            <td>{item.subtotal}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray font-17 text-center footer-total">
                        <td colSpan="7" rowSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td
                          id="footer_total_pp"
                          className="display_currency"
                          data-currency_symbol="true"
                          rowSpan="1"
                          colSpan="1"
                        >
                          ${totalPurchasePrice.toFixed(2)}
                        </td>
                        <td colSpan="4" rowSpan="1"></td>
                        <td id="footer_total_qty" rowSpan="1" colSpan="1">
                          <p className="text-left">
                            <small>
                              <span
                                className="display_currency"
                                data-is_quantity="true"
                              >
                                {totalSellQuantity.toFixed(2)}
                              </span>{" "}
                              Pc(s)
                              <br />
                            </small>
                          </p>
                        </td>
                        <td
                          id="footer_total_sp"
                          className="display_currency"
                          data-currency_symbol="true"
                          rowSpan="1"
                          colSpan="1"
                        >
                          ${totalSelling.toFixed(2)}
                        </td>
                        <td
                          id="footer_total_subtotal"
                          className="display_currency"
                          data-currency_symbol="true"
                          rowSpan="1"
                          colSpan="1"
                        >
                          ${totalSubtotal.toFixed(2)}
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

export default ItemReport;
