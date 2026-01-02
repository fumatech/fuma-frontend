import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PaymentMethod = () => {
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    paymentMethod: "",
    isActive: false, // New field for checkbox
  });

  // Handle input change
  const handleFormChange = (e) => {
    const { id, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value, // Handle checkbox separately
    }));
  };

  // Save Payment Method
  const handleSaveAccount = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/payment-method/save`,
        {
          name: formData.paymentMethod,
          isActive: formData.isActive, // Include checkbox value
        }
      );

      if (response.data) {
        toast.success("Payment Method saved successfully");
        navigate("/ListPaymentMethod");
      } else {
        toast.error("Error saving payment method.");
      }

      setFormData({
        paymentMethod: "",
        isActive: false,
      });
    } catch (error) {
      //console.error("Error saving payment method:", error);
      toast.error("An error occurred while saving.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveAccount();
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-md-6">
                <h1 className="all-heading">Add Payment Method</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <form onSubmit={handleSubmit}>
              <div className="card card-default rounded-4 border-0 cardHover">
                <div className="card-body">
                  <div className="row">
                    <div className="form-group col-md-4">
                      <label htmlFor="paymentMethod">
                        Payment Method Name:*
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleFormChange}
                        placeholder="Enter Payment Method"
                        required
                      />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Is Active:</label>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={handleFormChange}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="container-fluid text-center mt-3">
                    <button
                      type="submit"
                      className="btn btn-save btn-lg px-4 py-2 m-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PaymentMethod;
