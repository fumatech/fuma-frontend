import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";
import axios from "axios";
import Select from "react-select";
import { toast } from "react-toastify";

function ViewExpense() {
  const { id } = useParams(); // Get expense ID from URL
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [existingFile, setExistingFile] = useState("");
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
  const [selectedAccount, setSelectedAccount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [note, setNote] = useState("");
  const [paymentDue, setPaymentDue] = useState(0);
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
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error(err));
  }, []);
  // Fetch expense data by ID on component mount
  useEffect(() => {
    if (id) {
      fetchExpenseData();
    }
  }, [id]);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/add-expenses/get/${id}`
      );

      const expenseData = response.data;

      // Populate form fields with fetched data
      setLocationId(expenseData.businessLocation || "");
      setExpenseCategoryId(expenseData.expenseCategory?.toString() || "");
      setExpenseSubCategoryId(expenseData.subCategory?.toString() || "");
      setRefNo(expenseData.refNo || "");
      setTransactionDate(formatDate(expenseData.date) || "");
      setExpenseFor(expenseData.expenseFor?.toString() || "");
      setContactId(expenseData.expenseForContact?.toString() || "");
      setExistingFile(expenseData.file || "");
      setTaxId(expenseData.tax?.toString() || "");
      setFinalTotal(expenseData.totalAmount?.toString() || "");
      setAdditionalNotes(expenseData.note || "");
      setIsRefund(expenseData.isRefund || false);
      setIsRecurring(expenseData.isRecurring || false);
      setRecurInterval(expenseData.recurInterval || "");
      setRecurIntervalType(expenseData.recurIntervalType || "days");
      setRecurRepetitions(expenseData.recurRepetitions || "");
      setRepeatOn(expenseData.repeatOn || "");

      // Handle transaction data
      if (expenseData.transaction && expenseData.transaction.length > 0) {
        const transaction = expenseData.transaction[0];
        setTransactionId(transaction.id || "");
        setAmount(transaction.amount?.toString() || "");
        setPaidOn(formatDate(transaction.date) || "");
        setPaymentMethod(transaction.paymentMethod || "cash");
        setPaymentAccount(transaction.paymentAccountId?.toString() || "");
        setSelectedAccount(transaction.paymentAccountId?.toString() || "");
        setNote(transaction.note || "");
        setPaymentDue(transaction.paymentDue || 0);

        // Set card details if available
        if (transaction.cardDetails) {
          setCardDetails({
            cardNumber: transaction.cardDetails.cardNumber || "",
            cardHolderName: transaction.cardDetails.cardHolderName || "",
            cardTransactionNumber:
              transaction.cardDetails.cardTransactionNumber || "",
            cardType: transaction.cardDetails.cardType || "credit",
            cardMonth: transaction.cardDetails.cardMonth || "",
            cardYear: transaction.cardDetails.cardYear || "",
            cardSecurity: transaction.cardDetails.cardSecurity || "",
          });
        }

        setChequeNumber(transaction.chequeNumber || "");
        setBankAccountNumber(transaction.bankAccountNumber || "");
        setCustomTransactionNo(transaction.customTransactionNo || "");
      }

      setLoading(false);
    } catch (error) {
      // console.error("Error fetching expense data:", error);
      setLoading(false);
      toast.error("Failed to load expense data");
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    resetFields(e.target.value);
  };

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
      { value: "", label: "None", rate: 0 },
      ...taxRates.map((rate) => ({
        value: rate.id,
        label: `${rate.taxName} (${rate.taxValue}%)`,
        rate: rate.taxValue,
      })),
    ];
    setTaxOptions(rateOptions);
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

  useEffect(() => {
    if (expenseCategoryId && expenses.length > 0) {
      const selected = expenses.find((e) => e.id == expenseCategoryId);

      if (selected && selected.subExpenses) {
        setFilteredSubExpenses(selected.subExpenses);
      } else {
        setFilteredSubExpenses([]);
      }
    }
  }, [expenseCategoryId, expenses]);
  const handleCategoryChange = (id) => {
    setExpenseCategoryId(id);
    setExpenseSubCategoryId(""); // reset only on manual change
  };

  useEffect(() => {
    const dueAmount = parseFloat(amount) || 0;
    setPaymentDue(dueAmount);
  }, [amount]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMessage("File size exceeds 5MB");
        setFile(null);
      } else {
        setErrorMessage("");
        setFile(selectedFile);
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setExistingFile("");
    setProgress(0);
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expenseObj = {
        businessLocation: locationId,
        expenseCategory: expenseCategoryId ? Number(expenseCategoryId) : null,
        subCategory: expenseSubCategoryId ? Number(expenseSubCategoryId) : null,
        date: transactionDate
          ? new Date(transactionDate).toISOString()
          : new Date().toISOString(),
        expenseFor: 1,
        expenseForContact: contactId ? Number(contactId) : 1,
        tax: taxId ? Number(taxId) : null,
        totalAmount: finalTotal ? Number(finalTotal) : 0,
        note: additionalNotes || "",
        isRefund: isRefund,
        isRecurring: isRecurring,
        recurInterval: recurInterval,
        recurIntervalType: recurIntervalType,
        recurRepetitions: recurRepetitions,
        repeatOn: repeatOn,
        transaction: [],
      };

      const transactionObj = {
        id: transactionId, // Include transaction ID for update
        amount: Number(finalTotal),
        paymentMethod,
        addedBy: userName,
        transactionType: "expense",
        note,
        vendor: "",
        date: paidOn
          ? new Date(paidOn).toISOString()
          : new Date().toISOString(),
        paymentAccountId: paymentAccount ? Number(paymentAccount) : null,
        cardDetails: paymentMethod === "card" ? cardDetails : null,
        chequeNumber: paymentMethod === "cheque" ? chequeNumber : "",
        bankAccountNumber:
          paymentMethod === "bank_transfer" ? bankAccountNumber : "",
        customTransactionNo: paymentMethod.startsWith("custom_pay")
          ? customTransactionNo
          : "",
        paymentDue: paymentDue,
      };

      const multipart = new FormData();
      multipart.append("addExpenses", JSON.stringify(expenseObj));
      multipart.append("transaction", JSON.stringify(transactionObj));

      if (file) {
        multipart.append("file", file);
      }

      // console.log("Updating Expense ID:", id);
      // console.log("Expense Object:", expenseObj);
      // console.log("Transaction Object:", transactionObj);

      const response = await axios.put(
        `${process.env.REACT_APP_BASE_URL}/add-expenses/update/${id}`,
        multipart,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Expense Updated Successfully!");
      navigate("/expenses"); // Redirect to expenses list page
    } catch (error) {
      //  console.error("Error updating expense:", error);
      toast.error("Failed to update expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  //   if (loading) {
  //     return (
  //       <div className="wrapper">
  //         <div className="content-wrapper">
  //           <section className="content">
  //             <div className="container-fluid text-center py-5">
  //               <div className="spinner-border text-primary" role="status">
  //                 <span className="sr-only">Loading...</span>
  //               </div>
  //               <p className="mt-3">Loading expense data...</p>
  //             </div>
  //           </section>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-md-6">
                  <BackButton />
                  <h1 className="all-heading">View Expense</h1>
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
                          disabled
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
                          disabled
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
                          disabled
                        >
                          <option value="">Please Select</option>
                          {filteredSubExpenses.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.expenseName}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Reference Number */}
                      {/* <div className="col-md-4">
                        <label htmlFor="ref_no">Reference No:</label>
                        <input
                          className="form-control"
                          name="ref_no"
                          type="text"
                          id="ref_no"
                          value={refNo}
                          onChange={(e) => setRefNo(e.target.value)}
                          placeholder="Leave empty to autogenerate"
                        />
                      </div> */}
                      {/* Date */}
                      <div className="col-md-4">
                        <label htmlFor="transaction_date">Date:*</label>
                        <div className="input-group">
                          <input
                            className="form-control"
                            required
                            id="expense_transaction_date"
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            disabled
                          />
                          <div className="input-group-prepend">
                            <span className="input-group-text bg-transparent">
                              <i className="fa fa-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Expense for */}
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
                          disabled
                        >
                          <option value="">Please Select</option>
                          <option value="1">Walk-In Customer</option>
                          <option value="2">Regular Customer</option>
                        </select>
                      </div>
                      {/* Attach document */}
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label htmlFor="image">Attach document:</label>
                          <div className="file-input file-input-new">
                            <div className="file-preview">
                              {file || existingFile ? (
                                <>
                                  <button
                                    type="button"
                                    className="close fileinput-remove"
                                    onClick={handleRemove}
                                    disabled
                                  >
                                    &times;
                                  </button>
                                  <div className="file-preview-thumbnails">
                                    <div>
                                      {file
                                        ? file.name
                                        : "Existing file attached"}
                                    </div>
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
                                  {file
                                    ? file.name
                                    : existingFile
                                      ? "Existing file"
                                      : "No file selected"}
                                </div>
                              </div>
                              {/* <div className="input-group-append">
                                {(file || existingFile) && (
                                  <button
                                    type="button"
                                    title="Clear selected files"
                                    className="btn btn-secondary fileinput-remove"
                                    onClick={handleRemove}
                                    disabled
                                  >
                                    <i className="glyphicon glyphicon-trash"></i>{" "}
                                    Remove
                                  </button>
                                )}
                              </div> */}
                            </div>
                          </div>
                          <small className="form-text text-muted">
                            Max File size: 5MB
                          </small>
                        </div>
                      </div>
                      {/* Applicable Tax */}
                      <div className="col-md-4">
                        <label htmlFor="tax_id">Applicable Tax:</label>
                        <Select
                          options={taxOptions}
                          value={
                            taxOptions.find(
                              (option) =>
                                option.value.toString() === taxId.toString()
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setTaxId(selectedOption ? selectedOption.value : "")
                          }
                          isDisabled={true}
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
                          readOnly
                          step="0.01"
                          min="0"
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
                          readOnly
                        />
                      </div>
                      {/* Is refund */}
                      {/* <div className="col-md-4 col-md-6">
                        <div className="form-check mt-4">
                          <input
                            className="form-check-input"
                            id="is_refund"
                            name="is_refund"
                            type="checkbox"
                            checked={isRefund}
                            onChange={() => setIsRefund(!isRefund)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="is_refund"
                          >
                            Is refund?
                          </label>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>

                {/* Recurring Expense Section */}
                {/* {!isRefund && (
                  <div className="card card-default rounded-4 border-0 cardHover mt-3">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 col-sm-6">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              id="is_recurring"
                              type="checkbox"
                              checked={isRecurring}
                              onChange={() => setIsRecurring(!isRecurring)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="is_recurring"
                            >
                              Is Recurring?
                            </label>
                          </div>
                        </div>

                        {isRecurring && (
                          <>
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
                                    min="1"
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
                                  min="1"
                                />
                                <p className="help-block">
                                  If blank, expense will be generated infinite
                                  times
                                </p>
                              </div>
                            </div>

                            {recurIntervalType === "months" && (
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
                                    onChange={(e) =>
                                      setRepeatOn(e.target.value)
                                    }
                                  >
                                    <option value="">Please Select</option>
                                    {[...Array(31).keys()].map((i) => (
                                      <option key={i + 1} value={i + 1}>
                                        {i + 1}
                                        {getOrdinalSuffix(i + 1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Add payment */}
                <div className="card card-default rounded-4 border-0 cardHover mt-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-12">
                        <h3 className="mb-4">Payment Details</h3>
                        <div className="py-2">
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
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    readOnly
                                    step="0.01"
                                    min="0"
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
                                    onChange={(e) => setPaidOn(e.target.value)}
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="form-group">
                                <label htmlFor="method">Payment Method:*</label>
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
                                    onChange={handleMethodChange}
                                    disabled
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
                                      setPaymentAccount(e.target.value);
                                    }}
                                    disabled
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
                            {paymentMethod === "card" && (
                              <div className="col-12 mt-3">
                                <h5>Card Details</h5>
                                <div className="row">
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
                                </div>
                              </div>
                            )}

                            {/* Cheque Details */}
                            {paymentMethod === "cheque" && (
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
                            )}

                            {/* Bank Transfer Details */}
                            {paymentMethod === "bank_transfer" && (
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
                            )}

                            {/* Custom Payment Details */}
                            {paymentMethod.startsWith("custom_pay") && (
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
                            )}

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
                                  onChange={(e) => setNote(e.target.value)}
                                  readOnly
                                ></textarea>
                              </div>
                            </div>
                          </div>
                          <hr />

                          <br />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="container-fluid text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2"
                    disabled
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm mr-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Updating...
                      </>
                    ) : (
                      "Update Expense"
                    )}
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

export default ViewExpense;
