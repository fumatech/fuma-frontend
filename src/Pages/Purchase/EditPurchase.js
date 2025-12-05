import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles

function EditPurchase() {
  const { id } = useParams();
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [purchaseDate, setPurchaseDate] = useState();
  const [location, setLocation] = useState("");
  const [payTermNumber, setPayTermNumber] = useState("");
  const [payTermType, setPayTermType] = useState("");
  const [file, setFile] = useState(null);
  const [discountType, setDiscountType] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState("");
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

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchase/get/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase data");
        }

        const purchase = await response.json();

        // Setting state based on the fetched data
        setVendor(purchase.vendor);
        setReferenceNumber(purchase.referenceNumber);
        setStatus(purchase.status);
        setAddedBy(purchase.addedBy);
        setPurchaseDate(new Date(purchase.purchaseDate));
        setLocation(purchase.location);
        setPayTermNumber(purchase.payTermNumber);
        setPayTermType(purchase.payTermType);
        setDiscountType(purchase.discountType);
        setDiscountAmount(purchase.discountAmount);
        setPurchaseTax(purchase.purchaseTax);
        setTaxAmount(purchase.taxAmount);
        setAdditionalNotes(purchase.additionalNotes);

        // Pre-select products and variations
        const selectedProducts = purchase.purchaseItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.productSku,
          quantity: item.quantity,
          defaultPurchasePriceExcTax: item.unitCostBeforeDiscount,
          discountPercent: item.discountPercent,
          profitMargin: item.profitMargin,
          productVariationId: item.productVariationId,
          variationName: item.productVariationName,
        }));

        const selectedVariations = {};
        purchase.purchaseItems.forEach((item) => {
          selectedVariations[item.productVariationId] = true;
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations(selectedVariations);

        setShippingDetails(purchase.shippingDetails.shippingDetails);
        setShippingCharges(purchase.shippingDetails.shippingCharges);
        setAdditionalExpenses(
          purchase.shippingDetails.additionalExpensesName.map(
            (name, index) => ({
              name,
              amount: purchase.shippingDetails.amount[index],
            })
          )
        );

        // Set payment details based on payment method
        const paymentMethodName = purchase.purchasePaymentMethod.methodName;
        const selectedMethod = Object.keys(paymentMethodEnum).find(
          (key) => paymentMethodEnum[key] === paymentMethodName
        );
        setPaymentMethod(selectedMethod); // set the correct method (e.g., 'card', 'cheque', etc.)

        setPaidOn(new Date(purchase.purchasePaymentMethod.paidOn));
        setAmount(purchase.purchasePaymentMethod.amount);
        setPaymentAccount(purchase.purchasePaymentMethod.paymentAccount);
        setNote(purchase.purchasePaymentMethod.paymentNote);
        setCardDetails({
          cardNumber: purchase.purchasePaymentMethod.cardNumber,
          cardHolderName: purchase.purchasePaymentMethod.cardHolderName,
          cardTransactionNumber:
            purchase.purchasePaymentMethod.cardTransactionNumber,
          cardType: purchase.purchasePaymentMethod.cardType,
          cardMonth: purchase.purchasePaymentMethod.cardMonth || "",
          cardYear: purchase.purchasePaymentMethod.cardYear || "",
          cardSecurity: purchase.purchasePaymentMethod.cardSecurity || "",
        });

        // Products data
        setProductsData(purchase.purchaseItems);
        setTotalUnits(purchase.totalItems);
        setFinalPurchaseAmount(purchase.netTotalAmount);
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, [id]);

  // Function to calculate total additional expenses
  const calculateTotalAdditionalExpenses = () => {
    return additionalExpenses.reduce((total, expense) => {
      const expenseAmount = parseFloat(expense.amount) || 0; // Ensure it's a number
      return total + expenseAmount;
    }, 0);
  };

  useEffect(() => {
    // Calculate total amount before discount and tax
    const totalAmountBeforeDiscount = selectedProducts.reduce(
      (total, product) => {
        const unitCostBeforeDiscount =
          parseFloat(product.defaultPurchasePriceExcTax) || 0;
        return total + unitCostBeforeDiscount * product.quantity;
      },
      0
    );

    // Calculate discount
    let totalDiscount = 0;
    const discountValue = parseFloat(discountAmount) || 0; // Ensure valid discountAmount

    if (discountType === "fixed") {
      totalDiscount = discountValue; // Fixed discount
    } else if (discountType === "percentage") {
      totalDiscount = (totalAmountBeforeDiscount * discountValue) / 100; // Percentage discount
    }

    // Subtract discount from total amount before discount
    const totalAmountAfterDiscount = totalAmountBeforeDiscount - totalDiscount;

    // Calculate tax based on selected tax type
    let taxRate = 0;
    if (purchaseTax === "VAT@10%" || purchaseTax === "CGST@10%") {
      taxRate = 10;
    } else if (purchaseTax === "SGST@8%") {
      taxRate = 8;
    } else if (purchaseTax === "GST@18%") {
      taxRate = 18;
    }

    // Calculate tax amount on the discounted total
    const taxAmount = (totalAmountAfterDiscount * taxRate) / 100;

    // Final total amount after applying discount and adding tax
    const finalTotalAmount = totalAmountAfterDiscount + taxAmount;

    // Calculate total units (sum of quantities)
    const totalUnits = selectedProducts.reduce(
      (total, product) => total + product.quantity,
      0
    );

    // Calculate total additional expenses
    const totalAdditionalExpenses = calculateTotalAdditionalExpenses();

    // Ensure shippingCharges is a number
    const parsedShippingCharges = parseFloat(shippingCharges) || 0;

    // Calculate final purchase amount
    const updatedFinalPurchaseAmount =
      finalTotalAmount + parsedShippingCharges + totalAdditionalExpenses;

    // Update state only if necessary to avoid unnecessary re-renders
    setTotalAmount((prevAmount) => {
      const newAmount = totalAmountBeforeDiscount.toFixed(2);
      return prevAmount !== newAmount ? newAmount : prevAmount;
    });

    setDiscountAmount((prevDiscount) => {
      const newDiscount = totalDiscount.toFixed(2);
      return prevDiscount !== newDiscount ? newDiscount : prevDiscount;
    });

    setTaxAmount((prevTax) => {
      const newTax = taxAmount.toFixed(2);
      return prevTax !== newTax ? newTax : prevTax;
    });

    setTotalAmountIncTaxAndDiscount((prevTotal) => {
      const newFinalTotal = finalTotalAmount.toFixed(2);
      return prevTotal !== newFinalTotal ? newFinalTotal : prevTotal;
    });

    setTotalUnits((prevUnits) => {
      return prevUnits !== totalUnits ? totalUnits : prevUnits;
    });

    // Ensure updatedFinalPurchaseAmount is a number before using toFixed
    if (typeof updatedFinalPurchaseAmount === "number") {
      setFinalPurchaseAmount((prevPurchaseAmount) => {
        const newPurchaseAmount = updatedFinalPurchaseAmount.toFixed(2);
        return prevPurchaseAmount !== newPurchaseAmount
          ? newPurchaseAmount
          : prevPurchaseAmount;
      });
    }
  }, [
    selectedProducts,
    discountType,
    discountAmount,
    purchaseTax,
    shippingCharges,
    additionalExpenses,
  ]);

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

  useEffect(() => {
    // Calculate total amount
    const calculatedTotalAmount = selectedProducts
      .reduce((total, product) => {
        const unitCostBeforeDiscount = product.defaultPurchasePriceExcTax || 0;
        const unitCostAfterDiscount =
          unitCostBeforeDiscount * (1 - (product.discountPercent || 0) / 100);
        const defaultSellingPrice =
          unitCostAfterDiscount * (1 + (product.profitMargin || 0) / 100);
        return total + product.quantity * defaultSellingPrice;
      }, 0)
      .toFixed(2);

    // Calculate total units (sum of quantities only)
    const calculatedTotalUnits = selectedProducts.reduce((total, product) => {
      return total + product.quantity;
    }, 0);

    // Update state with calculated values
    setTotalAmount(calculatedTotalAmount);
    setTotalUnits(calculatedTotalUnits); // Set the total units amount
  }, [selectedProducts]);

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

    const shippingAllDetails = {
      id: shippingDetails.id, // Include the existing ID for shipping
      shippingDetails: shippingDetails,
      shippingCharges: parseFloat(shippingCharges) || 0,
      additionalExpensesName: additionalExpenses.map((expense) => expense.name),
      amount: additionalExpenses.map(
        (expense) => parseFloat(expense.amount) || 0
      ),
    };

    const purchaseItems = selectedProducts.map((product) => ({
      productId: product.id,
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
        (product.defaultPurchasePriceExcTax -
          (product.defaultPurchasePriceExcTax * product.discountPercent) /
            100) *
        (1 + product.profitMargin / 100),
    }));

    const payload = {
      id: id, // Include purchase ID
      vendor,
      status: 0,
      referenceNumber,
      status,
      addedBy,
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
      purchasePaymentMethod: {
        id: paymentMethod.id, // Include payment method ID
        methodName: paymentMethodEnum[paymentMethod.toLowerCase()] || "UNKNOWN",
        paidOn: formattedPaymentDate,
        amount: parseFloat(amount) || 0,
        paymentAccount: paymentAccount || null,
        paymentNote: note || null,
        chequeNumber: chequeNumber || null,
        bankAccountNumber: bankAccountNumber || null,
        cardType: cardDetails.cardType || null,
        cardNumber: cardDetails.cardNumber || null,
        cardHolderName: cardDetails.cardHolderName || null,
        cardExpiryDate: cardDetails.cardExpiryDate,
        cardSecurity: cardDetails.cardSecurity,
      },
      shippingDetails: shippingAllDetails,
      purchaseItems,
    };

    // console.log("Payload:", payload); // Debug the payload

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase/update/${id}`,
        {
          method: "PUT", // Change method to PUT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        // console.log("Purchase updated successfully");
        // Optionally reset form or navigate to another page
      } else {
        const errorText = await response.text();
        console.error("Error updating purchase:", errorText);
      }
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
                <div className="col-sm-6">
                  <h1 className="all-heading">View Purchase</h1>
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
                                read-only
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
                          />
                        </div>
                      </div>

                      {/* Purchase Status */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">
                              Purchase Status
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
                                <option value="Received">Received</option>
                                <option value="Pending">Pending</option>
                                <option value="Ordered">Ordered</option>
                              </select>
                            </div>
                          </div>
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
                            minDate={new Date()} // Prevent past dates
                            popperPlacement="top" // Display the calendar above
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
                                  {product.stock}
                                </span>
                                {product.productVariations.length > 0 && (
                                  <div className="variations">
                                    <ul>
                                      {product.productVariations.map(
                                        (variation) => (
                                          <li
                                            key={variation.id}
                                            className="listhover"
                                          >
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={
                                                  selectedVariations[
                                                    variation.id
                                                  ] || false
                                                } // Pre-select variations
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
                                        {product.productName} ({product.sku}){" "}
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
                                >
                                  <option value="">None</option>
                                  <option value="fixed">Fixed</option>
                                  <option value="percentage">Percentage</option>
                                </select>
                              </div>
                            </td>

                            {/* Discount Amount Input */}
                            <td className="col-md-3">
                              <div className="form-group">
                                <label htmlFor="discount_amount">
                                  {discountType === "percentage"
                                    ? "Discount Percentage (%)"
                                    : "Discount Amount"}
                                </label>

                                {/* Conditionally render the input field */}
                                <input
                                  className="form-control input_number"
                                  required
                                  name="discount_amount"
                                  type="text" // Ensure numeric input for better accuracy
                                  value={discountAmount}
                                  onChange={handleDiscountAmountChange}
                                  id="discount_amount"
                                  disabled={discountType === ""} // Disable if no discount type is selected
                                  placeholder={
                                    discountType === "percentage"
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
                            {/* Purchase Tax Dropdown */}
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
                                          onChange={handleMethodChange}
                                        >
                                          <option value="advance">
                                            Advance
                                          </option>
                                          <option value="cash">Cash</option>
                                          <option value="card">Card</option>
                                          <option value="cheque">Cheque</option>
                                          <option value="t">
                                            Bank Transfer
                                          </option>
                                          <option value="other">Other</option>
                                          <option value="custom_pay_1">
                                            Custom Payment 1
                                          </option>
                                          <option value="custom_pay_2">
                                            Custom Payment 2
                                          </option>
                                          <option value="custom_pay_3">
                                            Custom Payment 3
                                          </option>
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
                                          </span>{" "}
                                        </div>
                                        <select
                                          className="form-control"
                                          id="account"
                                          name="account_id"
                                          value={paymentAccount}
                                          onChange={(e) =>
                                            setPaymentAccount(e.target.value)
                                          }
                                        >
                                          <option value="">None</option>
                                          <option value="FUMA">FUMA</option>
                                          {/* Options can be dynamically added here */}
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Details */}
                                  {paymentMethod === "card" && (
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
                                            Card holder name
                                          </label>
                                          <input
                                            className="form-control"
                                            id="cardHolderName"
                                            name="cardHolderName"
                                            placeholder="Card holder name"
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
                                  {paymentMethod === "t" && (
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

export default EditPurchase;
