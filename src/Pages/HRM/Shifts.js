import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Shifts = () => {
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    shiftType: true,
    startTime: true,
    endTime: true,
    holiday: true,
    autoClockOutTime: true,
    actions: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftData, setShiftData] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    shiftType: "",
    startTime: "",
    endTime: "",
    holiday: [],
    autoClockOut: 0,
    autoClockOutTime: "",
  });

  const holidayOptions = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  // Fetch shifts from backend
  const fetchShifts = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/shift/getall`
      );
      setShiftData(response.data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // Toggle column visibility
  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  // Handle modal open/close
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Open modal with data (edit or add new)
  const openModal = (shift = null) => {
    if (shift) {
      // Edit existing shift
      setFormData({
        ...shift,
        shiftType:
          shift.shiftType === 1
            ? "fixed_shift"
            : shift.shiftType === 2
            ? "flexible_shift"
            : "",
        autoClockOut: shift.autoClockOut || 0,
        autoClockOutTime: shift.autoClockOutTime || "",
      });
    } else {
      // Add new shift
      setFormData({
        id: null,
        name: "",
        shiftType: "",
        startTime: "",
        endTime: "",
        holiday: [],
        autoClockOut: 0,
        autoClockOutTime: "",
      });
    }
    setIsModalOpen(true);
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  // Handle holiday selection change
  const handleHolidayChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData((prev) => ({
      ...prev,
      holiday: selected,
    }));
  };

  // Handle form submission (save shift)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        shiftType:
          formData.shiftType === "fixed_shift"
            ? 1
            : formData.shiftType === "flexible_shift"
            ? 2
            : null,
      };

      if (formData.id) {
        // Update existing shift
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/shift/update/${formData.id}`,
          dataToSend
        );
      } else {
        // Create new shift
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/shift/add`,
          dataToSend
        );
      }
      fetchShifts(); // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving shift:", error);
    }
  };

  // Handle delete shift
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/shift/delete/${id}`
      );
      fetchShifts(); // Refresh the list
    } catch (error) {
      console.error("Error deleting shift:", error);
    }
  };

  // Format shift type for display
  const formatShiftType = (type) => {
    switch (type) {
      case 1:
        return "Fixed Shift";
      case 2:
        return "Flexible Shift";
      default:
        return "Unknown";
    }
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return "";
    return time.slice(0, 5); // Display only HH:MM
  };

  return (
    <>
      <section className="content">
        <div className="container-fluid">
          <div className="card cardHover rounded-4 border-0">
            <div className="text-right p-3">
              <button className="btn btn-add" onClick={() => openModal()}>
                <i className="fas fa-plus"></i> Add
              </button>
              <div className="card-body">
                {/* Table */}
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                      Show
                    </label>
                    <select
                      id="entriesPerPage"
                      className="form-control form-control-sm mr-2"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                    Entries
                  </div>
                </div>
                <div className="col d-flex flex-wrap align-items-center">
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-file-csv"></i> Export CSV
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-file-excel"></i> Export Excel
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-print"></i> Print
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
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
                      className="dropdown-menu"
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
                          <span
                            className="btn border-0 bg-transparent p-0 m-0"
                            onClick={(e) => handleDropdownItemClick(col, e)}
                          >
                            {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div id="table-container" style={{ overflowX: "auto" }}>
                <table
                  className="table table-bordered table-hover"
                  id="example1"
                >
                  <thead>
                    <tr role="row">
                      {columnsVisibility.name && (
                        <th className="sorting_asc">Name</th>
                      )}
                      {columnsVisibility.shiftType && (
                        <th className="sorting">Shift Type</th>
                      )}
                      {columnsVisibility.startTime && (
                        <th className="sorting">Start time</th>
                      )}
                      {columnsVisibility.endTime && (
                        <th className="sorting">End time</th>
                      )}
                      {columnsVisibility.autoClockOutTime && (
                        <th className="sorting">autoClockOutTime</th>
                      )}
                      {columnsVisibility.holiday && (
                        <th className="sorting_disabled">Holiday</th>
                      )}
                      {columnsVisibility.actions && (
                        <th className="sorting">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {shiftData.map((shift) => (
                      <tr key={shift.id} role="row">
                        {columnsVisibility.name && <td>{shift.name}</td>}
                        {columnsVisibility.shiftType && (
                          <td>{formatShiftType(shift.shiftType)}</td>
                        )}
                        {columnsVisibility.startTime && (
                          <td>{formatTime(shift.startTime)}</td>
                        )}
                        {columnsVisibility.endTime && (
                          <td>{formatTime(shift.endTime)}</td>
                        )}
                        {columnsVisibility.autoClockOutTime && (
                          <td>{formatTime(shift.autoClockOutTime)}</td>
                        )}
                        {columnsVisibility.holiday && (
                          <td>
                            {shift.holiday && shift.holiday.length > 0
                              ? shift.holiday.join(", ")
                              : "None"}
                          </td>
                        )}
                        {columnsVisibility.actions && (
                          <td className="text-right">
                            <div className="btn-group btn-group-sm btn-icon-only">
                              <button
                                type="button"
                                className="btn-edit"
                                onClick={() => openModal(shift)}
                              >
                                <i className="fas fa-edit btn-icon"></i> Edit
                              </button>
                              {/* <button
                                type="button"
                                className="btn-view"
                                onClick={() => openModal(shift)}
                              >
                                <i className="fas fa-eye btn-icon"></i> View
                              </button> */}
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDelete(shift.id)}
                              >
                                <i className="fas fa-trash btn-icon"></i> Delete
                              </button>
                            </div>
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
      {isModalOpen && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div
            className="modal fade show"
            style={{ display: "block", overflowX: "hidden", overflowY: "auto" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="addShiftModalTitle"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title" id="addShiftModalTitle">
                      {formData.id ? "Edit Shift" : "Add Shift"}
                    </h5>
                    <button
                      type="button"
                      className="close text-white"
                      aria-label="Close"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="name" className="font-weight-bold">
                            Name:*
                          </label>
                          <input
                            className="form-control"
                            placeholder="Name"
                            required
                            name="name"
                            type="text"
                            id="name"
                            aria-required="true"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="shiftType"
                            className="font-weight-bold"
                          >
                            Shift Type:*
                          </label>
                          <select
                            className="form-control"
                            id="shiftType"
                            name="shiftType"
                            value={formData.shiftType}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select shift type</option>
                            <option value="fixed_shift">Fixed shift</option>
                            <option value="flexible_shift">
                              Flexible shift
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="start_time"
                            className="font-weight-bold"
                          >
                            Start time:*
                          </label>
                          <input
                            className="form-control"
                            placeholder="Start time"
                            required
                            id="start_time"
                            name="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="end_time"
                            className="font-weight-bold"
                          >
                            End time:*
                          </label>
                          <input
                            className="form-control"
                            placeholder="End time"
                            required
                            id="end_time"
                            name="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="holidays" className="font-weight-bold">
                        Holiday:
                      </label>
                      <select
                        className="form-control"
                        id="holidays"
                        name="holiday"
                        multiple
                        size="5"
                        value={formData.holiday}
                        onChange={handleHolidayChange}
                      >
                        {holidayOptions.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                      <small className="form-text text-muted">
                        Hold CTRL (Windows) or CMD (Mac) to select multiple days
                      </small>
                    </div>

                    <div className="form-group d-flex align-items-center mt-3">
                      <div className="custom-control custom-checkbox">
                        <input
                          className="custom-control-input"
                          id="autoClockOut"
                          name="autoClockOut"
                          type="checkbox"
                          checked={formData.autoClockOut === 1}
                          onChange={handleInputChange}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor="autoClockOut"
                        >
                          Do auto clock out
                        </label>
                      </div>
                    </div>

                    {formData.autoClockOut === 1 && (
                      <div className="form-group">
                        <label
                          htmlFor="auto_clockout_time"
                          className="font-weight-bold"
                        >
                          Auto clock out time:
                        </label>
                        <input
                          className="form-control"
                          placeholder="Auto clock out time"
                          name="autoClockOutTime"
                          type="time"
                          id="auto_clockout_time"
                          value={formData.autoClockOutTime}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">
                      {formData.id ? "Save Changes" : "Submit"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Shifts;
