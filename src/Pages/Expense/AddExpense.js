import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import axios from "axios";
import Select from "react-select";

function AddExpense() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [filteredSubExpenses, setFilteredSubExpenses] = useState([]);
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseSubCategoryId, setExpenseSubCategoryId] = useState("");
  const [refNo, setRefNo] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [expenseFor, setExpenseFor] = useState("");
  const [contactId, setContactId] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [taxId, setTaxId] = useState("None");
  const [finalTotal, setFinalTotal] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isRefund, setIsRefund] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurInterval, setRecurInterval] = useState("");
  const [recurIntervalType, setRecurIntervalType] = useState("days");
  const [recurRepetitions, setRecurRepetitions] = useState("");
  const [repeatOn, setRepeatOn] = useState("");
  const [locations, setLocations] = useState([]);

  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(""); // Fixed this line - changed useStatew2qe to useState
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [note, setNote] = useState("");
  const [paymentDue, setPaymentDue] = useState(0); // State for Payment Due
  const [taxRates, setTaxRates] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolderName: "",
    cardTransactionNumber: "",
    cardType: "credit",
    cardMonth: "",
    cardYear: "",
    cardSecurity: "",
  });
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [customTransactionNo, setCustomTransactionNo] = useState("");

  const handleMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    // Reset fields when payment method changes
    resetFields(e.target.value);
  };

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error(err));
  }, []);
  const resetFields = (method) => {
    if (method !== "card") {
      setCardDetails({
        cardNumber: "",
        cardHolderName: "",
        cardTransactionNumber: "",
        cardType: "credit",
        cardMonth: "",
        cardYear: "",
        cardSecurity: "",
      });
    }
    if (method !== "cheque") {
      setChequeNumber("");
    }
    if (method !== "bank_transfer") {
      setBankAccountNumber("");
    }
    if (!method.startsWith("custom_pay")) {
      setCustomTransactionNo("");
    }
  };
  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => setUserName(data))
        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/expenses/getall`)
      .then((res) => {
        const data = res.data;

        // Remove duplicated sub-entries (id 2 & 3 appear twice)
        const unique = [];
        const map = new Set();

        data.forEach((item) => {
          if (!map.has(item.id)) {
            map.add(item.id);
            unique.push(item);
          }
        });

        setExpenses(unique);
      })
      .catch((err) => console.error("Error loading expenses:", err));
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/payment-method/active-names`)
      .then((response) => {
        setPaymentMethods(response.data);
      })
      .catch((error) => {
        console.error("Error fetching payment methods:", error);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/payment-account/getall`)
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
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/tax/getall`)
      .then((response) => {
        setTaxRates(response.data);
      })
      .catch((error) => console.error("Error fetching tax rates:", error));
  }, []);

  useEffect(() => {
    const rateOptions = [
      { value: "", label: "None", rate: 0 }, // Default "None" option, value is an empty string
      ...taxRates.map((rate) => ({
        value: rate.id,
        label: `${rate.taxName} (${rate.taxValue}%)`,
        rate: rate.taxValue,
      })),
    ];
    setTaxOptions(rateOptions);
    //console.log(taxOptions);
  }, [taxRates]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("card")) {
      setCardDetails({ ...cardDetails, [name]: value });
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
  const handleCategoryChange = (id) => {
    setExpenseCategoryId(id);

    const selected = expenses.find((e) => e.id == id);

    if (selected && selected.subExpenses) {
      setFilteredSubExpenses(selected.subExpenses);
    } else {
      setFilteredSubExpenses([]);
    }

    setExpenseSubCategoryId("");
  };

  useEffect(() => {
    const dueAmount = parseFloat(amount) || 0; // Convert amount to a number, default to 0
    setPaymentDue(dueAmount); // Set the payment due based on the amount
  }, [amount]);

  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
    setTransactionDate(currentDate);
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrorMessage("File size exceeds 5MB");
        setFile(null);
      } else {
        setErrorMessage("");
        setFile(selectedFile);
        // Simulate upload progress
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10; // Simulate progress
          });
        }, 100);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setErrorMessage("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const expenseObj = {
      businessLocation: locationId,
      expenseCategory: expenseCategoryId ? Number(expenseCategoryId) : null,
      subCategory: expenseSubCategoryId ? Number(expenseSubCategoryId) : null,
      date: new Date().toISOString(),
      expenseFor: userName,
      // expenseForContact: contactId ? Number(contactId) : null,
      expenseForContact: 1,
      tax: taxId ? Number(taxId) : null,
      totalAmount: finalTotal ? Number(finalTotal) : 0,
      note: additionalNotes || "",
      transaction: [],
    };

    const transactionObj = {
      amount: Number(finalTotal),
      paymentMethod,
      addedBy: userName,
      transactionType: "expense",
      note,
      vendor: "",
      date: new Date().toISOString(),
      paymentAccountId: Number(paymentAccount),
    };

    const multipart = new FormData();
    multipart.append("addExpenses", JSON.stringify(expenseObj));
    multipart.append("transaction", JSON.stringify(transactionObj));

    if (file) multipart.append("file", file);
    // console.log("Expense Object:", expenseObj);
    // console.log("Transaction Object:", transactionObj);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/add-expenses/save`,
        multipart,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Expenses Saved Successfully!");
      navigate("/ListExpense"); // Redirect to expenses list page
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-md-6">
                  <h1 className=" all-heading">Add Expense</h1>
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
                      {/* Business Location */}
                      <div className="col-md-4 form-group">
                        <label htmlFor="location_id">Business Location:*</label>
                        <select
                          className="form-control"
                          required
                          id="location_id"
                          value={locationId}
                          onChange={(e) => setLocationId(e.target.value)}
                        >
                          <option value="">Please Select</option>

                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.name}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expense Category */}
                      <div className="col-md-4">
                        <label htmlFor="expense_category_id">
                          Expense Category:
                        </label>
                        <select
                          className="form-control"
                          id="expense_category_id"
                          value={expenseCategoryId}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                          <option value="">Please Select</option>

                          {expenses.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.expenseName}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Sub category */}
                      <div className="col-md-4">
                        <label htmlFor="expense_sub_category_id">
                          Sub category:
                        </label>
                        <select
                          className="form-control"
                          id="expense_sub_category_id"
                          value={expenseSubCategoryId}
                          onChange={(e) =>
                            setExpenseSubCategoryId(e.target.value)
                          }
                        >
                          <option value="">Please Select</option>

                          {filteredSubExpenses.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.expenseName}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Sub category */}
                      {/* <div className="col-md-4">
                        <label htmlFor="ref_no">Sub category:</label>
                        <input
                          className="form-control"
                          name="ref_no"
                          type="text"
                          id="ref_no"
                          value={refNo}
                          onChange={(e) => setRefNo(e.target.value)}
                        />
                        <p className="help-block">
                          Leave empty to autogenerate
                        </p>
                      </div> */}
                      {/* Date */}
                      <div className="col-md-4">
                        <label htmlFor="transaction_date">Date:*</label>
                        <div className="input-group">
                          <input
                            className="form-control"
                            readOnly
                            required
                            id="expense_transaction_date"
                            type="text"
                            value={transactionDate}
                          />
                          <div className="input-group-prepend">
                            <span className="input-group-text bg-transparent">
                              <i className="fa fa-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Expense for */}
                      {/* <div className="col-md-4">
                        <label htmlFor="expense_for">Expense for:</label>
                        <select
                          className="form-control"
                          id="expense_for"
                          value={expenseFor}
                          onChange={(e) => setExpenseFor(e.target.value)}
                        >
                          <option value="">Please Select</option>
                          <option value="Mr_Admin">Mr Admin</option>
                        </select>
                      </div> */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>
                            Expense for:<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={userName}
                            readOnly
                          />
                        </div>
                      </div>
                      {/* Expense for contact */}
                      <div className="col-md-4">
                        <label htmlFor="contact_id">Expense for contact:</label>
                        <select
                          className="form-control"
                          id="contact_id"
                          value={contactId}
                          onChange={(e) => setContactId(e.target.value)}
                        >
                          <option value="">Please Select</option>
                          <option value="Walk_In_Customer">
                            Walk-In Customer - (CO0005)
                          </option>
                        </select>
                      </div>
                      {/* Attach document */}
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label htmlFor="image">Attach document:</label>
                          <div className="file-input file-input-new">
                            <div className="file-preview">
                              {file ? (
                                <>
                                  <button
                                    className="close fileinput-remove"
                                    onClick={handleRemove}
                                  >
                                    &times;
                                  </button>
                                  <div className="file-preview-thumbnails">
                                    <div>{file.name}</div>
                                  </div>
                                  <div className="file-preview-status text-center text-success">
                                    {progress > 0 &&
                                      `Uploading... ${progress}%`}
                                  </div>
                                </>
                              ) : (
                                <div className="file-drop-disabled">
                                  <div className="file-preview-status text-center text-danger">
                                    {errorMessage}
                                  </div>
                                </div>
                              )}
                            </div>
                            {progress > 0 && (
                              <div className="kv-upload-progress">
                                <div className="progress">
                                  <div
                                    className="progress-bar progress-bar-success progress-bar-striped active"
                                    role="progressbar"
                                    aria-valuenow={progress}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                    style={{ width: `${progress}%` }}
                                  >
                                    {progress}%
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="input-group">
                              <div className="form-control file-caption kv-fileinput-caption">
                                <div className="file-caption-name">
                                  {file ? file.name : "No file selected"}
                                </div>
                              </div>
                              <div className="input-group-append">
                                {file && (
                                  <button
                                    type="button"
                                    title="Clear selected files"
                                    className="btn btn-secondary fileinput-remove"
                                    onClick={handleRemove}
                                  >
                                    <i className="glyphicon glyphicon-trash"></i>{" "}
                                    Remove
                                  </button>
                                )}
                                <div className="btn btn-primary btn-file rounded-0 py-1 px-2 ms-2">
                                  <i className="glyphicon glyphicon-folder-open"></i>
                                  &nbsp; Browse..
                                  <input
                                    id="upload_image"
                                    accept="image/*"
                                    className="upload-element"
                                    name="image"
                                    type="file"
                                    onChange={handleFileChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <small className="form-text text-muted">
                            Max File size: 5MB <br /> Aspect ratio should be 1:1
                          </small>
                        </div>
                      </div>
                      {/* Applicable Tax */}
                      <div className="col-md-4">
                        <label htmlFor="tax_id">Applicable Tax:</label>
                        <Select
                          options={taxOptions}
                          onChange={(selectedOption) =>
                            setTaxId(selectedOption ? selectedOption.value : "")
                          }
                          isClearable={true}
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              width: "100%",
                            }),
                          }}
                        />
                      </div>

                      {/* Total amount */}
                      <div className="col-md-4">
                        <label htmlFor="final_total">Total amount:*</label>
                        <input
                          className="form-control input_number"
                          placeholder="Total amount"
                          required
                          name="final_total"
                          type="number"
                          id="final_total"
                          value={finalTotal}
                          onChange={(e) => setFinalTotal(e.target.value)}
                        />
                      </div>
                      {/* Expense note */}
                      <div className="col-md-4">
                        <label htmlFor="additional_notes">Expense note:</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          name="additional_notes"
                          id="additional_notes"
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                        />
                      </div>
                      {/* Is refund */}
                      {/* <div className="col-md-4 col-md-6">
                        <label>
                          <input
                            className="input-icheck"
                            id="is_refund"
                            name="is_refund"
                            type="checkbox"
                            checked={isRefund}
                            onChange={() => setIsRefund(!isRefund)}
                          />
                          Is refund?
                        </label>
                      </div> */}
                    </div>
                  </div>
                </div>
                {/* {!isRefund && (
                  <div className="card card-default rounded-4 border-0 cardHover">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 col-sm-6">
                          <label>
                            <input
                              className="input-icheck"
                              id="is_recurring"
                              type="checkbox"
                              checked={isRecurring}
                              onChange={() => setIsRecurring(!isRecurring)}
                            />
                            Is Recurring?
                          </label>
                        </div>

                        <div className="col-md-4 col-sm-6">
                          <div className="form-group">
                            <label htmlFor="recur_interval">
                              Recurring interval:*
                            </label>
                            <div className="input-group">
                              <input
                                className="form-control"
                                style={{ width: "50%", zIndex: 0 }}
                                name="recur_interval"
                                type="number"
                                id="recur_interval"
                                value={recurInterval}
                                onChange={(e) =>
                                  setRecurInterval(e.target.value)
                                }
                              />
                              <select
                                className="form-control"
                                style={{ width: "50%", zIndex: 0 }}
                                id="recur_interval_type"
                                name="recur_interval_type"
                                value={recurIntervalType}
                                onChange={(e) =>
                                  setRecurIntervalType(e.target.value)
                                }
                              >
                                <option value="days">Days</option>
                                <option value="months">Months</option>
                                <option value="years">Years</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4 col-sm-6">
                          <div className="form-group">
                            <label htmlFor="recur_repetitions">
                              No. of Repetitions:
                            </label>
                            <input
                              className="form-control"
                              name="recur_repetitions"
                              type="number"
                              id="recur_repetitions"
                              value={recurRepetitions}
                              onChange={(e) =>
                                setRecurRepetitions(e.target.value)
                              }
                            />
                            <p className="help-block">
                              If blank, expense will be generated infinite times
                            </p>
                          </div>
                        </div>

                        <div className="recur_repeat_on_div col-md-4">
                          <div className="form-group">
                            <label htmlFor="subscription_repeat_on">
                              Repeat on:
                            </label>
                            <select
                              className="form-control"
                              id="subscription_repeat_on"
                              name="subscription_repeat_on"
                              value={repeatOn}
                              onChange={(e) => setRepeatOn(e.target.value)}
                            >
                              <option value="">Please Select</option>
                              {[...Array(30).keys()].map((i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                  {getOrdinalSuffix(i + 1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Add payment */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="">
                        <h3 className="">Add Payment</h3>
                        <div className="">
                          <div className="">
                            <div className="py-2 ">
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="amount">Amount:*</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text bg-transparent">
                                          <i className="fas fa-money-bill-alt"></i>
                                        </span>
                                      </div>
                                      <input
                                        className="form-control"
                                        required
                                        id="amount"
                                        placeholder="Amount"
                                        name="amount"
                                        type="text"
                                        value={amount}
                                        onChange={(e) =>
                                          setAmount(e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="paidOn">Paid on:*</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text bg-transparent">
                                          <i className="fa fa-calendar"></i>
                                        </span>
                                      </div>
                                      <input
                                        className="form-control"
                                        required
                                        id="paidOn"
                                        name="paidOn"
                                        type="date"
                                        value={paidOn}
                                        onChange={(e) =>
                                          setPaidOn(e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label htmlFor="method">
                                      Payment Method:*
                                    </label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text bg-transparent">
                                          <i className="fas fa-money-bill-alt"></i>
                                        </span>
                                      </div>
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
                                        <option value="">
                                          Select Payment Method
                                        </option>
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
                                    <label htmlFor="account">
                                      Payment Account:
                                    </label>
                                    <div className="input-group">
                                      <span className="input-group-text bg-transparent">
                                        <i className="fas fa-money-bill-alt"></i>
                                      </span>
                                      <select
                                        className="form-control"
                                        id="account"
                                        name="account_id"
                                        value={selectedAccount}
                                        onChange={(e) => {
                                          setSelectedAccount(e.target.value);
                                          setPaymentAccount(e.target.value); // Send only the ID
                                        }}
                                      >
                                        <option value="">None</option>
                                        {paymentAccounts.map((account) => (
                                          <option
                                            key={account.id}
                                            value={account.id}
                                          >
                                            {account.accountName} /{" "}
                                            {account.accountNumber}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Details */}
                                {/* {paymentMethod === "card" && (
                                  <>
                                    <div className="col-md-4">
                                      <div className="form-group">
                                        <label htmlFor="cardNumber">
                                          Card Number
                                        </label>
                                        <input
                                          className="form-control"
                                          id="cardNumber"
                                          name="cardNumber"
                                          placeholder="Card Number"
                                          type="text"
                                          value={cardDetails.cardNumber}
                                          onChange={handleInputChange}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="form-group">
                                        <label htmlFor="cardHolderName">
                                          Card Holder Name
                                        </label>
                                        <input
                                          className="form-control"
                                          id="cardHolderName"
                                          name="cardHolderName"
                                          placeholder="Card Holder Name"
                                          type="text"
                                          value={cardDetails.cardHolderName}
                                          onChange={handleInputChange}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="form-group">
                                        <label htmlFor="cardTransactionNumber">
                                          Card Transaction No.
                                        </label>
                                        <input
                                          className="form-control"
                                          id="cardTransactionNumber"
                                          name="cardTransactionNumber"
                                          placeholder="Card Transaction No."
                                          type="text"
                                          value={
                                            cardDetails.cardTransactionNumber
                                          }
                                          onChange={handleInputChange}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="form-group">
                                        <label htmlFor="cardType">
                                          Card Type
                                        </label>
                                        <select
                                          className="form-control"
                                          id="cardType"
                                          name="cardType"
                                          value={cardDetails.cardType}
                                          onChange={handleInputChange}
                                        >
                                          <option value="credit">
                                            Credit Card
                                          </option>
                                          <option value="debit">
                                            Debit Card
                                          </option>
                                          <option value="visa">Visa</option>
                                          <option value="master">
                                            MasterCard
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="form-group">
                                        <label htmlFor="cardMonth">Month</label>
                                        <input
                                          className="form-control"
                                          id="cardMonth"
                                          name="cardMonth"
                                          placeholder="Month"
                                          type="text"
                                          value={cardDetails.cardMonth}
                                          onChange={handleInputChange}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="form-group">
                                        <label htmlFor="cardYear">Year</label>
                                        <input
                                          className="form-control"
                                          id="cardYear"
                                          name="cardYear"
                                          placeholder="Year"
                                          type="text"
                                          value={cardDetails.cardYear}
                                          onChange={handleInputChange}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="form-group">
                                        <label htmlFor="cardSecurity">
                                          Security Code
                                        </label>
                                        <input
                                          className="form-control"
                                          id="cardSecurity"
                                          name="cardSecurity"
                                          placeholder="Security Code"
                                          type="text"
                                          value={cardDetails.cardSecurity}
                                          onChange={handleInputChange}
                                        />
                                      </div>
                                    </div>
                                  </>
                                )} */}

                                {/* Cheque Details */}
                                {/* {paymentMethod === "cheque" && (
                                  <div className="col-md-12">
                                    <div className="form-group">
                                      <label htmlFor="chequeNumber">
                                        Cheque No.
                                      </label>
                                      <input
                                        className="form-control"
                                        id="chequeNumber"
                                        name="chequeNumber"
                                        placeholder="Cheque No."
                                        type="text"
                                        value={chequeNumber}
                                        onChange={handleInputChange}
                                      />
                                    </div>
                                  </div>
                                )} */}

                                {/* Bank Transfer Details */}
                                {/* {paymentMethod === "bank_transfer" && (
                                  <div className="col-md-12">
                                    <div className="form-group">
                                      <label htmlFor="bankAccountNumber">
                                        Bank Account No
                                      </label>
                                      <input
                                        className="form-control"
                                        id="bankAccountNumber"
                                        name="bankAccountNumber"
                                        placeholder="Bank Account No"
                                        type="text"
                                        value={bankAccountNumber}
                                        onChange={handleInputChange}
                                      />
                                    </div>
                                  </div>
                                )} */}

                                {/* Custom Payment Details */}
                                {/* {paymentMethod.startsWith("custom_pay") && (
                                  <div className="col-md-12">
                                    <div className="form-group">
                                      <label htmlFor="customTransactionNo">
                                        Transaction No.
                                      </label>
                                      <input
                                        className="form-control"
                                        id="customTransactionNo"
                                        name="customTransactionNo"
                                        placeholder="Transaction No."
                                        type="text"
                                        value={customTransactionNo}
                                        onChange={handleInputChange}
                                      />
                                    </div>
                                  </div>
                                )} */}

                                <div className="col-md-12">
                                  <div className="form-group">
                                    <label htmlFor="note">Payment Note:</label>
                                    <textarea
                                      className="form-control"
                                      rows="3"
                                      id="note"
                                      name="note"
                                      cols="50"
                                      value={note}
                                      onChange={handleInputChange}
                                    ></textarea>
                                  </div>
                                </div>
                              </div>
                              <hr />
                              {/* <div className="row">
                                <div className="col-sm-12">
                                  <div className="pull-right">
                                    <strong>Payment Due:</strong>{" "}
                                    <span id="payment_due">
                                      {paymentDue.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div> */}
                              <br />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="container-fluid text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2 "
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
const getOrdinalSuffix = (n) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
};

export default AddExpense;
