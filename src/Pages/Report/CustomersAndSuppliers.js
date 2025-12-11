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

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    contact: true,
    totalPurchase: true,
    totalPurchaseReturn: true,
    totalSale: true,
    totalSaleReturn: true,
    openingBalanceDue: true,
    due: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/client-ledger/getall`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error("Fetched data is not an array");
          setClients([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching clients:", error);
        setClients([]);
      });

    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const totals = clients.reduce(
    (acc, cur) => {
      acc.totalPurchase += Number(cur.totalPurchase || 0);
      acc.totalPurchaseReturn += Number(cur.totalPurchaseReturn || 0);
      acc.totalSale += Number(cur.totalSale || 0);
      acc.totalSaleReturn += Number(cur.totalSaleReturn || 0);
      acc.openingBalanceDue += Number(cur.openingBalanceDue || 0);
      acc.due += Number(cur.due || 0);
      return acc;
    },
    {
      totalPurchase: 0,
      totalPurchaseReturn: 0,
      totalSale: 0,
      totalSaleReturn: 0,
      openingBalanceDue: 0,
      due: 0,
    }
  );

  const exportCSV = () => {
    const csvData = clients.map((client) => ({
      Contact: client.contact,
      TotalPurchase: client.totalPurchase,
      TotalPurchaseReturn: client.totalPurchaseReturn,
      TotalSale: client.totalSale,
      TotalSaleReturn: client.totalSaleReturn,
      OpeningBalanceDue: client.openingBalanceDue,
      Due: client.due,
    }));

    const csv = [
      [
        "Contact",
        "Total Purchase",
        "Total Purchase Return",
        "Total Sale",
        "Total Sale Return",
        "Opening Balance Due",
        "Due",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "clients.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      clients.map((client) => ({
        Contact: client.contact,
        TotalPurchase: client.totalPurchase,
        TotalPurchaseReturn: client.totalPurchaseReturn,
        TotalSale: client.totalSale,
        TotalSaleReturn: client.totalSaleReturn,
        OpeningBalanceDue: client.openingBalanceDue,
        Due: client.due,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "clients.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Define the column headers based on your table
    const headers = [];
    if (columnsVisibility.contact) headers.push("Contact");
    if (columnsVisibility.totalPurchase) headers.push("Total Purchase");
    if (columnsVisibility.totalPurchaseReturn)
      headers.push("Total Purchase Return");
    if (columnsVisibility.totalSale) headers.push("Total Sale");
    if (columnsVisibility.totalSaleReturn) headers.push("Total Sale Return");
    if (columnsVisibility.openingBalanceDue)
      headers.push("Opening Balance Due");
    if (columnsVisibility.due) headers.push("Due");

    // Map through the client data and prepare the body
    const body = clients.slice(startIndex, endIndex).map((client) => {
      const row = [];
      if (columnsVisibility.contact) row.push(client.contact);
      if (columnsVisibility.totalPurchase) row.push(client.totalPurchase);
      if (columnsVisibility.totalPurchaseReturn)
        row.push(client.totalPurchaseReturn);
      if (columnsVisibility.totalSale) row.push(client.totalSale);
      if (columnsVisibility.totalSaleReturn) row.push(client.totalSaleReturn);
      if (columnsVisibility.openingBalanceDue)
        row.push(client.openingBalanceDue);
      if (columnsVisibility.due) row.push(client.due);
      return row;
    });

    // Add some space before the table
    doc.text("Client List", 14, 20); // Title with a slight offset
    doc.setFontSize(12);
    doc.text("Below is the list of clients with their details:", 14, 30);

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
        fillColor: [22, 160, 133], // Custom header color
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Light gray for alternate rows
      },
      margin: { top: 50 }, // Increase top margin for more space above the table
    });

    // Save the PDF
    doc.save("ClientList.pdf");
  };
  const printData = () => {
    const tableContent = `
      <html>
        <head>
          <title>Print Client Report</title>
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
          <h2>Client Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.contact ? "<th>Contact</th>" : ""}
                ${
                  columnsVisibility.totalPurchase
                    ? "<th>Total Purchase</th>"
                    : ""
                }
                ${
                  columnsVisibility.totalPurchaseReturn
                    ? "<th>Total Purchase Return</th>"
                    : ""
                }
                ${columnsVisibility.totalSale ? "<th>Total Sale</th>" : ""}
                ${
                  columnsVisibility.totalSaleReturn
                    ? "<th>Total Sale Return</th>"
                    : ""
                }
                ${
                  columnsVisibility.openingBalanceDue
                    ? "<th>Opening Balance Due</th>"
                    : ""
                }
                ${columnsVisibility.due ? "<th>Due</th>" : ""}
                ${columnsVisibility.action ? "<th>Actions</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${clients
                .slice(startIndex, endIndex)
                .map(
                  (client) => `
                  <tr>
                    ${
                      columnsVisibility.contact
                        ? `<td>${client.contact}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalPurchase
                        ? `<td>${client.totalPurchase}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalPurchaseReturn
                        ? `<td>${client.totalPurchaseReturn}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalSale
                        ? `<td>${client.totalSale}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.totalSaleReturn
                        ? `<td>${client.totalSaleReturn}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.openingBalanceDue
                        ? `<td>${client.openingBalanceDue}</td>`
                        : ""
                    }
                    ${columnsVisibility.due ? `<td>${client.due}</td>` : ""}
                    ${
                      columnsVisibility.action
                        ? `<td><button class="btn-delete">Delete</button></td>`
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
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        const response = await fetch(
          `http://localhost:8080/units/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setClients((prevClients) =>
            prevClients.filter((client) => client.id !== id)
          );
          alert("Client deleted successfully!");
        } else {
          alert("Failed to delete client.");
        }
      } catch (error) {
        console.error("Error deleting client:", error);
        alert("Error deleting client");
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
                <h1 className=" all-heading">Customers & Suppliers report</h1>
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
                        {columnsVisibility.contact && <th>Contact</th>}
                        {columnsVisibility.totalPurchase && (
                          <th>Total Purchase</th>
                        )}
                        {columnsVisibility.totalPurchaseReturn && (
                          <th>Total Purchase Return</th>
                        )}
                        {columnsVisibility.totalSale && <th>Total Sale</th>}
                        {columnsVisibility.totalSaleReturn && (
                          <th>Total Sale Return</th>
                        )}
                        {columnsVisibility.openingBalanceDue && (
                          <th>Opening Balance Due</th>
                        )}
                        {columnsVisibility.due && <th>Due</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {clients
                        .slice(startIndex, endIndex)
                        .map((client, index) => (
                          <tr key={index}>
                            {columnsVisibility.contact && (
                              <td>{client.contact}</td>
                            )}
                            {columnsVisibility.totalPurchase && (
                              <td>{client.totalPurchase}</td>
                            )}
                            {columnsVisibility.totalPurchaseReturn && (
                              <td>{client.totalPurchaseReturn}</td>
                            )}
                            {columnsVisibility.totalSale && (
                              <td>{client.totalSale}</td>
                            )}
                            {columnsVisibility.totalSaleReturn && (
                              <td>{client.totalSaleReturn}</td>
                            )}
                            {columnsVisibility.openingBalanceDue && (
                              <td>{client.openingBalanceDue}</td>
                            )}
                            {columnsVisibility.due && <td>{client.due}</td>}
                          </tr>
                        ))}
                    </tbody>

                    <tfoot>
                      <tr
                        style={{
                          backgroundColor: "#f1f3f5",
                          fontWeight: "bold",
                        }}
                      >
                        {columnsVisibility.contact && <td>TOTAL</td>}

                        {columnsVisibility.totalPurchase && (
                          <td>{totals.totalPurchase.toFixed(2)}</td>
                        )}

                        {columnsVisibility.totalPurchaseReturn && (
                          <td>{totals.totalPurchaseReturn.toFixed(2)}</td>
                        )}

                        {columnsVisibility.totalSale && (
                          <td>{totals.totalSale.toFixed(2)}</td>
                        )}

                        {columnsVisibility.totalSaleReturn && (
                          <td>{totals.totalSaleReturn.toFixed(2)}</td>
                        )}

                        {columnsVisibility.openingBalanceDue && (
                          <td>{totals.openingBalanceDue.toFixed(2)}</td>
                        )}

                        {columnsVisibility.due && (
                          <td>{totals.due.toFixed(2)}</td>
                        )}
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

export default Clients;
