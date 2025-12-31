import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Collapse } from "react-bootstrap";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";

const ListStockTransfer = () => {
  const [ListStockTransfer, setListStockTransfer] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    data: true,
    referenceNo: true,
    locationFrom: true,
    locationTo: true,
    status: true,
    shippingCharges: true,
    totalAmount: true,
    additionalNotes: true,
    action: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentListStock, setCurrentListStock] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    data: "",
    referenceNo: "",
    locationFrom: "",
    locationTo: "",
    status: "",
    shippingCharges: "",
    totalAmount: "",
    additionalNotes: "",
  });

  // Filter states
  const [filterValues, setFilterValues] = useState({
    locationsFrom: [],
    locationsTo: [],
    statuses: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    locationFrom: "",
    locationTo: "",
    status: "",
  });

  const [filteredStockTransfers, setFilteredStockTransfers] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationMap, setLocationMap] = useState({});

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);

        // Build map: { 1: "FUMA", 2: "abc" }
        const map = {};
        data.forEach((loc) => {
          map[loc.id] = loc.name;
        });
        setLocationMap(map);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchStockTransfer();
  }, []);

  const fetchStockTransfer = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-transfer/getall`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setListStockTransfer(data);
        setFilteredStockTransfers(data);
      } else {
        console.error("Fetched data is not an array");
        setListStockTransfer([]);
        setFilteredStockTransfers([]);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setListStockTransfer([]);
      setFilteredStockTransfers([]);
    }

    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  };

  // Extract filter values when ListStockTransfer data changes
  useEffect(() => {
    if (ListStockTransfer.length > 0) {
      const locationsFrom = [
        ...new Set(ListStockTransfer.map((item) => item.locationFrom)),
      ].filter(Boolean);

      const locationsTo = [
        ...new Set(ListStockTransfer.map((item) => item.locationTo)),
      ].filter(Boolean);

      const statuses = [
        ...new Set(ListStockTransfer.map((item) => item.status)),
      ].filter(Boolean);

      setFilterValues({
        locationsFrom,
        locationsTo,
        statuses,
      });
    }
  }, [ListStockTransfer]);

  // Apply filters whenever activeFilters or ListStockTransfer changes
  useEffect(() => {
    const filteredData = ListStockTransfer.filter((transfer) => {
      const transferDate = new Date(transfer.data);

      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);

        dateMatch = transferDate >= startDate && transferDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = transferDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = transferDate <= endDate;
      }

      const locationFromMatch =
        activeFilters.locationFrom === "" ||
        transfer.locationFrom === Number(activeFilters.locationFrom);

      const locationToMatch =
        activeFilters.locationTo === "" ||
        transfer.locationTo === Number(activeFilters.locationTo);

      // Status filter
      const statusMatch =
        activeFilters.status === "" || transfer.status === activeFilters.status;

      return dateMatch && locationFromMatch && locationToMatch && statusMatch;
    });

    setFilteredStockTransfers(filteredData);
  }, [activeFilters, ListStockTransfer]);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setActiveFilters({
      startDate: "",
      endDate: "",
      locationFrom: "",
      locationTo: "",
      status: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredStockTransfers.map((StockTransfer) => ({
      Data: StockTransfer.data,
      ReferenceNo: StockTransfer.referenceNo,
      LocationFrom: StockTransfer.locationFrom,
      LocationTo: StockTransfer.locationTo,
      Status: StockTransfer.status,
      ShippingCharges: StockTransfer.shippingCharges,
      TotalAmount: StockTransfer.totalAmount,
      AdditionalNotes: StockTransfer.additionalNotes,
    }));

    const csv = [
      [
        "Data",
        "Reference No",
        "Location (From)",
        "Location (To)",
        "Status",
        "Shipping Charges",
        "Total Amount",
        "Additional Notes",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "ListStockTransfer.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredStockTransfers.map((StockTransfer) => ({
        Data: StockTransfer.data,
        ReferenceNo: StockTransfer.referenceNo,
        LocationFrom: StockTransfer.locationFrom,
        LocationTo: StockTransfer.locationTo,
        Status: StockTransfer.status,
        ShippingCharges: StockTransfer.shippingCharges,
        TotalAmount: StockTransfer.totalAmount,
        AdditionalNotes: StockTransfer.additionalNotes,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ListStockTransfer");
    XLSX.writeFile(wb, "ListStockTransfer.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const headers = [
      "Data",
      "Reference No",
      "Location (From)",
      "Location (To)",
      "Status",
      "Shipping Charges",
      "Total Amount",
      "Additional Notes",
    ];

    const body = filteredStockTransfers
      .slice(startIndex, endIndex)
      .map((transfer) => [
        transfer.data,
        transfer.referenceNo,
        transfer.locationFrom,
        transfer.locationTo,
        transfer.status,
        transfer.shippingCharges,
        transfer.totalAmount,
        transfer.additionalNotes,
      ]);

    doc.text("Stock Transfer List", 14, 20);
    doc.setFontSize(12);
    doc.text(
      "Below is the list of stock transfers with their details:",
      14,
      30
    );

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

    doc.save("StockTransferList.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const printData = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    const tableContent = `
      <html>
        <head>
          <title>Print Stock Transfer Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Stock Transfer Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.data ? "<th>Data</th>" : ""}
                ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
                ${
                  columnsVisibility.locationFrom
                    ? "<th>Location (From)</th>"
                    : ""
                }
                ${columnsVisibility.locationTo ? "<th>Location (To)</th>" : ""}
                ${columnsVisibility.status ? "<th>Status</th>" : ""}
                ${
                  columnsVisibility.shippingCharges
                    ? "<th>Shipping Charges</th>"
                    : ""
                }
                ${columnsVisibility.totalAmount ? "<th>Total Amount</th>" : ""}
                ${
                  columnsVisibility.additionalNotes
                    ? "<th>Additional Notes</th>"
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${filteredStockTransfers
                .slice(startIndex, endIndex)
                .map(
                  (StockTransfer) => `
                <tr>
                  ${
                    columnsVisibility.data
                      ? `<td>${StockTransfer.data}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.referenceNo
                      ? `<td>${StockTransfer.referenceNo}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.locationFrom
                      ? `<td>${StockTransfer.locationFrom}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.locationTo
                      ? `<td>${StockTransfer.locationTo}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.status
                      ? `<td>${StockTransfer.status}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.shippingCharges
                      ? `<td>${StockTransfer.shippingCharges}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.totalAmount
                      ? `<td>${StockTransfer.totalAmount}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.additionalNotes
                      ? `<td>${StockTransfer.additionalNotes}</td>`
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

    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleSaveUnit = async () => {
    try {
      if (modalType === "edit" && currentListStock) {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transfer/update/${currentListStock.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentListStock.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update unit");
        }

        const updatedUnit = await response.json();
        setListStockTransfer((prevUnits) =>
          prevUnits.map((unit) =>
            unit.id === updatedUnit.id ? updatedUnit : unit
          )
        );
        closeModal();
        alert("Unit updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transfer/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to add unit");
        }

        const newUnit = await response.json();
        setListStockTransfer((prevUnits) => [...prevUnits, newUnit]);
        closeModal();
        alert("Unit added successfully!");
      }
    } catch (error) {
      console.error("Error saving unit:", error);
      alert("Error saving unit");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentListStock(null);
    setFormData({
      data: "",
      referenceNo: "",
      locationFrom: "",
      locationTo: "",
      status: "",
      shippingCharges: "",
      totalAmount: "",
      additionalNotes: "",
    });
  };

  const handleEdit = (id) => {
    const StockTransferToEdit = ListStockTransfer.find(
      (StockTransfer) => StockTransfer.id === id
    );
    if (StockTransferToEdit) {
      setCurrentListStock(StockTransferToEdit);
      setFormData({
        date: StockTransferToEdit.date,
        referenceNumber: StockTransferToEdit.referenceNumber,
        locationFrom: StockTransferToEdit.locationFrom,
        locationTo: StockTransferToEdit.locationTo,
        status: StockTransferToEdit.status,
        shippingCharges: StockTransferToEdit.shippingCharges,
        totalAmount: StockTransferToEdit.totalAmount,
        note: StockTransferToEdit.note,
      });
      setModalType("edit");
    }
  };

  const handleView = (id) => {
    const StockTransferToView = ListStockTransfer.find(
      (StockTransfer) => StockTransfer.id === id
    );
    if (StockTransferToView) {
      setCurrentListStock(StockTransferToView);
      setModalType("view");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transfer/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setListStockTransfer((prevUnits) =>
            prevUnits.filter((unit) => unit.id !== id)
          );
          alert("Unit deleted successfully!");
        } else {
          alert("Failed to delete unit.");
        }
      } catch (error) {
        console.error("Error deleting unit:", error);
        alert("Error deleting unit");
      }
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Stock Transfer</h1>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            {/* Filter Card */}
            <div className="card card-default rounded-4 border-0 cardHover mb-3">
              <div
                className="my- p-3 d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className={`fa fa-filter me-3`}></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row py-2 g-2">
                      {/* Start Date Picker */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="startDate"
                            value={activeFilters.startDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* End Date Picker */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">End Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="endDate"
                            value={activeFilters.endDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* Location From Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Location From:</label>
                          <select
                            name="locationFrom"
                            value={activeFilters.locationFrom}
                            onChange={handleFilterChange}
                            className="form-control"
                          >
                            <option value="">All</option>
                            {filterValues.locationsFrom.map((id) => (
                              <option key={id} value={id}>
                                {locationMap[id] || "Unknown Location"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Location To Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Location To:</label>
                          <select
                            name="locationTo"
                            value={activeFilters.locationTo}
                            onChange={handleFilterChange}
                            className="form-control"
                          >
                            <option value="">All</option>
                            {filterValues.locationsTo.map((id) => (
                              <option key={id} value={id}>
                                {locationMap[id] || "Unknown Location"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Status:</label>
                          <select
                            className="form-select"
                            name="status"
                            value={activeFilters.status}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Statuses</option>
                            {filterValues.statuses.map((status, index) => (
                              <option key={`status-${index}`} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-12 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={resetFilters}
                          disabled={!Object.values(activeFilters).some(Boolean)}
                        >
                          <i className="fa fa-times me-1"></i> Reset All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <Link to="/AddStockTransfer" className="btn btn-add">
                  <i className="fas fa-plus"></i> Add
                </Link>
              </div>

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
                        {columnsVisibility.data && <th>Date</th>}
                        {columnsVisibility.referenceNo && <th>Reference No</th>}
                        {columnsVisibility.locationFrom && (
                          <th>Location (From)</th>
                        )}
                        {columnsVisibility.locationTo && <th>Location (To)</th>}
                        {columnsVisibility.status && <th>Status</th>}
                        {columnsVisibility.shippingCharges && (
                          <th>Shipping Charges</th>
                        )}
                        {columnsVisibility.totalAmount && <th>Total Amount</th>}
                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}
                        {columnsVisibility.action && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStockTransfers
                        .slice(startIndex, endIndex)
                        .map((StockTransfer) => (
                          <tr key={StockTransfer.id}>
                            {columnsVisibility.data && (
                              <td>{StockTransfer.date}</td>
                            )}
                            {columnsVisibility.referenceNo && (
                              <td>{StockTransfer.referenceNumber}</td>
                            )}
                            {columnsVisibility.locationFrom && (
                              <td>
                                {locationMap[StockTransfer.locationFrom] || "—"}
                              </td>
                            )}

                            {columnsVisibility.locationTo && (
                              <td>
                                {locationMap[StockTransfer.locationTo] || "—"}
                              </td>
                            )}

                            {columnsVisibility.status && (
                              <td>{StockTransfer.status}</td>
                            )}
                            {columnsVisibility.shippingCharges && (
                              <td>{StockTransfer.shippingCharges}</td>
                            )}
                            {columnsVisibility.totalAmount && (
                              <td>{StockTransfer.totalAmount}</td>
                            )}
                            {columnsVisibility.additionalNotes && (
                              <td>{StockTransfer.note}</td>
                            )}
                            {columnsVisibility.action && (
                              <td>
                                <button
                                  className="btn btn-edit btn-sm mr-2"
                                  onClick={() => handleEdit(StockTransfer.id)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleView(StockTransfer.id)}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn btn-delete btn-sm"
                                  onClick={() => handleDelete(StockTransfer.id)}
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </td>
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

        {/* Modal */}
        {modalType && (
          <div
            className="modal fade show"
            id="unitModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="unitModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="unitModalLabel">
                    {modalType === "add"
                      ? "Add Unit"
                      : modalType === "edit"
                      ? "Edit Unit"
                      : "View Unit"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveUnit();
                    }}
                  >
                    {modalType === "edit" && (
                      <div>
                        <div className="form-group">
                          <label htmlFor="date">Date</label>
                          <input
                            type="text"
                            className="form-control"
                            id="date"
                            value={formData.date}
                            onChange={handleFormChange}
                            placeholder="Enter date"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="referenceNumber">Reference No</label>
                          <input
                            type="text"
                            className="form-control"
                            id="referenceNumber"
                            value={formData.referenceNumber}
                            onChange={handleFormChange}
                            placeholder="Enter reference number"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="locationFrom">Location (From)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="locationFrom"
                            value={formData.locationFrom}
                            onChange={handleFormChange}
                            placeholder="Enter location from"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="locationTo">Location (To)</label>
                          <input
                            type="text"
                            className="form-control"
                            id="locationTo"
                            value={formData.locationTo}
                            onChange={handleFormChange}
                            placeholder="Enter location to"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="status">Status</label>
                          <input
                            type="text"
                            className="form-control"
                            id="status"
                            value={formData.status}
                            onChange={handleFormChange}
                            placeholder="Enter status"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="shippingCharges">
                            Shipping Charges
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="shippingCharges"
                            value={formData.shippingCharges}
                            onChange={handleFormChange}
                            placeholder="Enter shipping charges"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="totalAmount">Total Amount</label>
                          <input
                            type="number"
                            className="form-control"
                            id="totalAmount"
                            value={formData.totalAmount}
                            onChange={handleFormChange}
                            placeholder="Enter total amount"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="note">Additional Notes</label>
                          <textarea
                            className="form-control"
                            id="note"
                            value={formData.note}
                            onChange={handleFormChange}
                            placeholder="Enter additional notes"
                          />
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentListStock && (
                      <div>
                        <p>
                          <strong>Date:</strong> {currentListStock.date}
                        </p>
                        <p>
                          <strong>Reference No:</strong>{" "}
                          {currentListStock.referenceNumber}
                        </p>
                        <p>
                          <strong>Location (From):</strong>{" "}
                          {currentListStock.locationFrom}
                        </p>
                        <p>
                          <strong>Location (To):</strong>{" "}
                          {currentListStock.locationTo}
                        </p>
                        <p>
                          <strong>Status:</strong> {currentListStock.status}
                        </p>
                        <p>
                          <strong>Shipping Charges:</strong>{" "}
                          {currentListStock.shippingCharges}
                        </p>
                        <p>
                          <strong>Total Amount:</strong>{" "}
                          {currentListStock.totalAmount}
                        </p>
                        <p>
                          <strong>Additional Notes:</strong>{" "}
                          {currentListStock.note}
                        </p>
                      </div>
                    )}
                    <div className="modal-footer">
                      {modalType === "add" || modalType === "edit" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={closeModal}
                          >
                            Close
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListStockTransfer;
