import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";
import { toast } from "react-toastify";

function ViewDIPurchase() {
  const { id } = useParams();
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(null);
  const [location, setLocation] = useState("");
  const [payTermNumber, setPayTermNumber] = useState("");
  const [payTermType, setPayTermType] = useState("");
  const [file, setFile] = useState(null);
  const [discountType, setDiscountType] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState("");
  const [tempTax, setTempTax] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Payment method mapping
  const paymentMethodEnum = {
    card: "CARD",
    cheque: "CHEQUE",
    cash: "CASH",
    bank_transfer: "BANK_TRANSFER",
  };

  const [isVisible, setIsVisible] = useState(false);
  const [shippingDetails, setShippingDetails] = useState("");
  const [shippingCharges, setShippingCharges] = useState("");
  const [additionalExpenses, setAdditionalExpenses] = useState(
    Array(4).fill({ name: "", amount: "0" })
  );

  const [chequeNumber, setChequeNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [customTransactionNo, setCustomTransactionNo] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");

  const [paymentAccount, setPaymentAccount] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolderName: "",
    cardTransactionNumber: "",
    cardType: "credit",
    cardMonth: "",
    cardYear: "",
    cardSecurity: "",
  });

  const [productsData, setProductsData] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});

  const [vendorlist, setVendorList] = useState([]);

  const [unitCostBeforeDiscount, setUnitCostBeforeDiscount] = useState("");
  const [unitCostAfterDiscount, setUnitCostAfterDiscount] = useState("");
  const [lineTotal, setLineTotal] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [defaultUnitSellingPrice, setDefaultUitSellingPrice] = useState("");
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState("");

  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0); // New state for total units

  const [totalAmountIncTaxAndDiscount, setTotalAmountIncTaxAndDiscount] =
    useState(0);
  const [finalPurchaseAmount, setFinalPurchaseAmount] = useState(0);

  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [taxRates, setTaxRates] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [subtotalAmount, setSubTotalAmount] = useState(0);
  const [taxOnSubtotal, setTaxOnsubtotal] = useState(0);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchase-di-order/get/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase data");
        }

        const purchase = await response.json();

        // Setting state based on the fetched data
        setVendor(purchase.vendor);
        setReferenceNumber(purchase.referenceNumber);
        setStatus(purchase.status || "");
        setAddedBy(purchase.addedBy);
        setPurchaseDate(new Date(purchase.orderDate));
        setLocation(purchase.location);
        setPayTermNumber(purchase.payTermNumber);
        setPayTermType(purchase.payTermType);
        setDiscountType(purchase.discountType);
        setDiscountAmount(purchase.discountAmount);
        if (purchase.file) {
          setFile({ name: purchase.file, isExisting: true }); // only store name
        }
        // Compare using loose equality (==) instead of strict equality (===)
        const matchedPurchaseTaxOption = taxOptions.find(
          (opt) => opt.value == purchase.purchaseTax // Loose equality to handle type mismatch
        );

        if (matchedPurchaseTaxOption) {
          // Check if rate is available

          // Set purchaseTax and its rate
          setPurchaseTax(matchedPurchaseTaxOption.value); // Set the selected tax ID
          setTaxAmount(matchedPurchaseTaxOption.rate); // Set the associated tax rate (as taxAmount)
        } else {
          // Default to "None" if no match is found
          setPurchaseTax(taxOptions[0].value); // Default to first option (None)
          setTaxAmount(taxOptions[0].rate); // Default to the rate of "None" (0 rate)
        }

        // Set taxRate for each product based on the tax ID
        const selectedProducts = purchase.purchaseDIItem.map((item) => {
          const matchedTaxOption = taxOptions.find(
            (opt) => opt.value === item.taxRate
          );

          return {
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.productSku,
            quantity: item.quantity,
            defaultPurchasePriceExcTax: item.unitCostBeforeDiscount,
            discountPercent: item.discountPercent,
            taxRate: matchedTaxOption ? matchedTaxOption.rate : 0,
            taxAmount: item.taxAmount,
            profitMargin: item.profitMargin,
            productVariationId: item.productVariationId,
            variationName: item.productVariationName,
            taxRateId: matchedTaxOption ? matchedTaxOption.value : null,
          };
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations({});
        setProductsData(purchase.purchaseDIItem);

        // Shipping Details
        if (
          purchase.shippingDIDetails &&
          purchase.shippingDIDetails.length > 0
        ) {
          const shippingDetail = purchase.shippingDIDetails[0];
          setShippingDetails(shippingDetail.shippingDetails);
          setShippingCharges(shippingDetail.shippingCharges);

          setAdditionalExpenses(
            shippingDetail.additionalExpensesName.map((name, index) => ({
              name,
              amount: shippingDetail.amount[index],
            }))
          );
        }

        // Transaction details
        if (purchase.transaction && purchase.transaction.length > 0) {
          const transaction = purchase.transaction[0];
          setPaymentMethod(transaction.paymentMethod);
          setPaidOn(new Date(transaction.date));
          setAmount(transaction.amount);
          setSelectedAccount(transaction.paymentAccountId);
          setNote(transaction.note);
        }
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, [id, taxOptions]); // Add taxOptions to the dependency array

  // Fetch payment methods
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/payment-method/active-names`)
      .then((response) => {
        setPaymentMethods(response.data); // Store fetched methods
      })
      .catch((error) => {
        console.error("Error fetching payment methods:", error);
      });
  }, []);

  // Fetch payment accounts
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/payment-account/getall`)
      .then((response) => {
        // Filter active accounts (status === 1)
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
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);

      // Call the API to get the username based on the email
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            setUserName(data); // Set the username in state
          }
        })
        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);
  const handleTaxIdChange = (selectedOption) => {
    if (selectedOption === null || selectedOption.value === "") {
      setPurchaseTax(null);
      setTaxAmount(0);
    } else {
      const selectedTaxId = selectedOption.value;
      const selectedTaxRate = selectedOption.rate;

      setPurchaseTax(selectedTaxId);
      setTaxAmount(selectedTaxRate);
    }
  };

  useEffect(() => {
    // Fetch tax rates
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/tax/getall`)
      .then((response) => {
        setTaxRates(response.data);

        // Generate tax options
        const rateOptions = [
          { value: "", label: "None", rate: 0 },
          ...response.data.map((rate) => ({
            value: rate.id,
            label: `${rate.taxName} (${rate.taxValue}%)`,
            rate: rate.taxValue,
          })),
        ];
        setTaxOptions(rateOptions);
      })
      .catch((error) => console.error("Error fetching tax rates:", error));
  }, []);

  const handleTaxRateChange = (productId, selectedOption) => {
    const taxRateId = selectedOption ? selectedOption.value : null;
    const taxRate = selectedOption ? selectedOption.rate : 0;

    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              taxRate, // Update tax rate for calculations
              taxRateId, // Update taxRateId for backend
              selectedTax: selectedOption || null, // Store the full tax option for display purposes
            }
          : product
      )
    );
  };

  const calculateTotalAdditionalExpenses = () => {
    return additionalExpenses.reduce((total, expense) => {
      const expenseAmount = parseFloat(expense.amount) || 0; // Ensure it's a number
      return total + expenseAmount;
    }, 0);
  };

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/vendor/getallactive`
        );
        const data = await response.json();

        setVendorList(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchVendors();
  }, []);
  // Add this useEffect to update total units whenever selected products change
  useEffect(() => {
    const newTotalUnits = selectedProducts.reduce(
      (total, product) => total + (product.quantity || 0),
      0
    );
    setTotalUnits(newTotalUnits);
  }, [selectedProducts]);

  useEffect(() => {
    let subtotal = 0;
    let totalUnits = 0;

    selectedProducts.forEach((product) => {
      const unitCostBeforeDiscount =
        parseFloat(product.defaultPurchasePriceExcTax) || 0;
      const discountPercent = parseFloat(product.discountPercent) || 0;
      const quantity = parseFloat(product.quantity) || 0;

      const unitCostAfterDiscount =
        unitCostBeforeDiscount * (1 - discountPercent / 100);
      const lineTotal = unitCostAfterDiscount * quantity;

      const taxRate = parseFloat(product.taxRate) || 0;
      const taxAmount = (unitCostAfterDiscount * quantity * taxRate) / 100;

      const profitMargin = parseFloat(product.profitMargin) || 0;
      const profitAmount =
        unitCostAfterDiscount * quantity * (profitMargin / 100);

      subtotal += lineTotal + taxAmount + profitAmount;
      totalUnits += quantity;
    });

    setSubTotalAmount(subtotal.toFixed(2));

    // Calculate total discount
    let totalDiscount = 0;
    const discountValue = parseFloat(discountAmount) || 0;

    if (discountType === "Fixed") {
      totalDiscount = Math.min(discountValue, subtotal);
    } else if (discountType === "Percentage") {
      totalDiscount = (subtotal * discountValue) / 100;
    }

    // Tax Calculation (apply tax rate to subtotal after discount)
    const taxAmountOnSubtotal = ((subtotal - totalDiscount) * taxAmount) / 100;
    setTaxOnsubtotal(taxAmountOnSubtotal);

    // Final Amount Calculation (including discount)
    const shipping = parseFloat(shippingCharges) || 0;
    const additionalExpensesTotal = additionalExpenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount) || 0),
      0
    );

    const finalAmount =
      subtotal -
      totalDiscount +
      shipping +
      taxAmountOnSubtotal +
      additionalExpensesTotal;

    setFinalPurchaseAmount(finalAmount.toFixed(2));
  }, [
    selectedProducts,
    discountType,
    discountAmount,
    taxAmount,
    shippingCharges,
    additionalExpenses,
  ]);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value) {
      await searchProducts(value);
    } else {
      setSearchResults([]); // Clear results if the search term is empty
    }
  };

  const searchProducts = async (query) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/search?query=${query}`
      );
      const data = await response.json();
      setSearchResults(data); // Set the search results
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchProducts(searchTerm);
    }
  };

  // Handle adding the product variations to the table
  const handleAddProduct = (product) => {
    // Check if any variation is selected
    const variationsToAdd = product.productVariations.filter(
      (variation) => selectedVariations[variation.id] // Only add selected variations
    );

    if (variationsToAdd.length === 0) {
      toast.warning("Please select at least one variation to add.");
      return;
    }

    // Prevent adding duplicate variations
    const newProducts = variationsToAdd
      .map((variation) => {
        // Check if the variation is already in the selected products
        const isDuplicate = selectedProducts.some(
          (p) =>
            p.productId === product.id && p.productVariationId === variation.id
        );

        // Only add if it's not a duplicate
        if (!isDuplicate) {
          return {
            ...product,
            ...variation, // Spread variation properties into product object
            productId: product.id, // Ensure `productId` is explicitly added
            productVariationId: variation.id, // Ensure `variationId` is explicitly added
            quantity: 1, // Set default quantity
            discountPercent: 0, // Set default discount percent
          };
        }
        return null; // Return null for duplicates
      })
      .filter(Boolean); // Remove nulls from the array

    // Add only unique products to the selectedProducts state
    setSelectedProducts((prev) => [...prev, ...newProducts]);
    setSelectedVariations({}); // Clear selected variations after adding

    // Clear search results and reset the search term
    setSearchResults([]);
    setSearchTerm("");
  };

  // Handle selecting/deselecting a variation
  const handleVariationSelect = (variationId, isSelected) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationId]: isSelected,
    }));
  };

  const handleQuantityChange = (id, variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) => {
        // For regular products (no variation)
        if (!product.variationId && product.id === id) {
          return { ...product, quantity: parseInt(value) || 1 };
        }
        // For variable products (with variation)
        if (
          product.variationId &&
          product.id === id &&
          product.variationId === variationId
        ) {
          return { ...product, quantity: parseInt(value) || 1 };
        }
        return product;
      })
    );
  };

  const handleProfitMarginChange = (productId, newMargin) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, profitMargin: parseFloat(newMargin) }
          : product
      )
    );
  };

  // Handle discount change
  const handleDiscountChange = (id, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, discountPercent: parseFloat(value) }
          : product
      )
    );
  };

  // Handle removing product from the table
  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const handleMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleInputChange = (e) => {
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

  const handleExpenseChange = (index, field, value) => {
    setAdditionalExpenses((prevExpenses) => {
      // Create a new array to avoid mutating the original state
      const updatedExpenses = [...prevExpenses];
      // Update the specific field for the given index
      updatedExpenses[index] = {
        ...updatedExpenses[index],
        [field]: value,
      };
      return updatedExpenses;
    });
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  // Handle discount type change
  const handleDiscountTypeChange = (e) => {
    setDiscountType(e.target.value);
  };

  // Handle discount amount change
  const handleDiscountAmountChange = (e) => {
    setDiscountAmount(e.target.value);
  };

  // Handle additional notes change
  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    const formattedPurchaseDate = purchaseDate
      ? purchaseDate.toISOString().split("T")[0]
      : null;

    const formattedPaymentDate = paidOn
      ? paidOn.toISOString().split("T")[0]
      : null;

    const paymentMethodEnum = {
      card: "CARD",
      cheque: "CHEQUE",
      cash: "CASH",
      bank_transfer: "BANK_TRANSFER",
    };

    const shippingAllDetails = [
      {
        // id: shippingDetails.id, // Include the existing ID for shipping
        shippingDetails: shippingDetails,
        shippingCharges: parseFloat(shippingCharges) || 0,
        additionalExpensesName: additionalExpenses.map(
          (expense) => expense.name
        ),
        amount: additionalExpenses.map(
          (expense) => parseFloat(expense.amount) || 0
        ),
      },
    ];

    const productStocks = selectedProducts.map((item) => ({
      productId: item.productId,
      variationId: item.productVariationId,
      quantity: item.quantity,
      // unitCostBeforeTax: item.unitCostBeforeDiscount,
      // subTotalBeforeTax: item.lineTotal,
      transactionType: "di_purchase",
      date: new Date().toISOString().split("T")[0], // Current date
      note: "Stock updated after DI Purchase", // Optional note
    }));

    const purchaseItems = selectedProducts.map((product) => {
      const unitCostBeforeDiscount =
        parseFloat(product.defaultPurchasePriceExcTax) || 0;
      const discountPercent = parseFloat(product.discountPercent) || 0;

      // Unit Cost after Discount
      const unitCostAfterDiscount =
        unitCostBeforeDiscount * (1 - discountPercent / 100);

      // Line Total (After Discount)
      const lineTotal = unitCostAfterDiscount * product.quantity;

      // Tax Calculation (After Discount)
      const taxRate = parseFloat(product.taxRate) || 0;
      const taxAmount =
        (unitCostAfterDiscount * product.quantity * taxRate) / 100;

      // Profit Margin (Added to Line Total)
      const profitMargin = parseFloat(product.profitMargin) || 0;
      const profitAmount =
        unitCostAfterDiscount * product.quantity * (profitMargin / 100);

      // Line Total with Tax and Profit
      const lineTotalWithTaxAndProfit = lineTotal + taxAmount + profitAmount;

      // Unit Selling Price Including Tax and Profit Margin
      const unitSellingPriceIncTax = (
        unitCostAfterDiscount *
        (1 + taxRate / 100) *
        (1 + profitMargin / 100)
      ).toFixed(2);

      return {
        productId: product.productId,
        productName: product.productName,
        productSku: product.sku,
        productVariationId: product.productVariationId,
        productVariationName: product.variationName,
        quantity: product.quantity,
        unitCostBeforeDiscount: unitCostBeforeDiscount,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        unitCostAfterDiscount: unitCostAfterDiscount,
        lineTotal: lineTotal,
        taxRate: product.taxRateId,
        taxAmount: taxAmount,
        profitMargin: profitMargin,
        profitAmount: profitAmount,
        unitSellingPrice: unitSellingPriceIncTax,
      };
    });
    const transactions = [
      {
        paymentAccountId: selectedAccount,
        paymentMethod: paymentMethod,
        amount: parseFloat(amount) || 0,
        transactionType: "purchase",
        addedBy: userName,
        note: note || "",
        //  date: formattedPaymentDate,
        vendor: vendor || "",
        chequeNumber: chequeNumber || null,
        cardType: cardDetails.cardType || null,
        cardNumber: cardDetails.cardNumber || null,
        cardHolderName: cardDetails.cardHolderName || null,
        cardTransactionNumber: cardDetails.cardTransactionNumber,
        cardMonth: cardDetails.cardMonth,
        cardYear: cardDetails.cardYear,
        cardSecurity: cardDetails.cardSecurity,
      },
    ];
    const payload = {
      id: id,
      vendor,
      referenceNumber,
      status,
      addedBy,
      orderDate: formattedPurchaseDate,
      payTermNumber,
      payTermType,
      location,
      totalItems: totalUnits,
      netTotalAmount: finalPurchaseAmount,
      discountType,
      discountAmount: parseFloat(discountAmount) || 0,
      purchaseTax,
      taxAmount: taxOnSubtotal,
      additionalNotes,
      transaction: transactions,
      shippingDIDetails: shippingAllDetails,
      purchaseDIItem: purchaseItems,
      stockTransactions: productStocks,
    };

    console.log("Payload:", payload); // Debug the payload

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-di-order/update/${id}`,
        {
          method: "PUT", // Change method to PUT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success("Purchase DI Order updated successfully");
        // Optionally reset form or navigate to another page
      } else {
        // const responseText = await response.text();
        // console.log("Response Status:", response.status);
        // console.log("Response Text:", responseText);

        toast.error("Purchase DI Order Not Updated");
      }
    } catch (error) {
      toast.error("Error:", error);
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading">View DI Purchase</h1>
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
                      {/* Vendor Dropdown */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Vendor</label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2"
                                id="vendor"
                                name="vendor"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                required
                                disabled
                              >
                                <option value="">Please Select</option>
                                {vendorlist.map((vendorItem) => (
                                  <option
                                    key={vendorItem.id}
                                    value={vendorItem.firmName}
                                  >
                                    {vendorItem.firmName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reference No */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="referenceNumber">
                            Reference No<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="referenceNumber"
                            name="referenceNumber"
                            placeholder="Enter here.."
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Added By */}
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
                            placeholder="Enter here..."
                            value={addedBy}
                            onChange={(e) => setAddedBy(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Purchase Date */}
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row  flex-md-column ">
                          <label htmlFor="transaction_date">
                            Purchase Date
                          </label>
                          <DatePicker
                            selected={purchaseDate}
                            onChange={(date) => setPurchaseDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            disabled
                          />
                        </div>
                      </div>
                      <div className=" col-md-4">
                        <div className="form-group">
                          <label htmlFor="file">Upload File:</label>
                          <div className="file-input file-input-new">
                            <div className="file-preview">
                              {file ? (
                                <>
                                  <div className="file-preview-thumbnails">
                                    <div>{file.name}</div>
                                  </div>
                                  {/* <div className="file-preview-status text-center text-success">
                                    File ready to upload
                                  </div> */}
                                </>
                              ) : (
                                <div className="file-drop-disabled">
                                  <div className="file-preview-status text-center text-danger"></div>
                                </div>
                              )}
                            </div>

                            <div className="input-group">
                              {/* <div className="form-control file-caption kv-fileinput-caption">
                                <div className="file-caption-name">
                                  {file ? file.name : "No file selected"}
                                </div>
                              </div> */}
                              {/* <div className="input-group-append">
                                <div className="btn btn-primary btn-file rounded-0 py-1 px-2 ms-2">
                                  <i className="glyphicon glyphicon-folder-open"></i>
                                  &nbsp; Browse..
                                  <input
                                    id="upload_file"
                                    accept=".jpg,.jpeg,.png,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                    className="upload-element"
                                    name="file"
                                    type="file"
                                    onChange={handleFileChange}
                                    disabled
                                  />
                                </div>
                              </div> */}
                            </div>

                            {/* <small className="form-text text-muted">
                              Max File size: 5MB <br />
                              Supported types: Images, PDF, Word, Excel, CSV,
                              Text
                            </small> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="search-bar">
                          <div className="search-input">
                            <i className="fa fa-search search-icon"></i>
                            <input
                              type="text"
                              placeholder="Enter Product name / SKU / Scan bar code"
                              value={searchTerm}
                              onChange={handleSearch}
                              onKeyPress={handleKeyPress} // Listen for Enter key press
                              disabled
                            />
                          </div>
                          {/* <Link to="/AddProducts">
                            <i className="fas fa-plus"></i> Add New Product
                          </Link> */}
                        </div>

                        <div className="product-list">
                          {searchTerm && searchResults.length > 0 ? (
                            searchResults.map((product) => (
                              <div key={product.id} className="product-item">
                                <span className="product-name">
                                  {product.productName} ({product.sku}) - Stock:{" "}
                                </span>
                                {product.productVariations.length > 0 && (
                                  <div className="variations">
                                    <ul>
                                      {product.productVariations.map(
                                        (variation) => (
                                          <li key={variation.id}>
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={
                                                  selectedVariations[
                                                    variation.id
                                                  ] || false
                                                }
                                                onChange={(e) =>
                                                  handleVariationSelect(
                                                    variation.id,
                                                    e.target.checked
                                                  )
                                                }
                                              />
                                              {variation.name}{" "}
                                              {variation.variationValue} -
                                              Price:{" "}
                                              {
                                                variation.defaultPurchasePriceExcTax
                                              }
                                            </label>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleAddProduct(product)}
                                  className="btn btn-add-variation btn-success"
                                >
                                  Add Selected Variations
                                </button>
                              </div>
                            ))
                          ) : searchTerm && searchResults.length === 0 ? (
                            <div className="no-results highlight-message">
                              No products found or the search term is invalid.
                            </div>
                          ) : null}
                        </div>

                        {selectedProducts.length > 0 && (
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Product Name</th>
                                  <th>Purchase Quantity</th>
                                  <th>Unit Cost (Before Discount)</th>
                                  <th>Discount Percent</th>
                                  <th>Unit Cost (After Discount)</th>
                                  <th>Line Total</th>
                                  <th>Tax Rate</th>
                                  <th>Tax Amount</th>
                                  <th>Profit Margin (%)</th>
                                  <th>Unit Selling Price (Inc. Tax)</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  const unitCostBeforeDiscount =
                                    parseFloat(
                                      product.defaultPurchasePriceExcTax
                                    ) || 0;
                                  const discountPercent =
                                    parseFloat(product.discountPercent) || 0; // Default to 0 if no discount

                                  // Unit Cost after Discount
                                  const unitCostAfterDiscount =
                                    unitCostBeforeDiscount *
                                    (1 - discountPercent / 100);

                                  // Line Total (After Discount)
                                  const lineTotal =
                                    unitCostAfterDiscount * product.quantity;

                                  // Tax Calculation (After Discount)
                                  const taxRate = product.taxRate || 0; // Default to 0 if no tax rate selected
                                  const taxAmount =
                                    (unitCostAfterDiscount *
                                      product.quantity *
                                      taxRate) /
                                    100;

                                  // Profit Margin (Added to Line Total)
                                  const profitMargin =
                                    parseFloat(product.profitMargin) || 0; // Default to 0 if no profit margin
                                  const profitAmount =
                                    unitCostAfterDiscount *
                                    product.quantity *
                                    (profitMargin / 100);

                                  // Line Total with Tax and Profit
                                  const lineTotalWithTaxAndProfit =
                                    lineTotal + taxAmount + profitAmount;

                                  // Calculate Unit Selling Price (Inc. Tax)
                                  const unitSellingPriceIncTax = (
                                    unitCostAfterDiscount *
                                    (1 + taxRate / 100) *
                                    (1 + profitMargin / 100)
                                  ).toFixed(2);

                                  return (
                                    <tr key={product.id}>
                                      <td>{index + 1}</td>
                                      <td>
                                        {product.productName} ({product.sku})
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          value={product.quantity}
                                          min="1"
                                          style={{
                                            width: "80px",
                                            padding: "5px",
                                            textAlign: "center",
                                          }}
                                          readOnly
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              product.id,
                                              product.variationId,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>
                                      <td>
                                        {unitCostBeforeDiscount.toFixed(2)}
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          style={{
                                            width: "80px",
                                            padding: "5px",
                                            textAlign: "center",
                                          }}
                                          readOnly
                                          value={discountPercent}
                                          onChange={(e) =>
                                            handleDiscountChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>
                                      <td>
                                        {unitCostAfterDiscount.toFixed(2)}
                                      </td>
                                      <td>{lineTotal.toFixed(2)}</td>
                                      <td style={{ width: "200px" }}>
                                        <Select
                                          options={taxOptions}
                                          value={
                                            taxOptions.find(
                                              (opt) =>
                                                opt.value === product.taxRateId
                                            ) || taxOptions[0]
                                          }
                                          isDisabled={true}
                                          onChange={(selected) =>
                                            handleTaxRateChange(
                                              product.id,
                                              selected
                                            )
                                          }
                                          placeholder="Select Tax"
                                          isSearchable
                                          styles={{
                                            control: (provided) => ({
                                              ...provided,
                                              width: "100%",
                                            }),
                                          }}
                                        />
                                      </td>
                                      <td>{taxAmount.toFixed(2)}</td>
                                      <td>
                                        <input
                                          type="number"
                                          value={profitMargin}
                                          readOnly
                                          style={{
                                            width: "80px",
                                            padding: "5px",
                                            textAlign: "center",
                                          }}
                                          onChange={(e) =>
                                            handleProfitMarginChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>
                                      <td>{unitSellingPriceIncTax}</td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-danger"
                                          onClick={() =>
                                            handleRemoveProduct(product.id)
                                          }
                                          disabled
                                        >
                                          <i className="fa fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* Total Amount Calculation - Sum of Unit Selling Price (Inc. Tax) * Quantity */}
                            <div>
                              Total Amount: <strong> ₹{subtotalAmount}</strong>
                            </div>

                            {/* Total Units Calculation */}
                            <div className="total-units">
                              Total Units:<strong> {totalUnits}</strong>
                            </div>
                          </div>
                        )}

                        {/* Form submission and other components can go here */}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Discount Type Section */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <table className="table border-0">
                        <tbody>
                          <tr>
                            {/* Discount Type Dropdown */}
                            <td className="col-md-3">
                              <div className="form-group">
                                <label htmlFor="discountType">
                                  Discount Type
                                </label>
                                <select
                                  className="form-control select2"
                                  id="discountType"
                                  name="discountType"
                                  value={discountType}
                                  onChange={handleDiscountTypeChange}
                                  disabled
                                >
                                  <option value="">None</option>
                                  <option value="Fixed">Fixed</option>
                                  <option value="Percentage">Percentage</option>
                                </select>
                              </div>
                            </td>

                            {/* Discount Amount Input */}
                            <td className="col-md-3">
                              <div className="form-group">
                                <label htmlFor="discount_amount">
                                  {discountType === "Percentage"
                                    ? "Discount Percentage (%)"
                                    : "Discount Amount"}
                                </label>

                                {/* Conditionally render the input field */}
                                <input
                                  className="form-control input_number"
                                  required
                                  name="discount_amount"
                                  type="text"
                                  value={discountAmount}
                                  onChange={handleDiscountAmountChange}
                                  id="discount_amount"
                                  disabled={discountType === ""}
                                  readOnly
                                  placeholder={
                                    discountType === "Percentage"
                                      ? "Enter percentage (e.g., 10)"
                                      : "Enter fixed amount (e.g., 100)"
                                  }
                                />
                              </div>
                            </td>

                            {/* Calculated Discount */}
                            <td className="col-md-3">
                              <b>Discount</b> (-)
                              <span
                                id="discount_calculated_amount"
                                className="display_currency"
                              >
                                {discountAmount
                                  ? parseFloat(discountAmount).toFixed(2)
                                  : "0.00"}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              {/* Tax Selection */}
                              <div className="col-md-auto">
                                <div className="form-group">
                                  <label>Purchase Tax</label>
                                  <Select
                                    options={taxOptions}
                                    value={
                                      taxOptions.find(
                                        (opt) => opt.value === purchaseTax
                                      ) || taxOptions[0] // Default to "None"
                                    }
                                    onChange={handleTaxIdChange}
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
                              </div>
                            </td>

                            <td>&nbsp;</td>

                            {/* Calculated Tax Amount */}
                            <td>
                              <b>Tax Amount</b> (+)
                              <span
                                id="tax_calculated_amount"
                                className="display_currency"
                              >
                                {taxOnSubtotal}
                              </span>
                            </td>
                          </tr>
                          {/* Additional Notes */}
                          <tr>
                            <td colSpan="4">
                              <div className="form-group">
                                <label htmlFor="additional_notes">
                                  Additional Notes
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  name="additional_notes"
                                  cols="50"
                                  id="additional_notes"
                                  value={additionalNotes}
                                  onChange={handleAdditionalNotesChange}
                                  readOnly
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* shipping details */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="shippingDetails">
                            Shipping Details
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="shippingDetails"
                            name="shippingDetails"
                            placeholder="Enter here.."
                            value={shippingDetails}
                            onChange={(e) => setShippingDetails(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="shippingCharges">
                            Additional Shipping Charges
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded"
                            id="shippingCharges"
                            name="shippingCharges"
                            placeholder="0"
                            value={shippingCharges}
                            onChange={(e) => setShippingCharges(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-12 text-center">
                        <button
                          type="button"
                          className="btn"
                          style={{ backgroundColor: "#0c4461", color: "white" }}
                          onClick={toggleVisibility}
                          disabled
                        >
                          <i className="fas fa-plus"></i> Add additional
                          expenses{" "}
                          <i
                            className={`fas ${
                              isVisible ? "fa-chevron-up" : "fa-chevron-down"
                            }`}
                          ></i>
                        </button>
                      </div>
                      {isVisible && (
                        <div className="col-md-8 col-md-offset-4">
                          <table className="table table-bordered add-product-price-table table-condensed ">
                            <thead>
                              <tr>
                                <th>Additional Expense Name</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {additionalExpenses.map((expense, index) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      className="form-control"
                                      type="text"
                                      value={expense.name}
                                      onChange={(e) =>
                                        handleExpenseChange(
                                          index,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      className="form-control input_number"
                                      type="text"
                                      value={expense.amount}
                                      onChange={(e) =>
                                        handleExpenseChange(
                                          index,
                                          "amount",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <label>Purchase Total:{finalPurchaseAmount}</label>
                    </div>
                  </div>
                </div>

                <div className="container-fluid text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2 "
                    disabled
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

export default ViewDIPurchase;
