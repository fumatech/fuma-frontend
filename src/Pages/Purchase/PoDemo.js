import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";

function AddPoPurchase() {
  const navigate = useNavigate();

  const [vendor, setVendor] = useState("");
  const [orderId, setOrderId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [referenceNumber, setReferenceNumber] = useState("");
  const [purchaseReferenceNumber, setPurchaseReferenceNumber] = useState("");

  const [status, setStatus] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderedBy, setOrderedBy] = useState("");

  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [orderDate, setOrderDate] = useState(new Date());

  const [location, setLocation] = useState("");
  const [payTermNumber, setPayTermNumber] = useState("");
  const [payTermType, setPayTermType] = useState("");
  const [file, setFile] = useState(null);
  const [discountType, setDiscountType] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [additionalNotes, setAdditionalNotes] = useState("");

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
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolderName: "",
    cardTransactionNumber: "",
    cardType: "",
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
    if (selectedOrderId) {
      axios
        .get(
          `${process.env.REACT_APP_BASE_URL}/purchaseorder/getPoDataById/${selectedOrderId.value}`
        )
        .then((response) => {
          const data = response.data;

          setVendor(data.vendor);
          setReferenceNumber(data.referenceNumber);
          setOrderedBy(data.addedBy);
          setOrderDate(new Date(data.orderDate));
          setLocation(data.location);
          setAdditionalNotes(data.additionalNotes);

          const fetchProductDetails = data.orderItems.map((item) => {
            return axios
              .get(`${process.env.REACT_APP_BASE_URL}/product/details`, {
                params: {
                  productName: item.productName,
                  productVariationId: item.productVariationId,
                },
              })
              .then((response) => {
                const matchedVariation = response.data.productVariations.find(
                  (variation) =>
                    variation.id.toString() === item.productVariationId
                );

                const defaultPurchasePriceExcTax =
                  matchedVariation?.defaultPurchasePriceExcTax || 0;
                const quantity = item.quantity || 1; // Default quantity
                const discountPercent = item.discountPercent || 0; // Default discount
                const lineTotal = (
                  defaultPurchasePriceExcTax *
                  quantity *
                  (1 - discountPercent / 100)
                ).toFixed(2); // Line total calculation

                return {
                  ...item,
                  ...matchedVariation, // Include variation details
                  defaultPurchasePriceExcTax,
                  quantity,
                  discountPercent,
                  profitMargin: matchedVariation?.profitMargin || 0,
                  lineTotal,
                };
              })
              .catch((error) => {
                console.error("Error fetching product details:", error);
                return {
                  ...item,
                  defaultPurchasePriceExcTax: 0,
                  quantity: item.quantity || 1,
                  discountPercent: 0,
                  profitMargin: 0,
                  lineTotal: 0,
                };
              });
          });

          console.log(fetchProductDetails);

          Promise.all(fetchProductDetails)
            .then((productsWithPrices) => {
              setSelectedProducts(productsWithPrices); // Pre-fill selected products

              // Recalculate totals
              const totalAmount = productsWithPrices
                .reduce(
                  (total, product) =>
                    total +
                    product.quantity *
                      product.defaultPurchasePriceExcTax *
                      (1 - product.discountPercent / 100),
                  0
                )
                .toFixed(2);

              const totalUnits = productsWithPrices.reduce(
                (total, product) => total + product.quantity,
                0
              );

              //  setTotalAmount(totalAmount);
              setTotalUnits(totalUnits);
            })
            .catch((error) => {
              console.error("Error resolving product details:", error);
            });
        })
        .catch((error) => {
          console.error("Error fetching purchase order data:", error);
        });
    }
  }, [selectedOrderId]);

  useEffect(() => {
    // Fetch order IDs from backend
    axios
      .get(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/getOrderIdsByStatus/3`
      )
      .then((response) => {
        const options = response.data.map((id) => ({ value: id, label: id }));
        setOrderId(options);
      })
      .catch((error) => console.error("Error fetching order IDs:", error));
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

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/vendor/getall`
        );
        const data = await response.json();
        //console.log(data);

        setVendorList(data); // Set the search results
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchVendors();
  }, []);
  // Function to calculate total additional expenses
  const calculateTotalAdditionalExpenses = () => {
    return additionalExpenses.reduce((total, expense) => {
      const expenseAmount = parseFloat(expense.amount) || 0; // Ensure it's a number
      return total + expenseAmount;
    }, 0);
  };
  useEffect(() => {
    let totalAmountBeforeDiscount = 0;
    let totalUnits = 0;
    let totalAmount = 0;

    // Loop through selected products to calculate totalAmount and totalUnits
    selectedProducts.forEach((product) => {
      const unitCostBeforeDiscount =
        parseFloat(product.defaultPurchasePriceExcTax) || 0;
      const discountPercent = parseFloat(product.discountPercent) || 0;
      const profitMargin = parseFloat(product.profitMargin) || 0;
      const quantity = parseFloat(product.quantity) || 0;

      // Calculate unit cost after applying discount
      const unitCostAfterDiscount =
        unitCostBeforeDiscount * (1 - discountPercent / 100);

      // Calculate unit selling price after applying profit margin
      const unitSellingPrice = unitCostAfterDiscount * (1 + profitMargin / 100);

      // Accumulate total amount (selling price) and units
      totalAmount += unitSellingPrice * quantity;
      totalUnits += quantity;

      // Calculate total amount before discount (unit cost before discount)
      totalAmountBeforeDiscount += unitCostBeforeDiscount * quantity;
    });

    // Ensure that discountAmount is a number and default to 0 if it's invalid
    const discountValue = parseFloat(discountAmount) || 0;

    // Calculate the total discount based on the type
    let totalDiscount = 0;
    if (discountType === "fixed") {
      totalDiscount = discountValue;
    } else if (discountType === "percentage" && totalAmountBeforeDiscount > 0) {
      // Calculate percentage discount only if totalAmountBeforeDiscount is positive
      totalDiscount = (totalAmountBeforeDiscount * discountValue) / 100;
    }

    // Calculate Total After Discount
    const totalAfterDiscount = Math.max(
      totalAmountBeforeDiscount - totalDiscount,
      0
    );

    // Determine Tax Rate
    const taxRate =
      {
        "VAT@10%": 10,
        "CGST@10%": 10,
        "SGST@8%": 8,
        "GST@18%": 18,
      }[purchaseTax] || 0;

    // Calculate Tax Amount based on the total after discount
    const taxAmount = (totalAfterDiscount * taxRate) / 100;

    // Calculate Additional Expenses
    const totalAdditionalExpenses = calculateTotalAdditionalExpenses() || 0;
    const parsedShippingCharges = parseFloat(shippingCharges) || 0;

    // Calculate Final Purchase Amount
    const finalPurchaseAmount =
      totalAmount + // Total after discount
      taxAmount + // Add Tax
      parsedShippingCharges + // Add Shipping Charges
      totalAdditionalExpenses - // Subtract Total Discount
      totalDiscount;

    // Update States
    const totalAmountRounded = parseFloat(totalAmount.toFixed(2));
    const totalDiscountRounded = parseFloat(totalDiscount.toFixed(2));
    const taxAmountRounded = parseFloat(taxAmount.toFixed(2));
    const finalPurchaseAmountRounded = parseFloat(
      finalPurchaseAmount.toFixed(2)
    );

    setTotalAmount((prev) =>
      prev !== totalAmountRounded ? totalAmountRounded : prev
    );
    setTotalUnits((prev) => (prev !== totalUnits ? totalUnits : prev));
    setTaxAmount((prev) =>
      prev !== taxAmountRounded ? taxAmountRounded : prev
    );
    setDiscountAmount((prev) =>
      prev !== totalDiscountRounded ? totalDiscountRounded : prev
    );
    setFinalPurchaseAmount((prev) =>
      prev !== finalPurchaseAmountRounded ? finalPurchaseAmountRounded : prev
    );
  }, [
    selectedProducts,
    discountType,
    discountAmount,
    purchaseTax,
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
      alert("Please select at least one variation to add.");
      return;
    }

    // Prevent adding duplicate variations
    const newProducts = variationsToAdd
      .map((variation) => {
        // Check if the variation is already in the selected products
        const isDuplicate = selectedProducts.some(
          (p) => p.id === product.id && p.variationId === variation.id
        );

        // Only add if it's not a duplicate
        if (!isDuplicate) {
          return {
            ...product,
            ...variation, // Spread variation properties into product object
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

  // Handle quantity change
  const handleQuantityChange = (id, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, quantity: parseInt(value) } : product
      )
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

  // Handle tax selection change
  const handleTaxIdChange = (e) => {
    const selectedTaxId = e.target.value;
    const taxOptions = e.target.options;
    const selectedTaxOption = Array.from(taxOptions).find(
      (option) => option.value === selectedTaxId
    );
    setPurchaseTax(selectedTaxId);
    setTaxAmount(selectedTaxOption ? selectedTaxOption.dataset.taxAmount : "0");
  };

  // Handle additional notes change
  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format dates to ISO string if valid
    const formattedPurchaseDate = purchaseDate
      ? purchaseDate.toISOString().split("T")[0]
      : null;
    const formattedPaymentDate = paidOn
      ? paidOn.toISOString().split("T")[0]
      : null;

    // Map payment method to enum
    const paymentMethodEnum = {
      card: "CARD",
      cheque: "CHEQUE",
      cash: "CASH",
      bank_transfer: "BANK_TRANSFER",
    };

    // Prepare the shipping details
    const shippingAllDetails = [
      {
        shippingDetails: shippingDetails || "",
        shippingCharges: parseFloat(shippingCharges) || 0,
        additionalExpensesName: additionalExpenses.map(
          (expense) => expense.name
        ),
        amount: additionalExpenses.map(
          (expense) => parseFloat(expense.amount) || 0
        ),
      },
    ];

    // Prepare purchase items
    const purchaseItems = selectedProducts.map((product) => ({
      productId: product.productId,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.productVariationId,
      productVariationName: product.variationName,
      quantity: product.quantity,
      unitCostBeforeDiscount: product.defaultPurchasePriceExcTax,
      discountPercent: product.discountPercent,
      unitCostAfterDiscount:
        product.defaultPurchasePriceExcTax -
        (product.defaultPurchasePriceExcTax * product.discountPercent) / 100,
      lineTotal:
        (product.defaultPurchasePriceExcTax -
          (product.defaultPurchasePriceExcTax * product.discountPercent) /
            100) *
        product.quantity,
      profitMargin: product.profitMargin || 0,
      unitSellingPrice:
        ((product.defaultPurchasePriceExcTax * product.discountPercent) / 100) *
        (1 + product.profitMargin / 100),
    }));

    // Prepare transactions inside purchase order payload
    const transactions = [
      {
        paymentAccountId: paymentAccount, // Ensure correct PaymentAccount ID is passed
        paymentMethod: paymentMethod,
        amount: parseFloat(amount) || 0,
        transactionType: "purchase",
        addedBy: userName,
        note: note || "",
        date: formattedPaymentDate,
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

    // Prepare stock transactions
    const productStocks = selectedProducts.map((item) => ({
      productId: item.productId,
      variationId: item.productVariationId,
      quantity: item.quantity,
      transactionType: "po_purchase",
      date: new Date().toISOString().split("T")[0], // Current date
      note: "Stock updated after PO purchase",
    }));

    // Prepare payload
    const payload = {
      vendor,
      purchasePoOrderId: selectedOrderId?.value || "",
      referenceNumber: referenceNumber,
      purchaseReferenceNumber: purchaseReferenceNumber,
      status,
      orderedBy,
      addedBy: userName,
      orderDate,
      purchaseDate: formattedPurchaseDate,
      payTermNumber,
      payTermType,
      location,
      totalItems: totalUnits,
      netTotalAmount: finalPurchaseAmount,
      discountType,
      discountAmount: parseFloat(discountAmount) || 0,
      purchaseTax,
      taxAmount: parseFloat(taxAmount) || 0,
      additionalNotes,
      purchasePoItem: purchaseItems,
      shippingPoDetails: shippingAllDetails,
      stockTransactions: productStocks,
      transaction: transactions,
    };

    console.log("Payload:", payload);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-po-order/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert("Purchase PO Order Placed Successfully");
        navigate("/ListPoPurchaseOrder");
      } else {
        alert("Failed to save purchase order.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while saving the purchase order.");
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
                  <h1 className="all-heading">Add Po Purchase</h1>
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
                      {/* Order Id */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Order Id</label>
                            <div className="d-flex align-items-center">
                              <Select
                                id="orderId"
                                name="orderId"
                                options={orderId}
                                value={selectedOrderId}
                                onChange={(selected) => {
                                  setSelectedProducts([]);
                                  setSelectedOrderId(selected);
                                }}
                                placeholder="Please Select"
                                isSearchable
                                className="form-select"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reference No */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="purchaseReferenceNumber">
                            Reference No<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="purchaseReferenceNumber"
                            name="purchaseReferenceNumber"
                            placeholder="Enter here.."
                            value={purchaseReferenceNumber}
                            onChange={(e) =>
                              setPurchaseReferenceNumber(e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                      {/* Reference No */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="referenceNumber">
                            order Reference No
                            <span className="text-danger">*</span>
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
                          />
                        </div>
                      </div>

                      {/* Order Status */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">
                              Order Status
                            </label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2"
                                id="status"
                                name="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                required
                              >
                                <option value="">Please Select</option>
                                <option value="1">Ordered</option>
                                <option value="2">Pending</option>
                                <option value="3">Received</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order By */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="orderedBy">
                            Ordered By<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="orderedBy"
                            name="orderedBy"
                            value={orderedBy}
                            onChange={(e) => setOrderedBy(e.target.value)}
                            required
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
                            value={userName}
                            onChange={(e) => setAddedBy(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Order Date */}
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="orderDate">Order Date</label>
                          <DatePicker
                            selected={orderDate}
                            onChange={(date) => setOrderDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            maxDate={new Date()} // Disable future dates
                            popperPlacement="top" // Display the calendar above
                          />
                        </div>
                      </div>

                      {/* Purchase Date */}
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transaction_date">
                            Purchase Date
                          </label>
                          <DatePicker
                            selected={purchaseDate}
                            onChange={(date) => setPurchaseDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            popperPlacement="top" // Display the calendar above
                            maxDate={new Date()} // Disable future dates
                          />
                        </div>
                      </div>

                      {/* Pay Term */}
                      <div className="col-md-4">
                        <div className="form-group ">
                          <label htmlFor="pay_term_number">Pay term</label>
                          <div className="d-flex">
                            <input
                              className="form-control rounded-start-1 p-3"
                              placeholder="Pay term"
                              type="number"
                              id="pay_term_number"
                              value={payTermNumber}
                              onChange={(e) => setPayTermNumber(e.target.value)}
                            />
                            <select
                              className="form-select border rounded-start-0  rounded-end-1 p-1 "
                              value={payTermType}
                              onChange={(e) => setPayTermType(e.target.value)}
                            >
                              <option value="">Please Select</option>
                              <option value="Months">Months</option>
                              <option value="Days">Days</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="location">
                            Location<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="location"
                            name="location"
                            placeholder="Enter here.."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="document">Attach Document:</label>
                          <div className="form-control file-caption kv-fileinput-caption">
                            <div className="file-caption-name">
                              {"Sample Document: predefined_document.pdf"}
                            </div>
                          </div>
                          <p className="help-block">Max File size: 5MB</p>
                        </div>
                      </div> */}
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
                            />
                          </div>
                          <Link to="/AddProducts">
                            <i className="fas fa-plus"></i> Add New Product
                          </Link>
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
                                  <th>Profit Margin (%)</th>{" "}
                                  <th>Unit Selling Price (Inc. tax)</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  const unitCostBeforeDiscount =
                                    product.defaultPurchasePriceExcTax || 0;
                                  const unitCostAfterDiscount =
                                    unitCostBeforeDiscount *
                                    (1 - (product.discountPercent || 0) / 100);
                                  const lineTotal =
                                    unitCostAfterDiscount * product.quantity;
                                  const profitMargin =
                                    product.profitMargin || 0;
                                  const defaultSellingPrice =
                                    unitCostAfterDiscount *
                                    (1 + profitMargin / 100);

                                  return (
                                    <tr key={product.id}>
                                      <td>{index + 1}</td>
                                      <td>
                                        {product.productName} ({product.sku}) (
                                        {product.productVariationId})
                                        {product.name} {product.variationValue}
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          value={product.quantity}
                                          min="1"
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              product.id,
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
                                          value={product.discountPercent}
                                          min={0}
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
                                      <td>
                                        <input
                                          type="number"
                                          value={profitMargin}
                                          min={0}
                                          onChange={(e) =>
                                            handleProfitMarginChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>
                                      <td>{defaultSellingPrice.toFixed(2)}</td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-danger"
                                          onClick={() =>
                                            handleRemoveProduct(product.id)
                                          }
                                        >
                                          <i className="fa fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* Total Amount Calculation */}
                            <div>Total Amount: ₹{totalAmount}</div>

                            {/* Total Units Amount Calculation */}
                            <div>Total units : {totalUnits}</div>
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
                            <td className="col-md-3">
                              <div className="form-group">
                                <label htmlFor="discountType">
                                  Discount Type
                                </label>
                                <select
                                  className="form-control"
                                  id="discountType"
                                  name="discountType"
                                  value={discountType}
                                  onChange={handleDiscountTypeChange}
                                >
                                  <option value="">None</option>
                                  <option value="fixed">Fixed</option>
                                  <option value="percentage">Percentage</option>
                                </select>
                              </div>
                            </td>
                            <td className="col-md-3">
                              <div className="form-group">
                                <label htmlFor="discountAmount">
                                  {discountType === "percentage"
                                    ? "Discount Percentage (%)"
                                    : "Discount Amount"}
                                </label>
                                <input
                                  className="form-control"
                                  type="number"
                                  id="discountAmount"
                                  name="discountAmount"
                                  value={discountAmount}
                                  onChange={handleDiscountAmountChange}
                                  disabled={discountType === ""}
                                  placeholder={
                                    discountType === "percentage"
                                      ? "Enter percentage (e.g., 10)"
                                      : "Enter amount (e.g., 100)"
                                  }
                                />
                              </div>
                            </td>
                            <td className="col-md-3">
                              <b>Discount</b> (-)
                              <span className="display_currency">
                                {parseFloat(discountAmount || 0).toFixed(2)}
                              </span>
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <div className="form-group">
                                <label htmlFor="tax_id">Purchase Tax</label>
                                <select
                                  name="tax_id"
                                  id="tax_id"
                                  className="form-control select2"
                                  value={purchaseTax}
                                  onChange={handleTaxIdChange}
                                >
                                  <option value="" data-tax_amount="0">
                                    None
                                  </option>
                                  <option value="VAT@10%" data-tax_amount="10">
                                    VAT@10%
                                  </option>
                                  <option value="CGST@10%" data-tax_amount="10">
                                    CGST@10%
                                  </option>
                                  <option value="SGST@8%" data-tax_amount="8">
                                    SGST@8%
                                  </option>
                                  <option value="GST@18%" data-tax_amount="18">
                                    GST@18%
                                  </option>
                                </select>
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
                                {taxAmount
                                  ? parseFloat(taxAmount).toFixed(2)
                                  : "0.00"}
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
                                />
                              </div>
                            </td>
                          </tr>
                          {/* Total Purchase Amount 
                          <tr>
                            <b>Total Purchase Amount</b> (+)
                            <span
                              id="total_purchase_amount"
                              className="display_currency"
                            >
                              {totalAmountIncTaxAndDiscount
                                ? parseFloat(
                                    totalAmountIncTaxAndDiscount
                                  ).toFixed(2)
                                : "0.00"}
                            </span>
                          </tr>
                          
                          */}
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
                          />
                        </div>
                      </div>
                      <div className="col-md-12 text-center">
                        <button
                          type="button"
                          className="btn"
                          style={{ backgroundColor: "#0c4461", color: "white" }}
                          onClick={toggleVisibility}
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

                {/* ADD payment */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="">
                        <h3 className="">Add payment</h3>

                        <div className="">
                          <div className="">
                            <div className="py-2 ">
                              <div className="">
                                {/* <div className="row">
                                <div className="col-md-12">
                                  <strong>Advance Balance:</strong>{" "}
                                  <span id="">0</span>
                                  <input
                                    id="advanceBalance"
                                    data-error-msg="Required advance balance not available"
                                    name="advanceBalance"
                                    type="hidden"
                                  />
                                </div>
                              </div> */}
                                <div className="row">
                                  <input type="hidden" className="" value="0" />
                                  <div className="col-md-4">
                                    <div className="form-group">
                                      <label htmlFor="amount">Amount</label>
                                      <div className="input-group">
                                        <span className="input-group-text bg-transparent">
                                          <i className="fas fa-money-bill-alt"></i>
                                        </span>
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
                                      <label htmlFor="paidOn">Paid On</label>
                                      <div className="input-group">
                                        <span className="input-group-text bg-transparent">
                                          <i className="fa fa-calendar"></i>
                                        </span>
                                        <DatePicker
                                          className="form-control py-3"
                                          selected={paidOn} // Ensure `paidOn` is a Date object
                                          onChange={(date) => setPaidOn(date)} // Handle date selection
                                          dateFormat="dd MM yyyy" // Set desired format (day month year)
                                          placeholderText="Select paid on date" // Optional placeholder
                                          maxDate={new Date()} // Disable future dates
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-4">
                                    <div className="form-group">
                                      <label htmlFor="method">
                                        Payment Method
                                      </label>
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
                                          <option value="">
                                            Select Payment Method
                                          </option>
                                          {paymentMethods.map(
                                            (method, index) => (
                                              <option
                                                key={index}
                                                value={method}
                                              >
                                                {method}
                                              </option>
                                            )
                                          )}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-4">
                                    <div className="form-group">
                                      <label htmlFor="account">
                                        Payment Account
                                      </label>
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
                                  {/* Show Card Details if the payment method includes 'card' (case-insensitive) */}
                                  {paymentMethod
                                    .toLowerCase()
                                    .includes("card") && (
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
                                          <label htmlFor="cardMonth">
                                            Month
                                          </label>
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
                                  )}

                                  {/* Cheque Details */}
                                  {paymentMethod.includes("cheque") && (
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
                                  {paymentMethod.includes("bank") && (
                                    <div className="col-md-12">
                                      <div className="form-group">
                                        <label htmlFor="bankAccountNumber">
                                          Bank Account Number
                                        </label>
                                        <input
                                          className="form-control"
                                          id="bankAccountNumber"
                                          name="bankAccountNumber"
                                          placeholder="Bank Account Number"
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
                                      <label htmlFor="note">Payment Note</label>
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
                                <div className="row">
                                  <div className="col-sm-12">
                                    <div className="pull-right">
                                      <strong>Payment due:</strong>{" "}
                                      <span id="payment_due">0.00</span>
                                    </div>
                                  </div>
                                </div>
                                <br />
                              </div>
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

export default AddPoPurchase;
