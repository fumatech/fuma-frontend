import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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
import { toast } from "react-toastify";

const ListStockTransfer = () => {
  const [ListStockTransfer, setListStockTransfer] = useState([]);
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchStockTransfer();
  }, []);
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

  const handleEdit = (id) => {
    const StockTransferToEdit = ListStockTransfer.find(
      (StockTransfer) => StockTransfer.id === id
    );

    if (StockTransferToEdit) {
      // If you want to set data first (optional)
      setCurrentListStock(StockTransferToEdit);
      setFormData({
        data: StockTransferToEdit.data,
        referenceNo: StockTransferToEdit.referenceNo,
        locationFrom: StockTransferToEdit.locationFrom,
        locationTo: StockTransferToEdit.locationTo,
        status: StockTransferToEdit.status,
        shippingCharges: StockTransferToEdit.shippingCharges,
        totalAmount: StockTransferToEdit.totalAmount,
        additionalNotes: StockTransferToEdit.additionalNotes,
      });

      // Then redirect to edit page
      navigate(`/EditStockTransfer/${id}`, {
        state: {
          stockTransferData: StockTransferToEdit,
        },
      });
    }
  };

  const handleView = (id) => {
    const StockTransferToView = ListStockTransfer.find(
      (StockTransfer) => StockTransfer.id === id
    );

    if (StockTransferToView) {
      // Navigate to view page with ID and data
      navigate(`/ViewStockTransfer/${id}`, {
        state: {
          stockTransferData: StockTransferToView,
        },
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ?")) {
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
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete...");
        }
      } catch (error) {
        //console.error("Error deleting unit:", error);
        toast.error("Error deleting...");
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
                            className="form-select"
                            name="locationFrom"
                            value={activeFilters.locationFrom}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Locations</option>
                            {filterValues.locationsFrom.map(
                              (location, index) => (
                                <option key={`from-${index}`} value={location}>
                                  {locationMap[location] || location}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Location To Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Location To:</label>
                          <select
                            className="form-select"
                            name="locationTo"
                            value={activeFilters.locationTo}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Locations</option>
                            {filterValues.locationsTo.map((location, index) => (
                              <option key={`to-${index}`} value={location}>
                                {locationMap[location] || location}
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
                        {columnsVisibility.data && <th>Data</th>}
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
      </div>
    </div>
  );
};

export default ListStockTransfer;
