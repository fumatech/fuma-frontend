import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PayComponents = () => {
  const [columnsVisibility, setColumnsVisibility] = useState({
    description: true,
    type: true,
    amount: true,
    applicableDate: true,
    employee: true,
    actions: true,
  });

  const [payComponents, setPayComponents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    description: "",
    type: "",
    amountType: "",
    amount: "",
    applicableDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for dropdowns
  const [types] = useState(["Bonus", "Allowance", "Deduction", "Incentive"]);
  const [amountTypes] = useState(["Fixed", "Percentage", "Variable"]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/user/getall`)
      .then((res) => setEmployees(res.data))
      .catch(() => toast.error("Failed to load employees"));
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

  // Fetch all pay components from API
  const fetchPayComponents = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/pay-component/all`
      );
      setPayComponents(response.data);
    } catch (error) {
      console.error("Error fetching pay components:", error);
    }
  };

  // Handle modal open/close
  const openModal = (component = null) => {
    if (component) {
      // Convert applicableDate from LocalDateTime to date string format
      const date = component.applicableDate
        ? new Date(component.applicableDate).toISOString().split("T")[0]
        : "";

      setFormData({
        ...component,
        applicableDate: date,
      });
    } else {
      setFormData({
        id: null,
        description: "",
        type: "",
        amountType: "",
        amount: "",
        applicableDate: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedEmployees.length === 0) {
      toast.warning("Please select at least one employee");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        description: formData.description,
        type: formData.type,
        amountType: formData.amountType,
        amount: Number(formData.amount),
        applicableDate: formData.applicableDate
          ? new Date(formData.applicableDate).toISOString()
          : null,
        employeeIds: selectedEmployees,
      };

      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/pay-component/bulk`,
        payload
      );

      toast.success("Pay component saved successfully");
      fetchPayComponents();
      setIsModalOpen(false);
      setSelectedEmployees([]);
    } catch (err) {
      toast.error("Failed to save pay component");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this pay component?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/pay-component/${id}`
        );
        fetchPayComponents();
      } catch (error) {
        console.error("Error deleting pay component:", error);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPayComponents();
  }, []);

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
                {/* Table and other components */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        {columnsVisibility.description && <th>Description</th>}
                        {columnsVisibility.type && <th>Type</th>}
                        {columnsVisibility.amount && <th>Amount</th>}
                        {columnsVisibility.applicableDate && <th>Date</th>}
                        {columnsVisibility.actions && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {payComponents.map((comp) => (
                        <tr key={comp.id}>
                          {columnsVisibility.description && (
                            <td>{comp.description}</td>
                          )}
                          {columnsVisibility.type && <td>{comp.type}</td>}
                          {columnsVisibility.amount && <td>{comp.amount}</td>}
                          {columnsVisibility.applicableDate && (
                            <td>{formatDate(comp.applicableDate)}</td>
                          )}
                          {columnsVisibility.actions && (
                            <td>
                              <button
                                onClick={() => openModal(comp)}
                                className="btn-edit"
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(comp.id)}
                                className="btn-delete"
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
        </div>
      </section>

      {/* Pay Component Modal */}
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
            aria-labelledby="addPayComponentModalTitle"
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
                    <h5 className="modal-title" id="addPayComponentModalTitle">
                      {formData.id ? "Edit Pay Component" : "Add Pay Component"}
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
                    <div className="form-group">
                      <label htmlFor="description" className="font-weight-bold">
                        Description:*
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="font-weight-bold">
                        Select Employees:*
                      </label>
                      <select
                        className="form-control"
                        multiple
                        value={selectedEmployees}
                        onChange={(e) =>
                          setSelectedEmployees(
                            Array.from(e.target.selectedOptions, (opt) =>
                              Number(opt.value)
                            )
                          )
                        }
                        required
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstname} {emp.lastname}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        Hold Ctrl (Windows) / Cmd (Mac) to select multiple
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="type" className="font-weight-bold">
                        Type:*
                      </label>
                      <select
                        className="form-control"
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Type</option>
                        {types.map((type, index) => (
                          <option key={index} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group col-md-6">
                        <label
                          htmlFor="amountType"
                          className="font-weight-bold"
                        >
                          Amount Type:*
                        </label>
                        <select
                          className="form-control"
                          id="amountType"
                          name="amountType"
                          value={formData.amountType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Amount Type</option>
                          {amountTypes.map((type, index) => (
                            <option key={index} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>{" "}
                      <div className="form-group col-md-6">
                        <label htmlFor="amount" className="font-weight-bold">
                          Amount:*
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label
                        htmlFor="applicableDate"
                        className="font-weight-bold"
                      >
                        Applicable Date:
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="applicableDate"
                        name="applicableDate"
                        value={formData.applicableDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </button>
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

export default PayComponents;
