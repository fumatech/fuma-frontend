import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Select from "react-select";

const AddAccount = () => {
  const navigate = useNavigate();

  const [addedBy, setAddedBy] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      setFormData((prev) => ({
        ...prev,
        addedBy: email,
      }));
    }

    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/payment-method/active-names`
        );
        if (response.data) {
          setPaymentMethods(response.data);
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    fetchPaymentMethods();
  }, []);

  const [formData, setFormData] = useState({
    accountName: "",
    accountType: "",
    accountNumber: "",
    amount: "",
    transactionType: "opening_balance",
    paymentMethod: "",
    note: "",
    date: new Date(),
    addedBy: "",
    status: "3",
  });

  const accountTypeOptions = [
    { value: "", label: "Select Account Type" },
    { value: "current", label: "Current" },
    { value: "saving", label: "Saving" },
    { value: "loan", label: "Loan" },
    { value: "cc", label: "CC" },
  ];
  const paymentMethodOptions = [
    { value: "", label: "Select Payment Method" },
    ...paymentMethods.map((method) => ({
      value: method,
      label: method,
    })),
  ];

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSaveAccount = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/payment-account/save`,
        {
          accountName: formData.accountName,
          accountType: formData.accountType,
          accountNumber: formData.accountNumber,
          status: 1,
          transactions: [
            {
              amount: formData.amount,
              transactionType: formData.transactionType,
              paymentMethod: formData.paymentMethod,
              addedBy: formData.addedBy,
              note: formData.note,
              date: new Date().toISOString(),
            },
          ],
        }
      );

      if (response.data) {
        toast.success("Account saved successfully");
        navigate("/accounts");
      } else {
        //  console.error("Error saving account:", response.data);
        toast.error("There was an issue saving the account. Please try again.");
      }

      setFormData({
        accountName: "",
        accountType: "",
        accountNumber: "",
        amount: "",
        note: "",
        paymentMethod: "",
        addedBy: userEmail,
      });
    } catch (error) {
      // console.error("Error saving account:", error);
      toast.error("An error occurred while saving the account.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.accountType) {
      toast.warning("Account Type is required.");
      return;
    }
    handleSaveAccount();
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-md-6">
                <h1 className="all-heading">Add Account</h1>
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
                      <label htmlFor="accountName">Account Name:*</label>
                      <input
                        type="text"
                        className="form-control"
                        id="accountName"
                        value={formData.accountName}
                        onChange={handleFormChange}
                        placeholder="Enter account name"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="accountType">
                          Account Type<span className="text-danger">*</span>
                        </label>
                        <Select
                          inputId="accountType"
                          options={accountTypeOptions}
                          value={
                            accountTypeOptions.find(
                              (option) =>
                                String(option.value) ===
                                String(formData.accountType)
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setFormData((prev) => ({
                              ...prev,
                              accountType: selectedOption?.value || "",
                            }))
                          }
                          isSearchable
                        />
                      </div>
                    </div>

                    <div className="form-group col-md-4">
                      <label htmlFor="accountNumber">Account Number:</label>
                      <input
                        type="text"
                        className="form-control"
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleFormChange}
                        placeholder="Enter account No"
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label htmlFor="amount">Opening Balance:</label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        value={formData.amount}
                        onChange={handleFormChange}
                        placeholder="Enter opening balance"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="addedBy">
                          Added By<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control rounded"
                          id="addedBy"
                          name="addedBy"
                          value={userEmail}
                          onChange={(e) => setAddedBy(e.target.value)}
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="form-group col-md-4">
                      <label htmlFor="paymentMethod">Payment Method:</label>
                      <Select
                        inputId="paymentMethod"
                        options={paymentMethodOptions}
                        value={
                          paymentMethodOptions.find(
                            (option) =>
                              String(option.value) ===
                              String(formData.paymentMethod)
                          ) || null
                        }
                        onChange={(selectedOption) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: selectedOption?.value || "",
                          }))
                        }
                        isSearchable
                      />
                    </div>

                    <div className="form-group col-md-4">
                      <label htmlFor="note">Note:</label>
                      <textarea
                        className="form-control"
                        id="note"
                        value={formData.note}
                        onChange={handleFormChange}
                        rows="4"
                        placeholder="Enter additional notes here..."
                      ></textarea>
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

export default AddAccount;
