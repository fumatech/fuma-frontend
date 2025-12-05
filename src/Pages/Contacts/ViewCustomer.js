import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../AddUser.css";
import $ from "jquery";
import axios from "axios";
import "bootstrap-daterangepicker";
import "../../assets/dist/css/tempus-dominus.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import "bootstrap-daterangepicker";
import moment from "moment";
import { format } from "date-fns";

const ViewCustomer = () => {
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedRange, setSelectedRange] = useState("This Year");
  const [startDate, setStartDate] = useState(moment().startOf("year"));
  const [endDate, setEndDate] = useState(moment().endOf("year"));
  const [something, setSomething] = useState();
  const [varName, setVarName] = useState();

  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("ledger");
  const [showModal, setShowModal] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [customTransactionNo, setCustomTransactionNo] = useState("");
  const [note, setNote] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [addedBy, setAddedBy] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setAddedBy(email);
    }
  }, []);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    date: getCurrentLocalDateTime(),
    description: "",
    note: "",
    addedBy: "addedBy",
    debit: "",
    credit: "",
    balance: "",
  });

  const [paymentData, setPaymentData] = useState({
    method: "",
    paymentMethod: "",
    paidOn: getCurrentLocalDateTime(),
    amount: "",
    account: "",
    note: "",
  });

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolderName: "",
    cardTransactionNumber: "",
    cardType: "",
    cardMonth: "",
    cardYear: "",
    cardSecurity: "",
  });

  useEffect(() => {
    $("#daterange-btn").daterangepicker(
      {
        ranges: {
          Today: [moment(), moment()],
          Yesterday: [
            moment().subtract(1, "days"),
            moment().subtract(1, "days"),
          ],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "Last 30 Days": [moment().subtract(29, "days"), moment()],
          "This Month": [moment().startOf("month"), moment().endOf("month")],
          "Last Month": [
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
          ],
          "This Year": [moment().startOf("year"), moment().endOf("year")],
          "Last Year": [
            moment().subtract(1, "year").startOf("year"),
            moment().subtract(1, "year").endOf("year"),
          ],
        },
        startDate: startDate,
        endDate: endDate,
      },
      function (start, end, label) {
        setStartDate(start);
        setEndDate(end);
        setSelectedRange(
          label ||
            `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`
        );
      }
    );
  }, []);

  const safeSales = Array.isArray(sales) ? sales : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  const filteredSales = safeSales.filter(
    (sale) =>
      moment(sale.orderDate).isSameOrAfter(startDate, "day") &&
      moment(sale.orderDate).isSameOrBefore(endDate, "day")
  );

  const filteredPayments = safePayments.filter(
    (payment) =>
      moment(payment.date).isSameOrAfter(startDate, "day") &&
      moment(payment.date).isSameOrBefore(endDate, "day")
  );

  const totalSales = filteredSales
    .reduce((total, sale) => total + (Number(sale.netTotalAmount) || 0), 0)
    .toFixed(2);

  const totalPaid = filteredPayments
    .reduce((total, payment) => total + (Number(payment.amount) || 0), 0)
    .toFixed(2);

  const fetchSalesData = async () => {
    if (customer) {
      try {
        // Fetch sales data
        const saleResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/combined-orders/getbyfranchise/${customer.firstname}`
        );
        const salesData = saleResponse.data[customer.firstname] || [];

        // Sort sales by saleDate (descending)
        const sortedSales = [...salesData].sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
        );

        const allStocks = sortedSales.flatMap(
          (sale) => sale.stockTransactions || []
        );

        // Fetch product and variation details
        const updatedStocks = await Promise.all(
          allStocks.map(async (stock) => {
            try {
              const productResponse = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/product/get/${stock.productId}`
              );
              const product = productResponse.data;

              const variation = product.productVariations.find(
                (v) => v.id === stock.variationId
              );

              return {
                ...stock,
                productName: product.productName || "N/A",
                variationValue: variation ? variation.variationValue : "N/A",
              };
            } catch (error) {
              console.error("Error fetching product details:", error);
              return { ...stock, productName: "N/A", variationValue: "N/A" };
            }
          })
        );

        // Sort stocks by date (descending)
        const sortedStocks = [...updatedStocks].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Fetch payment data
        const paymentResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/payment-account/getbyfranchise/${customer.firstname}`
        );
        const customerPayments = paymentResponse.data[customer.firstname] || [];

        // Sort payments by date (descending)
        const sortedPayments = [...customerPayments].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setSales(sortedSales);
        setPayments(sortedPayments);
        setStockTransactions(sortedStocks);
      } catch (error) {
        console.error("Error fetching sales or payments data:", error);
      }
    }
  };

  const groupedStockTransactions = stockTransactions.reduce((acc, stock) => {
    const key = `${stock.productName}-${stock.variationValue}`;

    if (!acc[key]) {
      acc[key] = { ...stock, quantity: stock.quantity ?? 0 };
    } else {
      acc[key].quantity += stock.quantity ?? 0;
    }

    return acc;
  }, {});

  const stockArray = Object.values(groupedStockTransactions);

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/transaction/update/${selectedTransaction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            addedBy: addedBy,
            paymentAccount: formData.paymentAccount,
            note: formData.note,
            date: formData.date,
            customer: formData.customer,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update transaction");

      setEditModal(false);
      fetchSalesData();
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleModalToggle = () => {
    setShowModal(!showModal);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("card")) {
      setCardDetails((prev) => ({ ...prev, [name]: value }));
    } else {
      switch (name) {
        case "chequeNumber":
          setChequeNumber(value);
          break;
        case "bankAccountNumber":
          setBankAccountNumber(value);
          break;
        case "customTransactionNo":
          setCustomTransactionNo(value);
          break;
        case "note":
          setNote(value);
          break;
        default:
          break;
      }
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!paymentMethod || !paymentData.amount) {
      alert("Please fill in all required fields.");
      return;
    }

    const accountId = Number(selectedAccount);

    const payload = {
      paymentMethod: paymentMethod,
      paidOn: paymentData.paidOn,
      amount: parseFloat(paymentData.amount),
      customer: `${customer.firstname} ${customer.lastname}`,
      note: paymentData.note,
      transactionType: "payment",
      date: paymentData.paidOn,
      paymentAccountId: accountId,
    };

    console.log("Submitting payload:", payload);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/transaction/${accountId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit payment.");
      }

      const result = await response.json();
      console.log("Payment submitted:", result);
      fetchSalesData();
      alert("Payment submitted successfully!");
      handleModalToggle();
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting payment. Please try again.");
    }
  };

  const { id } = useParams();

  const [dateRange, setDateRange] = useState("");
  const [ledgerFormat, setLedgerFormat] = useState("format_1");
  const [ledgerLocation, setLedgerLocation] = useState("All locations");

  useEffect(() => {
    axios
      .get("${process.env.REACT_APP_BASE_URL}/payment-method/active-names")
      .then((response) => {
        setPaymentMethods(response.data);
      })
      .catch((error) => {
        console.error("Error fetching payment methods:", error);
      });
  }, []);

  useEffect(() => {
    axios
      .get("${process.env.REACT_APP_BASE_URL}/payment-account/getall")
      .then((response) => {
        const activeAccounts = response.data.filter(
          (account) => account.status === 1
        );
        setPaymentAccounts(activeAccounts);
      })
      .catch((error) => {
        console.error("Error fetching payment accounts:", error);
      });
  }, []);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  useEffect(() => {
    if (customer && customer.firstname) {
      fetchSalesData();
    }
  }, [customer]);

  const fetchCustomerData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/customer/${id}`
      );
      if (!response.data) throw new Error("Customer not found");
      console.log(response.data);

      setCustomer(response.data);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  };

  const renderPayments = () => {
    return (
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Date & time</th>
              <th>Payment Method</th>
              <th>Transaction Type</th>
              <th>Amount</th>
              <th>Added By</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-primary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Actions
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handlePaymentView(payment)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handlePaymentEdit(payment)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handlePaymentDelete(payment.id)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                  <td>
                    {payment.date
                      ? format(new Date(payment.date), "dd/MM/yyyy HH:mm:ss")
                      : "N/A"}
                  </td>
                  <td>{payment.paymentMethod || "N/A"}</td>
                  <td>{payment.transactionType || "N/A"}</td>
                  <td>{payment.amount ? payment.amount.toFixed(2) : "0.00"}</td>
                  <td>{payment.addedBy || "N/A"}</td>
                  <td>{payment.note || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSales = () => {
    return (
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Date</th>
              <th>Reference No</th>
              <th>Location</th>
              <th>Total Items</th>
              <th>Net Total Amount</th>
              <th>Additional Notes</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-primary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Actions
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              handleViewClick(sale.id, sale.salePoOrderId)
                            }
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              handleEditClick(sale.id, sale.salePoOrderId)
                            }
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handleDelete(sale.id)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                  <td>
                    {sale.saleDate
                      ? format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm:ss")
                      : "N/A"}
                  </td>
                  <td>{sale.referenceNumber || "N/A"}</td>
                  <td>{sale.location || "N/A"}</td>
                  <td>{sale.totalItems ?? 0}</td>
                  <td>
                    {sale.netTotalAmount
                      ? sale.netTotalAmount.toFixed(2)
                      : "0.00"}
                  </td>
                  <td>{sale.additionalNotes || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="text-center">
                  No sales found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const handleViewClick = (id, salePoOrderId) => {
    if (salePoOrderId) {
      navigate(`/ViewPoSale/${id}`);
    } else {
      navigate(`/ViewDISale/${id}`);
    }
  };

  const handleEditClick = (id, salePoOrderId) => {
    if (salePoOrderId) {
      navigate(`/EditPoSaleOrder/${id}`);
    } else {
      navigate(`/EditDISale/${id}`);
    }
  };

  const handlePaymentView = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      amount: transaction.amount || "",
      paymentMethod: transaction.paymentMethod || "",
      addedBy: transaction.addedBy || "",
      note: transaction.note || "",
      date: transaction.date || "",
    });
    setViewModal(true);
  };

  const handlePaymentEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      amount: transaction.amount || "",
      paymentMethod: transaction.paymentMethod || "",
      paymentAccount: transaction.paymentAccount || "",
      addedBy: transaction.addedBy || "",
      note: transaction.note || "",
      date: transaction.date || "",
    });
    setEditModal(true);
  };

  const handlePaymentDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      console.log("Deleting payment ID:", id);
      // Add delete logic here (e.g., API call)
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      console.log("Deleting payment ID:", id);
      // Add delete logic here (e.g., API call)
    }
  };

  const renderLedger = () => {
    let transactions = [];
    let runningBalance = 0;

    if (sales && payments) {
      const filteredSales = sales.filter((sale) =>
        moment(sale.orderDate).isBetween(startDate, endDate, null, "[]")
      );

      const filteredPayments = payments.filter((payment) =>
        moment(payment.date).isBetween(startDate, endDate, null, "[]")
      );

      transactions = [
        ...filteredSales.map((sale) => ({
          date: sale.orderDate,
          note: "",
          type: "Sale",
          debit: null,
          credit: sale.netTotalAmount,
          paymentMethod: "",
          others: null,
        })),
        ...filteredPayments.map((payment) => {
          runningBalance +=
            payment.transactionType === "sale"
              ? -payment.amount
              : payment.amount;
          return {
            date: payment.date,
            note: payment.note,
            type: "Payment",
            debit: payment.amount,
            credit: null,
            paymentMethod: payment.paymentMethod,
            others: null,
          };
        }),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return (
      <div className="row" style={{ margin: "0 -15px" }}>
        {/* Header Section */}
        <div className="col-md-12 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            {/* Date Range Picker */}
            <div className="form-group mb-0" style={{ width: "300px" }}>
              <div className="input-group">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  id="daterange-btn"
                  style={{
                    border: "1px solid #2c5e9e",
                    borderRadius: "4px",
                    padding: "8px 15px",
                    fontWeight: "500",
                  }}
                >
                  <i className="far fa-calendar-alt me-2"></i>
                  {selectedRange} <i className="fas fa-caret-down ms-2"></i>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <button
                className="btn btn-outline-danger me-2"
                style={{ border: "1px solid #dc3545" }}
              >
                <i className="fas fa-file-pdf me-1"></i> PDF
              </button>
              <button
                className="btn btn-outline-success"
                style={{ border: "1px solid #28a745" }}
              >
                <i className="fas fa-envelope me-1"></i> Email
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="col-md-12 mb-4">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div
                className="p-3 rounded text-center"
                style={{
                  border: "1px solid #28a745",
                  backgroundColor: "#f0fff4",
                }}
              >
                <h5 style={{ color: "#28a745" }}>Current Period</h5>
                <div className="d-flex justify-content-between">
                  <span>Total Sales:</span>
                  <strong>{totalSales}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Total Paid:</span>
                  <strong>{totalPaid}</strong>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div
                className="p-3 rounded text-center"
                style={{
                  border: "1px solid #17a2b8",
                  backgroundColor: "#e7f8fd",
                }}
              >
                <h5 style={{ color: "#17a2b8" }}>Overall Summary</h5>
                <div className="d-flex justify-content-between">
                  <span>Total Sales:</span>
                  <strong>
                    {sales
                      .reduce(
                        (total, sale) =>
                          total + (Number(sale.netTotalAmount) || 0),
                        0
                      )
                      .toFixed(2)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Total Paid:</span>
                  <strong>
                    {payments
                      .reduce(
                        (total, payments) =>
                          total + (Number(payments.amount) || 0),
                        0
                      )
                      .toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-3">
              <div
                className="p-3 rounded text-center"
                style={{
                  border: "1px solid #dc3545",
                  backgroundColor: "#fff0f0",
                }}
              >
                <h5 style={{ color: "#dc3545" }}>Balance Due</h5>
                <h3 style={{ margin: "10px 0" }}>
                  {(
                    sales.reduce(
                      (total, sale) =>
                        total + (Number(sale.netTotalAmount) || 0),
                      0
                    ) -
                    payments.reduce(
                      (total, payment) => total + (Number(payment.amount) || 0),
                      0
                    )
                  ).toFixed(2)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="col-md-12">
          <div
            className="table-responsive rounded"
            style={{
              border: "1px solid #dee2e6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: "#2c5e9e", color: "white" }}>
                <tr>
                  <th style={{ padding: "12px 15px" }}>Date</th>
                  <th style={{ padding: "12px 15px" }}>Note</th>
                  <th style={{ padding: "12px 15px" }}>Type</th>
                  <th style={{ padding: "12px 15px", textAlign: "right" }}>
                    Debit
                  </th>
                  <th style={{ padding: "12px 15px", textAlign: "right" }}>
                    Credit
                  </th>
                  <th style={{ padding: "12px 15px" }}>Payment Method</th>
                  <th style={{ padding: "12px 15px" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-4"
                      style={{ color: "#6c757d" }}
                    >
                      <i className="fas fa-info-circle me-2"></i> No
                      transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #eee",
                        transition: "background-color 0.2s",
                        ":hover": {
                          backgroundColor: "#f8f9fa",
                        },
                      }}
                    >
                      <td style={{ padding: "12px 15px", color: "#495057" }}>
                        {transaction.date
                          ? format(
                              new Date(transaction.date),
                              "dd/MM/yyyy HH:mm:ss"
                            )
                          : "N/A"}
                      </td>
                      <td style={{ padding: "12px 15px", color: "#495057" }}>
                        {transaction.note}
                      </td>
                      <td style={{ padding: "12px 15px" }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              transaction.type === "Sale"
                                ? "#e3f2fd"
                                : "#e8f5e9",
                            color:
                              transaction.type === "Sale"
                                ? "#1976d2"
                                : "#388e3c",
                            padding: "5px 10px",
                            borderRadius: "12px",
                          }}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 15px",
                          textAlign: "right",
                          fontWeight: "500",
                          color: "#dc3545",
                        }}
                      >
                        {transaction.debit ? transaction.debit.toFixed(2) : "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 15px",
                          textAlign: "right",
                          fontWeight: "500",
                          color: "#28a745",
                        }}
                      >
                        {transaction.credit
                          ? transaction.credit.toFixed(2)
                          : "-"}
                      </td>
                      <td style={{ padding: "12px 15px", color: "#495057" }}>
                        {transaction.paymentMethod || "-"}
                      </td>
                      <td style={{ padding: "12px 15px", color: "#6c757d" }}>
                        {transaction.others || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderStockReport = () => {
    return (
      <div className="row">
        <div className="col-md-12">
          <h3>Stock Report</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Variation Value</th>
                <th>Sale Quantity</th>
              </tr>
            </thead>
            <tbody>
              {stockArray.length > 0 ? (
                stockArray.map((stock) => (
                  <tr key={`${stock.productName}-${stock.variationValue}`}>
                    <td>{stock.productName}</td>
                    <td>{stock.variationValue}</td>
                    <td>{stock.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center">
                    No stock transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMore = () => {
    if (!customer)
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            color: "#555",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: "24px", marginBottom: "10px" }}
            ></i>
            <p>Loading customer details...</p>
          </div>
        </div>
      );

    const {
      prefix = "",
      firstname = "",
      lastname = "",
      email = "",
      franchiseId = "",
      franchiseName = "",
      taxOrGstNumber = "",
      shopActNumber = "",
      cinNumber = "",
      panNumber = "",
      isActive = false,
      username = "",
      allowLogin = false,
      language = "",
      dateOfBirth = "",
      gender = "",
      maritalStatus = "",
      bloodGroup = "",
      mobileNumber = "",
      alternateContactNumber = "",
      familyContactNumber = "",
      facebookLink = "",
      twitterLink = "",
      socialMedia1 = "",
      socialMedia2 = "",
      customField1 = "",
      customField2 = "",
      customField3 = "",
      customField4 = "",
      guardianName = "",
      idProofName = "",
      idProofNumber = "",
      permanentAddress = "",
      currentAddress = "",
      country = "",
      state = "",
      city = "",
      zipCode = "",
      accountHolderName = "",
      accountNumber = "",
      bankName = "",
      ifsc = "",
      branch = "",
      taxPayerId = "",
    } = customer;
    const bankFields = [
      `Account Holder Name:${accountHolderName}`,
      `Account Number:${accountNumber}`,
      `Bank Name:${bankName}`,
      `IFSC:${ifsc}`,
      `Branch:${branch}`,
      `Tax Payer ID:${taxPayerId}`,
    ];

    const renderRow = (label, value, icon = null) => (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 0",
          borderBottom: "1px solid #eaeaea",
          transition: "background-color 0.2s",
          ":hover": {
            backgroundColor: "#f8f9fa",
          },
          width: "100%",
        }}
      >
        <span
          style={{
            fontWeight: 500,
            color: "#444",
            display: "flex",
            alignItems: "center",
            minWidth: "180px",
            flexShrink: 0,
          }}
        >
          {icon && (
            <i
              className={`fas fa-${icon} me-2`}
              style={{ color: "#2c5e9e", width: "20px" }}
            ></i>
          )}
          {label}
        </span>
        <span
          style={{
            color: "#666",
            textAlign: "right",
            wordBreak: "break-word",
            flexGrow: 1,
            marginLeft: "15px",
          }}
        >
          {value || (
            <span style={{ color: "#999", fontStyle: "italic" }}>N/A</span>
          )}
        </span>
      </div>
    );

    return (
      <div
        style={{
          width: "100%",
          margin: "0",
          backgroundColor: "#fff",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "15px 0",
            borderBottom: "2px solid #f0f0f0",
            width: "100%",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#2c5e9e",
              display: "flex",
              alignItems: "center",
              fontSize: "1.5rem",
            }}
          >
            <i className="fas fa-user me-2"></i>
            Customer Details
          </h2>
          <div
            style={{
              backgroundColor: isActive ? "#d4edda" : "#f8d7da",
              color: isActive ? "#155724" : "#721c24",
              padding: "5px 15px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {isActive ? "Active" : "Inactive"}
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            width: "100%",
          }}
        >
          {/* Personal Details Column */}
          <div
            style={{
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              padding: "15px",
              border: "1px solid #eee",
              width: "100%",
            }}
          >
            <h3
              style={{
                color: "#2c5e9e",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "10px",
                marginTop: 0,
                marginBottom: "15px",
                fontSize: "1.1rem",
              }}
            >
              <i className="fas fa-id-card me-2"></i>
              Personal Information
            </h3>
            {renderRow(
              "Full Name",
              `${prefix} ${firstname} ${lastname}`.trim(),
              "user"
            )}
            {renderRow("Customer ID", franchiseId, "id-badge")}
            {renderRow("Email", email, "envelope")}
            {renderRow("Mobile", mobileNumber, "phone")}
            {renderRow(
              "Alternate Contact",
              alternateContactNumber,
              "phone-alt"
            )}
            {renderRow("Date of Birth", dateOfBirth, "birthday-cake")}
            {renderRow("Gender", gender, "venus-mars")}
            {renderRow("Marital Status", maritalStatus, "heart")}
            {renderRow("Blood Group", bloodGroup, "tint")}
          </div>

          {/* Business Details Column */}
          <div
            style={{
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              padding: "15px",
              border: "1px solid #eee",
              width: "100%",
            }}
          >
            <h3
              style={{
                color: "#2c5e9e",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "10px",
                marginTop: 0,
                marginBottom: "15px",
                fontSize: "1.1rem",
              }}
            >
              <i className="fas fa-store me-2"></i>
              Franchise Information
            </h3>
            {renderRow("Franchise Name", franchiseName, "building")}
            {renderRow("GST Number", taxOrGstNumber, "file-invoice-dollar")}
            {renderRow("Shop Act", shopActNumber, "file-alt")}
            {renderRow("CIN Number", cinNumber, "file-contract")}
            {renderRow("PAN Number", panNumber, "credit-card")}
            {renderRow("Username", username, "user-circle")}
            {renderRow(
              "Login Allowed",
              allowLogin ? "Yes" : "No",
              allowLogin ? "check-circle" : "times-circle"
            )}
            {renderRow("Language", language, "language")}
          </div>

          {/* Address Details Column */}
          <div
            style={{
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              padding: "15px",
              border: "1px solid #eee",
              width: "100%",
            }}
          >
            <h3
              style={{
                color: "#2c5e9e",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "10px",
                marginTop: 0,
                marginBottom: "15px",
                fontSize: "1.1rem",
              }}
            >
              <i className="fas fa-map-marker-alt me-2"></i>
              Address Information
            </h3>
            {renderRow("Permanent Address", permanentAddress, "home")}
            {renderRow("Current Address", currentAddress, "map-marker-alt")}
            {renderRow("City", city, "city")}
            {renderRow("State", state, "landmark")}
            {renderRow("Country", country, "globe")}
            {renderRow("Zip Code", zipCode, "mail-bulk")}
          </div>

          {/* Social & Other Details Column */}
          <div
            style={{
              backgroundColor: "#fafafa",
              borderRadius: "8px",
              padding: "15px",
              border: "1px solid #eee",
              width: "100%",
            }}
          >
            <h3
              style={{
                color: "#2c5e9e",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "10px",
                marginTop: 0,
                marginBottom: "15px",
                fontSize: "1.1rem",
              }}
            >
              <i className="fas fa-share-alt me-2"></i>
              Social & Other Information
            </h3>
            {renderRow("Facebook", facebookLink, "facebook")}
            {renderRow("Twitter", twitterLink, "twitter")}
            {renderRow("Social Media 1", socialMedia1, "share-alt")}
            {renderRow("Social Media 2", socialMedia2, "share-alt")}
            {renderRow("Guardian", guardianName, "user-shield")}
            {renderRow(
              "ID Proof",
              `${idProofName} (${idProofNumber})`,
              "id-card"
            )}
            {renderRow("Custom Field 1", customField1, "tag")}
            {renderRow("Custom Field 2", customField2, "tag")}
            {renderRow("Custom Field 3", customField3, "tag")}
            {renderRow("Custom Field 4", customField4, "tag")}
            {renderRow("Family Contact", familyContactNumber, "users")}
          </div>
        </div>

        {/* Bank Details Section */}
        <div
          style={{
            marginTop: "25px",
            backgroundColor: "#f5f9ff",
            borderRadius: "8px",
            padding: "20px 0",
            border: "1px solid #e0e8f5",
            width: "100%",
          }}
        >
          <h3
            style={{
              color: "#2c5e9e",
              borderBottom: "1px solid #d0ddf0",
              paddingBottom: "10px",
              marginTop: 0,
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              paddingLeft: "15px",
              paddingRight: "15px",
              fontSize: "1.1rem",
            }}
          >
            <i className="fas fa-university me-2"></i>
            Bank Details
          </h3>

          {bankFields.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
                padding: "0 15px",
                width: "100%",
              }}
            >
              {bankFields.map((field, idx) => {
                if (!field) return null;

                const [label = "", value = ""] =
                  typeof field === "string" ? field.split(":") : ["", ""];

                const formattedLabel =
                  label === label.toUpperCase()
                    ? label
                    : label.replace(/([A-Z])/g, " $1").trim();

                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#fff",
                      padding: "12px 15px",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        color: "#555",
                        fontWeight: "500",
                        marginBottom: "5px",
                        fontSize: "14px",
                      }}
                    >
                      {formattedLabel || "Bank Field"}
                    </div>
                    <div
                      style={{
                        color: "#333",
                        fontWeight: "400",
                        wordBreak: "break-word",
                      }}
                    >
                      {value || (
                        <span style={{ color: "#999", fontStyle: "italic" }}>
                          Not provided
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#666",
                backgroundColor: "#fff",
                borderRadius: "6px",
                border: "1px dashed #ccc",
                margin: "0 15px",
              }}
            >
              <i
                className="fas fa-info-circle"
                style={{
                  fontSize: "24px",
                  marginBottom: "10px",
                  color: "#999",
                }}
              ></i>
              <p>No bank details available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "ledger":
        return renderLedger();
      case "payments":
        return renderPayments();
      case "sales":
        return renderSales();
      case "stockReport":
        return renderStockReport();
      case "documents":
        return renderMore();
      case "activities":
        return <p>Activities content goes here...</p>;
      default:
        return null;
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">View Customer</h1>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            {/* Customer Details */}
            <div
              className="card rounded-4 border-0"
              style={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "transform 0.3s ease",
                borderLeft: "5px solid #2c5e9e",
              }}
            >
              <div className="card-body p-4">
                {customer ? (
                  <div className="row">
                    {/* Left Column */}
                    <div className="col-md-6">
                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-user me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Name:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {`${customer.prefix} ${customer.firstname} ${customer.lastname}`}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-id-card me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>
                          Franchise ID:
                        </strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.franchiseId}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-envelope me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Email:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.email}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-phone-alt me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Mobile:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.mobileNumber || "N/A"}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-map-marker-alt me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Address:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.permanentAddress || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-md-6">
                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-city me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>City:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.city || "N/A"}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-map-marker me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>State:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.state || "N/A"}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-flag me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Country:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.country || "N/A"}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className="fas fa-id-card me-2"
                          style={{ color: "#4e73df" }}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Tax/GST:</strong>
                        <span className="ms-2" style={{ color: "#858796" }}>
                          {customer.taxOrGstNumber || "N/A"}
                        </span>
                      </div>

                      <div
                        className="customer-info-item"
                        style={{
                          padding: "10px 0",
                          borderBottom: "1px dashed #ddd",
                        }}
                      >
                        <i
                          className={`fas me-2 ${
                            customer.isActive
                              ? "fa-check-circle text-success"
                              : "fa-times-circle text-danger"
                          }`}
                        ></i>
                        <strong style={{ color: "#5a5c69" }}>Status:</strong>
                        <span
                          className={`ms-2 fw-bold ${
                            customer.isActive ? "text-success" : "text-danger"
                          }`}
                        >
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="col-12 mt-4 text-end">
                      <button
                        className="btn btn-primary rounded-pill px-4 py-2"
                        onClick={handleModalToggle}
                        style={{
                          background:
                            "linear-gradient(135deg, #4e73df 0%, #224abe 100%)",
                          border: "none",
                          boxShadow: "0 2px 10px rgba(78, 115, 223, 0.4)",
                          transition: "all 0.3s",
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow =
                            "0 4px 15px rgba(78, 115, 223, 0.6)";
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow =
                            "0 2px 10px rgba(78, 115, 223, 0.4)";
                        }}
                      >
                        <i className="fas fa-credit-card me-2"></i> Receive
                        Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2" style={{ color: "#5a5c69" }}>
                      Loading customer details...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal for Payment Details */}
            {showModal && (
              <div
                className="modal fade show"
                style={{
                  display: "block",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  paddingTop: "50px",
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: "1050",
                }}
                tabIndex="-1"
                aria-labelledby="paymentModalLabel"
                aria-hidden="true"
              >
                <div
                  className="modal-dialog"
                  style={{
                    maxWidth: "1000px",
                    width: "85%",
                    height: "auto",
                  }}
                >
                  <div
                    className="modal-content"
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      className="modal-header"
                      style={{ backgroundColor: "#0c4166", color: "white" }}
                    >
                      <h5 className="modal-title" id="paymentModalLabel">
                        Receive Payment
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                        onClick={handleModalToggle}
                        style={{
                          backgroundColor: "#ffffff",
                          borderColor: "#ffffff",
                        }}
                      ></button>
                    </div>
                    <div
                      className="modal-body"
                      style={{
                        padding: "20px",
                        overflowY: "auto",
                        flex: 1,
                        maxHeight: "calc(100vh - 150px)",
                        scrollbarWidth: "thin",
                        msOverflowStyle: "none",
                      }}
                    >
                      <div className="row" style={{ marginBottom: "20px" }}>
                        <div className="col-md-6">
                          <div
                            className="well"
                            style={{
                              backgroundColor: "#f8f9fa",
                              padding: "10px",
                              borderRadius: "5px",
                            }}
                          >
                            <strong>
                              Customer :{" "}
                              {`${customer.firstname} ${customer.lastname}`}{" "}
                            </strong>
                            <br />
                            <strong>
                              Address : {customer.permanentAddress || "N/A"}
                              <br />
                              {customer.country || "N/A"} ,{" "}
                              {customer.state || "N/A"}
                              <br />
                              {customer.city || "N/A"}
                            </strong>
                            <br />
                            <br />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div
                            className="well"
                            style={{
                              backgroundColor: "#f8f9fa",
                              padding: "10px",
                              borderRadius: "5px",
                            }}
                          >
                            <strong>Total Sales: </strong>
                            <span
                              className="display_currency"
                              data-currency_symbol="true"
                              style={{ fontWeight: "bold" }}
                            >
                              {sales
                                .reduce(
                                  (total, sale) =>
                                    total + (Number(sale.netTotalAmount) || 0),
                                  0
                                )
                                .toFixed(2)}{" "}
                            </span>
                            <br />
                            <strong>Total Received: </strong>
                            <span
                              className="display_currency"
                              data-currency_symbol="true"
                              style={{ fontWeight: "bold" }}
                            >
                              {payments
                                .reduce(
                                  (total, payments) =>
                                    total + (Number(payments.amount) || 0),
                                  0
                                )
                                .toFixed(2)}{" "}
                            </span>
                            <br />
                            <strong>Total Due: </strong>
                            <span
                              className="display_currency"
                              data-currency_symbol="true"
                              style={{ fontWeight: "bold" }}
                            >
                              {(
                                sales.reduce(
                                  (total, sale) =>
                                    total + (Number(sale.netTotalAmount) || 0),
                                  0
                                ) -
                                payments.reduce(
                                  (total, payment) =>
                                    total + (Number(payment.amount) || 0),
                                  0
                                )
                              ).toFixed(2)}
                            </span>
                            <br />
                          </div>
                        </div>
                      </div>

                      <div
                        className="row payment_row"
                        style={{ marginBottom: "20px" }}
                      >
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="method">Payment Method</label>
                            <div className="input-group">
                              <span className="input-group-text bg-transparent">
                                <i className="fas fa-money-bill-alt"></i>
                              </span>
                              <select
                                className="form-control"
                                required
                                id="method"
                                name="method"
                                value={paymentMethod}
                                onChange={(e) =>
                                  setPaymentMethod(e.target.value)
                                }
                              >
                                <option value="">Select Payment Method</option>
                                {paymentMethods.map((method, index) => (
                                  <option key={index} value={method}>
                                    {method}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label
                              htmlFor="date"
                              style={{ fontWeight: "bold" }}
                            >
                              Received on
                            </label>
                            <input
                              className="form-control"
                              type="datetime-local"
                              id="paidOn"
                              name="paidOn"
                              value={paymentData.paidOn}
                              required
                              min={getCurrentLocalDateTime()}
                              onChange={handleInputChange}
                              style={{ borderRadius: "5px", padding: "10px" }}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group">
                            <label
                              htmlFor="amount"
                              style={{ fontWeight: "bold" }}
                            >
                              Amount
                            </label>
                            <input
                              className="form-control"
                              type="number"
                              id="amount"
                              name="amount"
                              value={paymentData.amount}
                              onChange={handleInputChange}
                              required
                              style={{ borderRadius: "5px", padding: "10px" }}
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        className="row payment_row"
                        style={{ marginBottom: "20px" }}
                      >
                        <div className="col-md-4">
                          <div className="form-group">
                            <label htmlFor="account">Payment Account</label>
                            <div className="input-group">
                              <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent">
                                  <i className="fas fa-money-bill-alt"></i>
                                </span>
                              </div>
                              <select
                                className="form-control"
                                id="account"
                                name="account_id"
                                value={selectedAccount}
                                onChange={(e) => {
                                  setSelectedAccount(e.target.value);
                                  setPaymentAccount(e.target.value);
                                }}
                              >
                                <option value="">None</option>
                                {paymentAccounts.map((account) => (
                                  <option key={account.id} value={account.id}>
                                    {account.accountName} /{" "}
                                    {account.accountNumber}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Note */}
                      <div className="row" style={{ marginBottom: "20px" }}>
                        <div className="col-md-12">
                          <div className="form-group">
                            <label
                              htmlFor="note"
                              style={{ fontWeight: "bold" }}
                            >
                              Payment Note:
                            </label>
                            <textarea
                              className="form-control"
                              rows="3"
                              name="note"
                              value={paymentData.note}
                              onChange={handleInputChange}
                              id="note"
                              style={{ borderRadius: "5px", padding: "10px" }}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div
                      className="modal-footer"
                      style={{ borderTop: "1px solid #ddd", padding: "15px" }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal"
                        onClick={handleModalToggle}
                        style={{
                          backgroundColor: "#6c757d",
                          borderColor: "#6c757d",
                          padding: "10px 20px",
                        }}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmitPayment}
                        style={{
                          backgroundColor: "#007bff",
                          padding: "10px 20px",
                        }}
                      >
                        Submit Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {editModal && selectedTransaction && (
              <div
                className="modal show"
                style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
              >
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Edit Transaction</h5>
                      <button
                        type="button"
                        className="close"
                        onClick={() => setEditModal(false)}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>Amount</label>
                        <input
                          type="number"
                          id="amount"
                          value={formData.amount}
                          onChange={handleFormChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Method</label>
                        <input
                          type="text"
                          id="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleFormChange}
                          className="form-control"
                          readOnly
                        />
                      </div>

                      <div className="form-group">
                        <label>Note</label>
                        <input
                          type="text"
                          id="note"
                          value={formData.note}
                          onChange={handleFormChange}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date</label>

                        <input
                          className="form-control"
                          type="datetime-local"
                          id="date"
                          name="date"
                          value={formData.date}
                          required
                          min={getCurrentLocalDateTime()}
                          onChange={handleFormChange}
                          style={{ borderRadius: "5px", padding: "10px" }}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleUpdateTransaction}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {viewModal && selectedTransaction && (
              <div
                className="modal show"
                style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
              >
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">View Payment</h5>
                      <button
                        type="button"
                        className="close"
                        onClick={() => setViewModal(false)}
                      >
                        &times;
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>Amount</label>
                        <input
                          type="number"
                          id="amount"
                          value={formData.amount}
                          onChange={handleFormChange}
                          className="form-control"
                          readOnly
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Method</label>
                        <input
                          type="text"
                          id="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleFormChange}
                          className="form-control"
                          disabled
                        />
                      </div>

                      <div className="form-group">
                        <label>Note</label>
                        <input
                          type="text"
                          id="note"
                          value={formData.note}
                          onChange={handleFormChange}
                          className="form-control"
                          readOnly
                        />
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          id="date"
                          value={formData.date}
                          onChange={handleFormChange}
                          className="form-control"
                          disabled
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setViewModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleUpdateTransaction}
                        disabled
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        {/* Tabs */}
        <div className="container-fluid">
          <div className="card mt-4 w-100">
            <div className="card-header">
              <ul
                className="nav nav-tabs card-header-tabs w-100 d-flex justify-content-around flex-wrap"
                style={{
                  borderBottom: "2px solid #ddd",
                  paddingBottom: "5px",
                }}
              >
                {[
                  { key: "ledger", label: "Ledger", icon: "fas fa-book" },
                  {
                    key: "payments",
                    label: "Payments",
                    icon: "fas fa-credit-card",
                  },
                  {
                    key: "sales",
                    label: "Sales",
                    icon: "fas fa-shopping-cart",
                  },
                  {
                    key: "stockReport",
                    label: "Stock Report",
                    icon: "fas fa-chart-bar",
                  },
                  {
                    key: "documents",
                    label: "More Details",
                    icon: "fas fa-file-alt",
                  },
                  {
                    key: "activities",
                    label: "Activities",
                    icon: "fas fa-tasks",
                  },
                ].map(({ key, label, icon }) => (
                  <li key={key} className="nav-item flex-grow-1 text-center">
                    <button
                      className={`nav-link fs-5 fw-bold py-3 px-4 text-dark ${
                        activeTab === key ? "active" : ""
                      } ${key}-tab`}
                      onClick={() => setActiveTab(key)}
                      style={{
                        width: "100%",
                        padding: "12px 0",
                        borderTop:
                          activeTab === key ? "3px solid #007bff" : "none",
                        fontWeight: activeTab === key ? "bold" : "normal",
                        color: activeTab === key ? "#007bff" : "#000",
                        transition: "border-top 0.3s ease, color 0.3s ease",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#f8f9fa")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "transparent")
                      }
                    >
                      <i className={`${icon} me-2`}></i>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body" key={activeTab}>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomer;
