import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { toast } from "react-toastify";

const Holiday = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const [columnsVisibility, setColumnsVisibility] = useState({
    Name: true,
    Date: true,
    BusinessLocation: true,
    Note: true,
    Action: true,
  });
  const [businessLocations, setBusinessLocations] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    startDate: null,
    endDate: null,
    businessLocationId: 0, // DEFAULT = All
    note: "",
  });

  const fetchBusinessLocations = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/business-locations/getall`
      );
      setBusinessLocations(res.data);
    } catch (error) {
      toast.error("Failed to load business locations");
    }
  };

  // Fetch holidays from API
  const fetchHolidays = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/holiday/getall`
      );
      setHolidays(response.data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchBusinessLocations();
  }, []);

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const exportCSV = () => toast.warning("Export CSV functionality");
  const exportExcel = () => toast.warning("Export Excel functionality");
  const printData = () => toast.warning("Print functionality");
  const exportPDF = () => toast.warning("Export PDF functionality");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const openModal = (holiday = null) => {
    if (holiday) {
      setFormData({
        id: holiday.id,
        name: holiday.name,
        startDate: holiday.startDate ? new Date(holiday.startDate) : null,
        endDate: holiday.endDate ? new Date(holiday.endDate) : null,
        businessLocationId:
          holiday.businessLocationId !== undefined
            ? holiday.businessLocationId
            : 0,
        note: holiday.note || "",
      });
      setEditMode(true);
    } else {
      setFormData({
        id: null,
        name: "",
        startDate: null,
        endDate: null,
        businessLocationId: 0, // ✅ DEFAULT ALL
        note: "",
      });
      setEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        businessLocationId: formData.businessLocationId,
        note: formData.note,
      };

      if (editMode) {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/holiday/update/${formData.id}`,
          payload
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/holiday/add`,
          payload
        );
      }

      if (editMode) {
        toast.success("Holiday Edited Successfully...!!!");
      } else {
        toast.success("Holiday Added Successfully...!!!");
      }

      fetchHolidays();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving holiday:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  };

  const getBusinessLocationName = (id) => {
    if (id === 0) return "All";
    const location = businessLocations.find((loc) => loc.id === id);
    return location ? location.name : "-";
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/holiday/delete/${id}`
        );

        toast.success("Holiday deleted successfully!");
        fetchHolidays();
      } catch (error) {
        console.error("Error deleting holiday:", error);
        toast.error("Failed to delete holiday. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  return (
    <>
      <div className="wrapper" style={{ overflowY: "auto" }}>
        <div className="">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading m-0">Holiday</h1>
                  <span className="display-inline sub-heading">
                    Manage Holiday
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">
              <div className="card cardHover rounded-4 border-0">
                <div className="text-right p-3">
                  <button className="btn btn-add" onClick={() => openModal()}>
                    <i className="fas fa-plus"></i> Add
                  </button>

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
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={75}>75</option>
                          <option value={100}>100</option>
                        </select>
                        Entries
                      </div>
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
                      style={{ minWidth: "1000px" }}
                    >
                      <thead>
                        <tr role="row">
                          {columnsVisibility.Name && (
                            <th
                              className="sorting_asc"
                              tabIndex="0"
                              aria-controls="holidays_table"
                              style={{ width: "188.444px" }}
                              aria-sort="ascending"
                              aria-label="Name: activate to sort column descending"
                            >
                              Name
                            </th>
                          )}
                          {columnsVisibility.Date && (
                            <th
                              className="sorting"
                              tabIndex="0"
                              aria-controls="holidays_table"
                              style={{ width: "166.444px" }}
                              aria-label="Date: activate to sort column ascending"
                            >
                              Date
                            </th>
                          )}
                          {columnsVisibility.BusinessLocation && (
                            <th
                              className="sorting"
                              tabIndex="0"
                              aria-controls="holidays_table"
                              aria-label="Business Location: activate to sort column ascending"
                            >
                              Business Location
                            </th>
                          )}
                          {columnsVisibility.Note && (
                            <th
                              className="sorting"
                              tabIndex="0"
                              aria-controls="holidays_table"
                              aria-label="Note: activate to sort column ascending"
                            >
                              Note
                            </th>
                          )}
                          {columnsVisibility.Action && (
                            <th
                              className="sorting_disabled"
                              aria-label="Action"
                            >
                              Action
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.length === 0 ? (
                          <tr className="odd">
                            <td
                              valign="top"
                              colSpan={
                                Object.values(columnsVisibility).filter(Boolean)
                                  .length
                              }
                              className="dataTables_empty"
                            >
                              No data available in table
                            </td>
                          </tr>
                        ) : (
                          holidays.map((holiday) => (
                            <tr key={holiday.id}>
                              {columnsVisibility.Name && (
                                <td>{holiday.name}</td>
                              )}
                              {columnsVisibility.Date && (
                                <td>
                                  {formatDate(holiday.startDate)} -{" "}
                                  {formatDate(holiday.endDate)}
                                  <br />
                                  <small className="text-muted">
                                    (
                                    {calculateDays(
                                      holiday.startDate,
                                      holiday.endDate
                                    )}{" "}
                                    days)
                                  </small>
                                </td>
                              )}
                              {columnsVisibility.BusinessLocation && (
                                <td>
                                  {getBusinessLocationName(
                                    holiday.businessLocationId
                                  )}
                                </td>
                              )}

                              {columnsVisibility.Note && (
                                <td>{holiday.note || "-"}</td>
                              )}
                              {columnsVisibility.Action && (
                                <td>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => openModal(holiday)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger ml-2"
                                    onClick={() => handleDelete(holiday.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h4 className="modal-title">
                    {editMode ? "Edit Holiday" : "Add Holiday"}
                  </h4>
                  <button
                    type="button"
                    className="close text-white"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <div className="modal-body">
                  <div className="row">
                    <div className="form-group col-md-12">
                      <label htmlFor="name">Name:*</label>
                      <input
                        className="form-control"
                        placeholder="Name"
                        required
                        name="name"
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group col-md-6">
                      <label htmlFor="start_date">Start Date:*</label>
                      <div className="input-group date">
                        <DatePicker
                          selected={formData.startDate}
                          onChange={(date) =>
                            handleDateChange(date, "startDate")
                          }
                          className="form-control"
                          placeholderText="Start Date"
                          dateFormat="yyyy-MM-dd"
                          required
                        />
                        <span className="input-group-addon">
                          <i className="fa fa-calendar"></i>
                        </span>
                      </div>
                    </div>

                    <div className="form-group col-md-6">
                      <label htmlFor="end_date">End Date:*</label>
                      <div className="input-group date">
                        <DatePicker
                          selected={formData.endDate}
                          onChange={(date) => handleDateChange(date, "endDate")}
                          className="form-control"
                          placeholderText="End Date"
                          dateFormat="yyyy-MM-dd"
                          required
                        />
                        <span className="input-group-addon">
                          <i className="fa fa-calendar"></i>
                        </span>
                      </div>
                    </div>
                    <div className="form-group col-md-12">
                      <label htmlFor="note">Business Location :</label>
                      <select
                        className="form-control"
                        id="businessLocationId"
                        name="businessLocationId"
                        value={formData.businessLocationId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            businessLocationId: Number(e.target.value),
                          }))
                        }
                      >
                        <option value={0}>All</option>
                        {businessLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-12">
                      <label htmlFor="note">Note:</label>
                      <textarea
                        className="form-control"
                        placeholder="Note"
                        rows="3"
                        name="note"
                        id="note"
                        value={formData.note}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm mr-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Holiday;
