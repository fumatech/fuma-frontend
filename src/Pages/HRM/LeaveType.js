import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function LeaveType({ userRoles }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLeaveType, setCurrentLeaveType] = useState({
    id: null,
    type: "",
    maxCount: "",
    leaveInterval: 3, // Default to "none" (3)
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [columnsVisibility, setColumnsVisibility] = useState({
    type: true,
    maxCount: true,
    leaveInterval: true,
  });

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all leave types
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/leave/getall`
        );
        setLeaveTypes(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchLeaveTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLeaveType((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIntervalChange = (value) => {
    setCurrentLeaveType((prev) => ({
      ...prev,
      leaveInterval: parseInt(value), // Convert to number
    }));
  };

  const getIntervalLabel = (value) => {
    switch (value) {
      case 1:
        return "Current month";
      case 2:
        return "Current financial year";
      case 3:
        return "None";
      default:
        return "N/A";
    }
  };

  const handleAddLeaveType = async (e) => {
    e.preventDefault();
    if (!currentLeaveType.type.trim()) {
      toast.warning("Leave Type is required");
      return;
    }

    try {
      if (isEditMode) {
        // Update existing leave type
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/leave/update/${currentLeaveType.id}`,
          currentLeaveType
        );
        setLeaveTypes(
          leaveTypes.map((item) =>
            item.id === currentLeaveType.id ? currentLeaveType : item
          )
        );
      } else {
        // Add new leave type
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/leave/add`,
          currentLeaveType
        );
        setLeaveTypes([...leaveTypes, response.data]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setCurrentLeaveType({
      id: null,
      type: "",
      maxCount: "",
      leaveInterval: 3, // Reset to "none" (3)
    });
    setIsEditMode(false);
  };

  // ... (keep all the export functions the same as before, just update the field names)

  const exportCSV = () => {
    const csvData = leaveTypes.map((item) => ({
      "Leave Type": item.type,
      "Max Leave Count": item.maxCount || "N/A",
      Interval: getIntervalLabel(item.leaveInterval),
    }));

    const csv = [
      ["Leave Type", "Max Leave Count", "Interval"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "leave_types.csv");
  };

  const exportExcel = () => {
    const formattedData = leaveTypes.map((item) => ({
      "Leave Type": item.type,
      "Max Leave Count": item.maxCount || "N/A",
      Interval: getIntervalLabel(item.leaveInterval),
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Types");
    XLSX.writeFile(wb, "leave_types.xlsx");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print Leave Types</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="httpss://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Leave Type", "Max Leave Count", "Interval"]],
      body: leaveTypes.map((item) => [
        item.type,
        item.maxCount || "N/A",
        getIntervalLabel(item.leaveInterval),
      ]),
    });
    doc.save("leave_types.pdf");
  };

  // ... (keep toggleColumn, handleEntriesChange functions the same)

  const handleEdit = (leaveType) => {
    setCurrentLeaveType({
      id: leaveType.id,
      type: leaveType.type,
      maxCount: leaveType.maxCount,
      leaveInterval: leaveType.leaveInterval || 3, // Default to "none" (3) if not set
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave type?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/leave/delete/${id}`
        );
        setLeaveTypes(leaveTypes.filter((item) => item.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedLeaveTypes = leaveTypes.slice(startIndex, endIndex);

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div className="wrapper">
      <div>
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">Leave Types</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="text-right">
                <button
                  className="btn btn-add"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                >
                  Add
                </button>
              </div>
              <div className="card-body">
                {/* ... (keep the export buttons and table header the same) */}
                <div className="tw-flow-root tw-border-gray-200">
                  <div className="">
                    <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                      <div className="table-responsive">
                        <div id="table-container">
                          <table className="table table-bordered table-striped">
                            <thead>
                              <tr>
                                {columnsVisibility.type && <th>Leave Type</th>}
                                {columnsVisibility.maxCount && (
                                  <th>Max Leave Count</th>
                                )}
                                {/* {columnsVisibility.leaveInterval && (
                                  <th>Interval</th>
                                )} */}
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedLeaveTypes.map((item) => (
                                <tr key={item.id}>
                                  {columnsVisibility.type && (
                                    <td>{item.type}</td>
                                  )}
                                  {columnsVisibility.maxCount && (
                                    <td>{item.maxCount || "N/A"}</td>
                                  )}
                                  {/* {columnsVisibility.leaveInterval && (
                                    <td>
                                      {getIntervalLabel(item.leaveInterval)}
                                    </td>
                                  )} */}
                                  <td>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="btn btn-edit"
                                    >
                                      <i className="fas fa-edit btn-icon"></i>{" "}
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="btn btn-delete ml-2"
                                    >
                                      <i className="fas fa-trash btn-icon"></i>{" "}
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add/Edit Leave Type Modal */}
          {isModalOpen && (
            <>
              <div
                className="modal fade show"
                style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              ></div>
              <div
                className="modal fade show"
                style={{
                  display: "block",
                  overflowX: "hidden",
                  overflowY: "auto",
                }}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="addLeaveTypeModalTitle"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsModalOpen(false);
                    resetForm();
                  }
                }}
              >
                <div
                  className="modal-dialog modal-lg modal-dialog-centered"
                  role="document"
                >
                  <div className="modal-content">
                    <form onSubmit={handleAddLeaveType}>
                      <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title" id="addLeaveTypeModalTitle">
                          {isEditMode ? "Edit Leave Type" : "Add Leave Type"}
                        </h5>
                        <button
                          type="button"
                          className="close text-white"
                          aria-label="Close"
                          onClick={() => {
                            setIsModalOpen(false);
                            resetForm();
                          }}
                        >
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <div className="form-group">
                          <label htmlFor="type" className="font-weight-bold">
                            Leave Type:*
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="type"
                            name="type"
                            value={currentLeaveType.type}
                            onChange={handleInputChange}
                            placeholder="Enter leave type"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label
                            htmlFor="maxCount"
                            className="font-weight-bold"
                          >
                            Max Leave Count:
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="maxCount"
                            name="maxCount"
                            value={currentLeaveType.maxCount}
                            onChange={handleInputChange}
                            placeholder="Enter max leave count"
                          />
                        </div>

                        <div className="form-group">
                          <label className="font-weight-bold">
                            Leave Count Interval:
                          </label>
                          <div className="pl-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id="month"
                                name="leaveInterval"
                                value="1"
                                checked={currentLeaveType.leaveInterval === 1}
                                onChange={() => handleIntervalChange(1)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="month"
                              >
                                Current month
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id="year"
                                name="leaveInterval"
                                value="2"
                                checked={currentLeaveType.leaveInterval === 2}
                                onChange={() => handleIntervalChange(2)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="year"
                              >
                                Current financial year
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id="none"
                                name="leaveInterval"
                                value="3"
                                checked={currentLeaveType.leaveInterval === 3}
                                onChange={() => handleIntervalChange(3)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="none"
                              >
                                None
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setIsModalOpen(false);
                            resetForm();
                          }}
                        >
                          Close
                        </button>
                        <button type="submit" className="btn btn-primary">
                          {isEditMode ? "Update" : "Save"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default LeaveType;
