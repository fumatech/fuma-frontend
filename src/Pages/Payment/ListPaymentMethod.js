import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { toast } from "react-toastify";

const ListPaymentMethod = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-method/getall`
      );
      if (!response.ok) {
        toast.error("Failed to fetch payment methods");
      }
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      //console.error("Error fetching payment methods:", error);
      toast.error("Failed to fetch payment methods");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_BASE_URL
        }/payment-method/update-status/${id}?isActive=${!currentStatus}`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        setPaymentMethods((prevMethods) =>
          prevMethods.map((method) =>
            method.id === id ? { ...method, isActive: !currentStatus } : method
          )
        );
        toast.success("Payment Method Status Upadted");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      //console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header py-3">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">List Payment Methods</h1>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <Link to="/PaymentMethod" className="btn btn-add">
                  <i className="fas fa-plus"></i> Add
                </Link>
              </div>
              <div className="card-body">
                <div id="table-container" style={{ overflowX: "auto" }}>
                  <table className="table table-bordered table-hover shadow">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentMethods.map((method) => (
                        <tr key={method.id}>
                          <td>{method.id}</td>
                          <td>{method.name}</td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={method.isActive}
                              readOnly
                            />
                          </td>
                          <td>
                            <button
                              className={`btn btn-${
                                method.isActive ? "danger" : "success"
                              } btn-sm`}
                              onClick={() =>
                                handleToggleStatus(method.id, method.isActive)
                              }
                            >
                              {method.isActive ? "Deactivate" : "Activate"}
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
        </section>
      </div>
    </div>
  );
};

export default ListPaymentMethod;
