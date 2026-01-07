import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { toast } from "react-toastify";

function SalesTargets({ userRoles }) {
  const [users, setUsers] = useState([]);
  const [targets, setTargets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [targetData, setTargetData] = useState([
    {
      fromAmount: "",
      toAmount: "",
      commissionPercent: "",
    },
  ]);

  const [columnsVisibility, setColumnsVisibility] = useState({
    user: true,
    role: true,
    status: true,
  });

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
    fetchTargets();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/user/getall`
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTargets = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/target/getall`
      );
      setTargets(response.data);
    } catch (error) {
      console.error("Error fetching targets:", error);
    }
  };

  const handleSetTargetClick = (user) => {
    setCurrentUser(user);

    // Check if user already has targets
    const userTargets = targets.find((t) => t.employee === user.id);
    if (userTargets) {
      // Convert the target data to the form format
      const formattedTargets = userTargets.totalAmountFrom.map(
        (from, index) => ({
          fromAmount: from.toString(),
          toAmount: userTargets.totalAmountTo[index].toString(),
          commissionPercent: userTargets.commisionPercent[index].toString(),
        })
      );
      setTargetData(formattedTargets);
    } else {
      setTargetData([
        {
          fromAmount: "",
          toAmount: "",
          commissionPercent: "",
        },
      ]);
    }

    setIsModalOpen(true);
  };

  const handleTargetInputChange = (e, index) => {
    const { name, value } = e.target;
    const newTargetData = [...targetData];
    newTargetData[index] = {
      ...newTargetData[index],
      [name]: value,
    };
    setTargetData(newTargetData);
  };

  const addNewTargetLine = () => {
    setTargetData([
      ...targetData,
      {
        fromAmount: "",
        toAmount: "",
        commissionPercent: "",
      },
    ]);
  };

  const removeTargetLine = (index) => {
    if (targetData.length > 1) {
      const newTargetData = [...targetData];
      newTargetData.splice(index, 1);
      setTargetData(newTargetData);
    }
  };

  const handleSubmitTarget = async (e) => {
    e.preventDefault();

    try {
      const targetPayload = {
        employee: currentUser.id,
        totalAmountFrom: targetData.map((t) => parseFloat(t.fromAmount)),
        totalAmountTo: targetData.map((t) => parseFloat(t.toAmount)),
        commisionPercent: targetData.map((t) =>
          parseFloat(t.commissionPercent)
        ),
      };

      // Check if target exists for this user
      const existingTarget = targets.find((t) => t.employee === currentUser.id);

      if (existingTarget) {
        // Update existing target
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/target/update/${existingTarget.id}`,
          targetPayload
        );
      } else {
        // Create new target
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/target/add`,
          targetPayload
        );
      }

      // Refresh targets
      await fetchTargets();
      setIsModalOpen(false);
      setTargetData([
        {
          fromAmount: "",
          toAmount: "",
          commissionPercent: "",
        },
      ]);
    } catch (error) {
      console.error("Error saving target:", error);
    }
  };

  // ... (keep all the export functions as they were)

  const getUserTargets = (userId) => {
    const userTarget = targets.find((t) => t.employee === userId);
    if (!userTarget) return "No targets set";

    return userTarget.totalAmountFrom.map((from, index) => (
      <div key={index} className="target-info">
        {from} - {userTarget.totalAmountTo[index]} (
        {userTarget.commisionPercent[index]}%)
      </div>
    ));
  };

  const getUserRole = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.roles.map((role) => role.role).join(", ") : "";
  };

  const getUserStatus = (userId) => {
    const user = users.find((u) => u.id === userId);

    if (!user) return null;

    return (
      <span className={`badge ${user.isActive ? "bg-success" : "bg-danger"}`}>
        {user.isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedUsers = users.slice(startIndex, endIndex);

  return (
    <div className="wrapper">
      <div>
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">Sales Targets</h1>
                <span className="display-inline sub-heading">
                  Manage sales targets
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="card-body">
                <div className="row mb-3 d-flex align-items-center">
                  {/* Keep the existing controls for entries per page and exports */}
                  {/* ... */}
                </div>

                <div className="tw-flow-root tw-border-gray-200">
                  <div className="">
                    <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                      <div className="table-responsive">
                        <div id="table-container">
                          <table className="table table-bordered table-striped">
                            <thead>
                              <tr>
                                {columnsVisibility.user && <th>User</th>}
                                {columnsVisibility.role && <th>Role</th>}
                                {columnsVisibility.status && <th>Status</th>}
                                <th>Targets</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedUsers.map((user) => (
                                <tr key={user.id}>
                                  {columnsVisibility.user && (
                                    <td>{`${user.firstname} ${user.lastname}`}</td>
                                  )}
                                  {columnsVisibility.role && (
                                    <td>{getUserRole(user.id)}</td>
                                  )}
                                  {columnsVisibility.status && (
                                    <td>{getUserStatus(user.id)}</td>
                                  )}
                                  <td>{getUserTargets(user.id)}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn-edit"
                                      onClick={() => handleSetTargetClick(user)}
                                    >
                                      <i className="fas fa-bullseye"></i> Set
                                      Sales Target
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
        </section>
      </div>

      {isModalOpen && currentUser && (
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
            aria-labelledby="setSalesTargetModalTitle"
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
                <form onSubmit={handleSubmitTarget}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title" id="setSalesTargetModalTitle">
                      Set Sales Target For {currentUser.firstname}{" "}
                      {currentUser.lastname}
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
                    {targetData.map((target, index) => (
                      <div
                        key={index}
                        className="target-form-group mb-4 p-3 border rounded"
                      >
                        <div className="d-flex justify-content-between mb-2">
                          <h6>Target #{index + 1}</h6>
                          {index > 0 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeTargetLine(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="form-group row">
                          <label className="col-sm-4 col-form-label font-weight-bold">
                            Total sales amount from:
                          </label>
                          <div className="col-sm-8">
                            <input
                              type="number"
                              className="form-control"
                              name="fromAmount"
                              value={target.fromAmount}
                              onChange={(e) =>
                                handleTargetInputChange(e, index)
                              }
                              required
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="form-group row">
                          <label className="col-sm-4 col-form-label font-weight-bold">
                            Total sales amount to:
                          </label>
                          <div className="col-sm-8">
                            <input
                              type="number"
                              className="form-control"
                              name="toAmount"
                              value={target.toAmount}
                              onChange={(e) =>
                                handleTargetInputChange(e, index)
                              }
                              required
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="form-group row">
                          <label className="col-sm-4 col-form-label font-weight-bold">
                            Commission Percent:
                          </label>
                          <div className="col-sm-6">
                            <input
                              type="number"
                              className="form-control"
                              name="commissionPercent"
                              value={target.commissionPercent}
                              onChange={(e) =>
                                handleTargetInputChange(e, index)
                              }
                              required
                              step="0.01"
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="text-center mt-3">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={addNewTargetLine}
                      >
                        <i className="fas fa-plus"></i> Add Another Target
                      </button>
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
                    <button type="submit" className="btn btn-primary">
                      Save Targets
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesTargets;
