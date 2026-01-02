import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";
import { toast } from "react-toastify";

function EditDISale() {
  const { id } = useParams();
  const [franchise, setFranchise] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(null);
  const [location, setLocation] = useState("");
  const [payTermNumber, setPayTermNumber] = useState("");
  const [payTermType, setPayTermType] = useState("");
  const [file, setFile] = useState(null);
  const [discountType, setDiscountType] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [customerId, setCustomerId] = useState("");

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
  const [franchiseDetails, setFranchiseDetails] = useState({
    name: "",
    address: "",
    mobile: "",
  });
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [customTransactionNo, setCustomTransactionNo] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState([]);

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

  const [taxRates, setTaxRates] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [subtotalAmount, setSubTotalAmount] = useState(0);
  const [taxOnSubtotal, setTaxOnsubtotal] = useState(0);

  const handleTaxRateChange = (productId, variationId, selectedOption) => {
    // If no tax selected, set both taxRate and taxRateId to 0 and null respectively
    const taxRateId = selectedOption ? selectedOption.value : null;
    const taxRate = selectedOption ? selectedOption.rate : 0; // Use rate for calculations

    // Update both the taxRate (for calculations) and taxRateId (for backend)
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId && product.variationId === variationId
          ? {
              ...product,
              taxRate, // Set tax rate for calculations
              taxRateId, // Set taxRateId for backend
              selectedTax: selectedOption || null, // Store the full tax option for display purposes
            }
          : product
      )
    );
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
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/sale-di-order/get/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase data");
        }

        const purchase = await response.json();

        // Setting state based on the fetched data
        setFranchise(purchase.franchise);
        setReferenceNumber(purchase.referenceNumber);
        setAddedBy(purchase.addedBy);
        setPurchaseDate(new Date(purchase.saleDate)); // Corrected field name
        setLocation(purchase.location);
        setCustomerId(purchase.customerId);

        axios
          .get(`${process.env.REACT_APP_BASE_URL}/customer/${customerId}`)
          .then((res) => {
            const customer = res.data;
            setFranchiseDetails({
              name: customer.franchiseName,
              mobile: customer.mobileNumber || "N/A",
              address: [
                customer.permanentAddress,
                customer.city,
                customer.state,
                customer.zipCode,
              ]
                .filter(Boolean)
                .join(", "),
            });
          })
          .catch((err) =>
            console.error("Error fetching customer details:", err)
          );
        setPayTermNumber(purchase.payTermNumber);
        setPayTermType(purchase.payTermType);
        setDiscountType(purchase.discountType);
        setDiscountAmount(purchase.discountAmount);

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

        setAdditionalNotes(purchase.additionalNotes);

        const selectedProducts = purchase.saleDIItem.map((item) => {
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
            variationName: item.productVariationName,
            taxRateId: matchedTaxOption ? matchedTaxOption.value : null,
            selectedTax: matchedTaxOption || null,
          };
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations({});
        setProductsData(purchase.saleDIItem);

        // Shipping Details
        if (
          purchase.shippingSaleDIDetails &&
          purchase.shippingSaleDIDetails.length > 0
        ) {
          const shippingDetail = purchase.shippingSaleDIDetails[0]; // Assuming there's only one shipping detail
          setShippingDetails(shippingDetail.shippingDetails);
          setShippingCharges(shippingDetail.shippingCharges);

          setAdditionalExpenses(
            shippingDetail.additionalExpensesName.map((name, index) => ({
              name,
              amount: shippingDetail.amount[index],
            }))
          );
        }

        // Payment details
        if (
          purchase.saleDIPaymentMethod &&
          purchase.saleDIPaymentMethod.length > 0
        ) {
          const paymentMethodName = purchase.saleDIPaymentMethod[0].methodName;
          const selectedMethod = Object.keys(paymentMethodEnum).find(
            (key) => paymentMethodEnum[key] === paymentMethodName
          );
          setPaymentMethod(selectedMethod); // set the correct method (e.g., 'card', 'cheque', etc.)
          setPaidOn(new Date(purchase.saleDIPaymentMethod[0].paidOn));
          setAmount(purchase.saleDIPaymentMethod[0].amount);
          setPaymentAccount(purchase.saleDIPaymentMethod[0].paymentAccount);
          setNote(purchase.saleDIPaymentMethod[0].paymentNote);

          setCardDetails({
            cardNumber: purchase.saleDIPaymentMethod[0].cardNumber,
            cardHolderName: purchase.saleDIPaymentMethod[0].cardHolderName,
            cardTransactionNumber:
              purchase.saleDIPaymentMethod[0].cardTransactionNumber,
            cardType: purchase.saleDIPaymentMethod[0].cardType,
            cardMonth: purchase.saleDIPaymentMethod[0].cardMonth || "",
            cardYear: purchase.saleDIPaymentMethod[0].cardYear || "",
            cardSecurity: purchase.saleDIPaymentMethod[0].cardSecurity || "",
          });
        }

        // Products data
        setProductsData(purchase.saleDIItem); // Corrected to use purchasePoItem, not purchaseItems
        setTotalUnits(purchase.totalItems);
        setFinalPurchaseAmount(purchase.lineTotal); // Assuming `lineTotal` is the correct field for final amount
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, [id, taxOptions]); // Add taxOptions to the dependency array

  // Function to calculate total additional expenses
  const calculateTotalAdditionalExpenses = () => {
    return additionalExpenses.reduce((total, expense) => {
      const expenseAmount = parseFloat(expense.amount) || 0; // Ensure it's a number
      return total + expenseAmount;
    }, 0);
  };

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
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/customer/getall`
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
        `${
          process.env.REACT_APP_BASE_URL
        }/product/search/active?query=${encodeURIComponent(query)}`
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

  // Handle additional notes change
  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };
  const handleSalePriceChange = (productId, variationId, newValue) => {
    const updatedProducts = selectedProducts.map((product) => {
      if (product.id === productId && product.variationId === variationId) {
        return {
          ...product,
          defaultPurchasePriceExcTax: newValue,
        };
      }
      return product;
    });
    setSelectedProducts(updatedProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Construct saleDIItem array
      const saleDIItem = selectedProducts.map((product) => ({
        id: product.id, // Include if updating existing items
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
        lineTotal: 0, // Optionally compute line total here
        taxRate: product.taxRateId,
        taxAmount: product.taxAmount,
        profitMargin: product.profitMargin,
        unitSellingPrice: 0, // Optional
      }));

      // Construct shipping details array
      const shippingSaleDIDetails = [
        {
          shippingDetails,
          shippingCharges,
          additionalExpensesName: additionalExpenses.map((exp) => exp.name),
          amount: additionalExpenses.map((exp) => exp.amount),
        },
      ];

      // Final payload object
      const saleData = {
        id, // Required for update
        franchise,
        referenceNumber,
        addedBy,
        saleDate: purchaseDate.toISOString().split("T")[0],
        customerId,
        payTermNumber,
        payTermType,
        location,
        totalItems: totalUnits,
        netTotalAmount: finalPurchaseAmount,
        discountType,
        discountAmount,
        purchaseTax,
        taxAmount,
        additionalNotes,
        saleDIItem,
        shippingSaleDIDetails,
        stockTransactions: [], // Optional: If needed, map stockTransactions here
      };

      // Make PUT request to update Sale DI Order
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/sale-di-order/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleData),
        }
      );

      if (response.ok) {
        toast.success("Sale DI Order updated successfully!");
      } else {
        // const error = await response.json();
        // console.error("Update failed:", error);
        toast.error("Failed to update Sale DI Order.");
      }
    } catch (error) {
      // console.error("Error updating Sale DI Order:", error);
      toast.error("An error occurred during update.");
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-12 d-flex align-items-center flex-wrap gap-2">
                  <h1 className="all-heading mb-0 me-3">Edit DI Sale</h1>
                  <span>
                    <strong>Franchise Name:</strong> {franchiseDetails.name}
                  </span>
                  <span>
                    <strong>Address:</strong> {franchiseDetails.address}
                  </span>
                  <span>
                    <strong>Mobile:</strong> {franchiseDetails.mobile}
                  </span>
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
                      {/* franchise  */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="referenceNumber">
                            Franchise <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="franchise"
                            name="franchise"
                            // placeholder="Enter here.."
                            value={franchise}
                            //  onChange={(e) => setReferenceNumber(e.target.value)}
                            required
                            readOnly
                          />
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
                          <label htmlFor="transaction_date">Sale Date</label>
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
                    </div>
                  </div>
                </div>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
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
                                  <th>Sale Price</th>
                                  <th>Discount Percent</th>
                                  <th>Unit Cost (After Discount)</th>
                                  <th>Sub Total</th>
                                  <th>Tax Rate</th>
                                  <th>Tax Amount</th>
                                  <th>Line Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  const unitCostBeforeDiscount =
                                    parseFloat(
                                      product.defaultPurchasePriceExcTax
                                    ) || 0;
                                  const discountPercent =
                                    parseFloat(product.discountPercent) || 0;
                                  const quantity =
                                    parseFloat(product.quantity) || 0;

                                  const unitCostAfterDiscount =
                                    unitCostBeforeDiscount *
                                    (1 - discountPercent / 100);
                                  const lineTotal =
                                    unitCostAfterDiscount * quantity;

                                  const taxRate = product.taxRate || 0;
                                  const taxAmount =
                                    (unitCostAfterDiscount *
                                      quantity *
                                      taxRate) /
                                    100;

                                  const unitSellingPriceIncTax = (
                                    unitCostAfterDiscount *
                                    (1 + taxRate / 100)
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
                                          // readOnly
                                          style={{
                                            width: "80px",
                                            padding: "5px",
                                            textAlign: "center",
                                          }}
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
                                        <input
                                          type="number"
                                          value={unitCostBeforeDiscount}
                                          style={{
                                            width: "80px",
                                            padding: "5px",
                                            textAlign: "center",
                                          }}
                                          onChange={(e) =>
                                            handleSalePriceChange(
                                              product.id,
                                              product.variationId,
                                              e.target.value
                                            )
                                          }
                                          //  readOnly
                                        />
                                      </td>

                                      <td>
                                        <input
                                          type="number"
                                          style={{
                                            width: "80px",
                                            padding: "5px",
                                            textAlign: "center",
                                          }}
                                          value={discountPercent}
                                          onChange={(e) =>
                                            handleDiscountChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                          //  readOnly
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
                                              (option) =>
                                                option.value ==
                                                product.taxRateId
                                            ) || taxOptions[0]
                                          }
                                          onChange={(selected) =>
                                            handleTaxRateChange(
                                              product.id,
                                              product.variationId,
                                              selected
                                            )
                                          }
                                          placeholder="Select Tax"
                                          isSearchable
                                          //isDisabled={true}
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
                                        {(lineTotal + taxAmount).toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>

                            {/* Total Amount Calculation */}
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
                                  // disabled
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
                                  // readOnly
                                  onChange={handleDiscountAmountChange}
                                  id="discount_amount"
                                  disabled={discountType === ""}
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
                                {discountType === "Percentage" &&
                                discountAmount &&
                                subtotalAmount
                                  ? (
                                      (parseFloat(discountAmount) / 100) *
                                      parseFloat(subtotalAmount)
                                    ).toFixed(2)
                                  : discountAmount
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
                                  <label>Sale Tax</label>
                                  <Select
                                    options={taxOptions}
                                    value={
                                      taxOptions.find(
                                        (opt) => opt.value === purchaseTax
                                      ) || taxOptions[0] // Default to "None"
                                    }
                                    onChange={handleTaxIdChange}
                                    isClearable={true}
                                    // isDisabled={true}
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
                                  // readOnly
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
                            //  readOnly
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
                            // readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-12 text-center">
                        <button
                          type="button"
                          className="btn"
                          style={{ backgroundColor: "#0c4461", color: "white" }}
                          onClick={toggleVisibility}
                          //  disabled
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

                      <label>Sale Total:{finalPurchaseAmount}</label>
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

export default EditDISale;
