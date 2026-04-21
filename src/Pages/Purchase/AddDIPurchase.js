import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/dist/css/adminlte.min.css";
import BackButton from "../../components/BackButton";
import useBarcodeScanner from "../../hooks/useBarcodeScanner";
import playProductAddedBeep from "../../utils/playProductAddedBeep";


function AddDIPurchase() {
  const navigate = useNavigate();
  const searchResultsRef = useRef(null);
  const inFlightBarcodeRequests = useRef(new Set());

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [location, setLocation] = useState("");
  const [payTermNumber, setPayTermNumber] = useState("");
  const [payTermType, setPayTermType] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [purchaseTax, setPurchaseTax] = useState("");
  const [tempTax, setTempTax] = useState("");

  const [taxAmount, setTaxAmount] = useState("0");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isVisible, setIsVisible] = useState(false);
  const [shippingDetails, setShippingDetails] = useState("");
  const [shippingCharges, setShippingCharges] = useState("");
  const [additionalExpenses, setAdditionalExpenses] = useState(
    Array(4).fill({ name: "", amount: "0" })
  );

  const [showDropdown, setShowDropdown] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState(""); // for vendor search

  const [chequeNumber, setChequeNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [customTransactionNo, setCustomTransactionNo] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
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
  const [taxRates, setTaxRates] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [subtotalAmount, setSubTotalAmount] = useState(0);
  const [taxOnSubtotal, setTaxOnsubtotal] = useState(0);

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
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setFile(null);
      setErrorMessage("No file selected.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeMB = 5;
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setFile(null);
      setErrorMessage("File size exceeds 5MB.");
      return;
    }

    // Optional: You can add custom validations by file type here
    setFile(selectedFile);
    setErrorMessage("");
  };

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

  // Handle tax selection change
  const handleTaxIdChange = (selectedOption) => {
    if (selectedOption === null || selectedOption.value === "") {
      // If the user selects "None", reset the tax
      setPurchaseTax(""); // Reset to "None"
      setTaxAmount(0); // Reset tax amount to 0
    } else {
      const selectedTaxId = selectedOption.value;
      const selectedTaxRate = selectedOption.rate;

      // Update the state with the selected tax details
      setPurchaseTax(selectedTaxId); // Set the selected tax ID
      setTaxAmount(selectedTaxRate); // Set the tax amount (rate)
    }
  };

  useEffect(() => {
    // Fetch tax rates
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
    // console.log(taxOptions);
  }, [taxRates]);

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

      const productTaxRate = parseFloat(product.taxRate) || 0;
      const taxAmountPerProduct =
        (unitCostAfterDiscount * quantity * productTaxRate) / 100;

      const profitMargin = parseFloat(product.profitMargin) || 0;
      const profitAmount =
        unitCostAfterDiscount * quantity * (profitMargin / 100);

      subtotal += lineTotal + taxAmountPerProduct + profitAmount;
      totalUnits += quantity;
    });

    setSubTotalAmount(subtotal.toFixed(2));
    // console.log("Subtotal before discount:", subtotal);

    // Total Discount Calculation
    let totalDiscount = 0;
    const discountValue = parseFloat(discountAmount) || 0;

    if (discountType === "Fixed") {
      totalDiscount = Math.min(discountValue, subtotal);
    } else if (discountType === "Percentage") {
      totalDiscount = (subtotal * discountValue) / 100;
    }

    //console.log("Total Discount:", totalDiscount);

    // ✅ Use taxAmount from state directly
    const globalTaxRate = parseFloat(taxAmount) || 0;
    const taxAmountOnSubtotal =
      ((subtotal - totalDiscount) * globalTaxRate) / 100;
    setTaxOnsubtotal(taxAmountOnSubtotal.toFixed(2));

    // Final Amount
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

    // console.log("Final Amount:", finalAmount);
    setFinalPurchaseAmount(finalAmount.toFixed(2));
  }, [
    selectedProducts,
    discountType,
    discountAmount,
    taxAmount, // ✅ using taxAmount instead of purchaseTax
    shippingCharges,
    additionalExpenses,
  ]);

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
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/vendor/getallactive`
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
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) await searchProducts(value);
    else setSearchResults([]);
    setFocusedIndex(-1);
  };

  const searchProducts = async (query) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL
        }/product/search/active?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm) {
      if (focusedIndex >= 0) {
        e.preventDefault();
        handleProductSelect(searchResults[focusedIndex]);
        setSearchResults([]);
        setSearchTerm("");
      } else {
        searchProducts(searchTerm);
      }
    } else if (searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        scrollToFocusedItem();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        scrollToFocusedItem();
      }
    }
  };

  const scrollToFocusedItem = () => {
    if (searchResultsRef.current && focusedIndex >= 0) {
      const items = searchResultsRef.current.querySelectorAll(".product-row");
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  };

  const handleProductSelect = (product) => {
    if (product.productVariations.length > 0) {
      const allVariationsSelected = product.productVariations.every(
        (variation) => selectedVariations[variation.id]
      );

      const newSelectedVariations = { ...selectedVariations };

      product.productVariations.forEach((variation) => {
        newSelectedVariations[variation.id] = !allVariationsSelected;
      });

      setSelectedVariations(newSelectedVariations);
      updateSelectedProducts(product, newSelectedVariations);
    } else {
      const isSelected = selectedVariations[product.id];
      const newSelectedVariations = {
        ...selectedVariations,
        [product.id]: !isSelected,
      };
      setSelectedVariations(newSelectedVariations);
      updateSelectedProducts(product, newSelectedVariations);
    }
  };

  const handleVariationSelect = (product, variation, e) => {
    e.stopPropagation();
    const newSelectedVariations = {
      ...selectedVariations,
      [variation.id]: !selectedVariations[variation.id],
    };
    setSelectedVariations(newSelectedVariations);
    updateSelectedProducts(product, newSelectedVariations);
  };

  const addOrIncrementScannedProduct = (product, scannedBarcode) => {
    setSelectedProducts((prev) => {
      let matchedVariation = null;
      if (product.productVariations && product.productVariations.length > 0) {
        if (scannedBarcode) {
          matchedVariation = product.productVariations.find(
            (v) =>
              (v.subSku && v.subSku.toLowerCase() === scannedBarcode.toLowerCase()) ||
              (product.barcode && product.barcode.toLowerCase() === scannedBarcode.toLowerCase())
          );
        }
        if (!matchedVariation) {
          matchedVariation = product.productVariations[0];
        }
      }

      // Find matching item (variation or product)
      const existingIndex = prev.findIndex(
        (p) =>
          (p.productId === product.id || p.id === product.id) &&
          (!matchedVariation || p.productVariationId === matchedVariation.id || p.variationId === matchedVariation.id)
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: (next[existingIndex].quantity || 0) + 1,
        };
        return next;
      }

      // Handle variable products
      if (matchedVariation) {
        const variation = matchedVariation;
        return [
          ...prev,
          {
            id: product.id,
            productId: product.id,
            productName: product.productName,
            sku: product.sku || variation.subSku || "",
            variationId: variation.id,
            variationValue: variation.variationValue,
            variationName: variation.variationValue,
            productVariationId: variation.id,
            defaultPurchasePriceExcTax: variation.defaultPurchasePriceExcTax || variation.defaultSellingPrice || product.price || 0,
            quantity: 1,
            discountPercent: 0,
            profitMargin: variation.profitMargin || product.profitMargin || 0,
            taxRate: 0,
            taxAmount: 0,
            selectedTax: null,
            taxRateId: null,
          },
        ];
      }

      // Handle single products
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          productName: product.productName,
          sku: product.sku || "",
          quantity: 1,
          discountPercent: 0,
          defaultPurchasePriceExcTax: product.defaultPurchasePriceExcTax || product.price || 0,
          profitMargin: product.profitMargin || 0,
          taxRate: 0,
          taxAmount: 0,
          selectedTax: null,
          taxRateId: null,
        },
      ];
    });
  };

  const handleBarcodeScan = async (barcode) => {
    if (inFlightBarcodeRequests.current.has(barcode)) {
      return;
    }

    inFlightBarcodeRequests.current.add(barcode);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/products/barcode/${encodeURIComponent(
          barcode
        )}`
      );

      if (!response.ok) {
        toast.warning("Product not found");
        return;
      }

      const product = await response.json();
      addOrIncrementScannedProduct(product, barcode);
      playProductAddedBeep();
      toast.success(`Scanned: ${product.productName || barcode}`);
    } catch (error) {
      console.error("Error scanning barcode:", error);
      toast.error("Unable to scan product right now");
    } finally {
      inFlightBarcodeRequests.current.delete(barcode);
    }
  };

  useBarcodeScanner(handleBarcodeScan, {
    allowManualInputEnter: false, 
  });

  const updateSelectedProducts = (product, variations) => {

    if (product.productVariations.length > 0) {
      const selectedVars = product.productVariations.filter(
        (variation) => variations[variation.id]
      );

      setSelectedProducts((prev) =>
        prev.filter((p) => p.id !== product.id || !p.variationId)
      );

      if (selectedVars.length > 0) {
        const newProducts = selectedVars.map((variation) => ({
          id: product.id,
          productName: product.productName,
          sku: product.sku,
          variationId: variation.id,
          variationValue: variation.variationValue,
          quantity: 1,
          discountPercent: 0,
          taxRate: 0,
          taxAmount: 0,
          productId: product.id,
          productVariationId: variation.id,
          variationName: variation.variationValue,
          defaultPurchasePriceExcTax: variation.defaultPurchasePriceExcTax || 0,
          profitMargin: variation.profitMargin || 0,
          selectedTax: null,
          taxRateId: null,
        }));
        setSelectedProducts((prev) => [...prev, ...newProducts]);
      }
    } else {
      if (variations[product.id]) {
        if (
          !selectedProducts.some((p) => p.id === product.id && !p.variationId)
        ) {
          setSelectedProducts((prev) => [
            ...prev,
            {
              ...product,
              quantity: 1,
              discountPercent: 0,
              taxRate: 0,
              taxAmount: 0,
              productId: product.id,
              productVariationId: null,
              variationName: null,
              defaultPurchasePriceExcTax:
                product.defaultPurchasePriceExcTax || 0,
              profitMargin: product.profitMargin || 0,
              selectedTax: null,
              taxRateId: null,
            },
          ]);
        }
      } else {
        setSelectedProducts((prev) =>
          prev.filter((p) => !(p.id === product.id && !p.variationId))
        );
      }
    }
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
  const handleSalePriceChange = (productId, variationId, newValue) => {
    const updatedProducts = selectedProducts.map((product) => {
      if (product.id === productId && product.variationId === variationId) {
        return {
          ...product,
          defaultSellingPrice: newValue,
        };
      }
      return product;
    });
    setSelectedProducts(updatedProducts);
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

  const handleRemoveProduct = (productId, variationId) => {
    setSelectedProducts((prev) =>
      prev.filter(
        (product) =>
          !(product.id === productId && product.variationId === variationId)
      )
    );
    if (variationId) {
      setSelectedVariations((prev) => ({ ...prev, [variationId]: false }));
    } else {
      setSelectedVariations((prev) => ({ ...prev, [productId]: false }));
    }
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
    e.preventDefault();

    const formattedPurchaseDate = purchaseDate
      ? purchaseDate.toISOString().split("T")[0]
      : null;

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

    const purchaseItems = selectedProducts.map((product) => {
      const unitCostBeforeDiscount =
        parseFloat(product.defaultPurchasePriceExcTax) || 0;
      const discountPercent = parseFloat(product.discountPercent) || 0;

      const unitCostAfterDiscount =
        unitCostBeforeDiscount * (1 - discountPercent / 100);

      const lineTotal = unitCostAfterDiscount * product.quantity;

      const taxRate = parseFloat(product.taxRateId) || 0;
      const taxAmount = (lineTotal * taxRate) / 100;

      const profitMargin = parseFloat(product.profitMargin) || 0;
      const profitAmount =
        unitCostAfterDiscount * product.quantity * (profitMargin / 100);

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
        unitCostBeforeDiscount,
        discountPercent,
        unitCostAfterDiscount,
        lineTotal,
        taxRate: product.taxRateId,
        taxAmount,
        profitMargin,
        unitSellingPrice: unitSellingPriceIncTax,
      };
    });

    const productStocks = purchaseItems.map((item) => ({
      productId: item.productId,
      variationId: item.productVariationId || null,
      price: parseFloat(item.unitSellingPrice), // ✅ CORRECT VALUE
      quantity: parseFloat(item.quantity) || 0,
      transactionType: "di_purchase",
      date: new Date().toISOString().split("T")[0],
      note: "Stock updated after DI purchase",
    }));
    const payload = {
      vendor,
      referenceNumber,
      status: 1,
      addedBy: userName,
      orderDate: formattedPurchaseDate,
      payTermNumber: 0,
      payTermType: payTermType || null,
      location: location || null,
      totalItems: parseInt(totalUnits) || 0,
      netTotalAmount: parseFloat(finalPurchaseAmount) || 0,
      discountType,
      discountAmount: parseFloat(discountAmount) || 0,
      purchaseTax: parseInt(purchaseTax) || 0,
      taxAmount: parseFloat(taxOnSubtotal) || 0,
      additionalNotes,
      purchaseDIItem: purchaseItems,
      shippingDIDetails: shippingAllDetails,
      stockTransactions: productStocks,
    };

    try {
      const formData = new FormData();
      formData.append("purchaseDIOrder", JSON.stringify(payload)); // ✅ send JSON as string
      if (file) formData.append("file", file); // ✅ optional file

      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/purchase-di-order/save`,
        formData, // ✅ send as multipart/form-data
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const stockResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-transactions/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productStocks),
        }
      );

      if (!stockResponse.ok) {
        toast.error("DI saved, but stock update failed.");
        return;
      }

      toast.success("Purchase DI Order Placed Successfully!");
      navigate("/ListDIPurchaseOrder");
    } catch (error) {
      //console.error("Error Response:", error.response);
      toast.error("Order Failed To Place");
    }
  };

  // Filter the vendor list based on search
  const filteredVendors = vendorlist.filter((v) =>
    `${v.firmName} ${v.mobileNumber} ${v.city}`
      .toLowerCase()
      .includes(vendorSearchTerm.toLowerCase())
  );

  const handleSelect = (v) => {
    setVendor(v.firmName);
    setVendorSearchTerm(`${v.firmName} - ${v.mobileNumber} - ${v.city}`);
    setShowDropdown(false);
  };
  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6 d-flex align-items-center">
                  <BackButton />
                  <h1 className="all-heading">Add DI Purchase</h1>
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
                        <div className="form-group position-relative">
                          <label>
                            Vendor<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Select Vendor"
                            value={vendorSearchTerm}
                            onChange={(e) => {
                              setVendorSearchTerm(e.target.value);
                              setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            required
                          />
                          {showDropdown && (
                            <ul
                              className="list-group position-absolute w-100"
                              style={{
                                zIndex: 1000,
                                maxHeight: "200px",
                                overflowY: "auto",
                              }}
                            >
                              {filteredVendors.length === 0 && (
                                <li className="list-group-item">No results</li>
                              )}
                              {filteredVendors.map((v) => (
                                <li
                                  key={v.id}
                                  className="list-group-item list-group-item-action"
                                  onClick={() => handleSelect(v)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {v.firmName} - {v.mobileNumber} - {v.city}
                                </li>
                              ))}
                            </ul>
                          )}
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
                                  <div className="file-preview-status text-center text-success">
                                    File ready to upload
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

                            <div className="input-group">
                              <div className="form-control file-caption kv-fileinput-caption">
                                <div className="file-caption-name">
                                  {file ? file.name : "No file selected"}
                                </div>
                              </div>
                              <div className="input-group-append">
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
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <small className="form-text text-muted">
                            Max File size: 5MB <br />
                            Supported types: Images, PDF, Word, Excel, CSV, Text
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="form-group">
                      <label>Search Products</label>
                      <div className="search-container">
                        <input
                          type="text"
                          className=" w-100 form-control search-input w-100"
                          placeholder="Search by name, SKU or scan barcode"
                          value={searchTerm}
                          onChange={handleSearch}
                          onKeyDown={handleKeyPress}
                          autoComplete="off"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            className="clear-search"
                            onClick={() => {
                              setSearchTerm("");
                              setSearchResults([]);
                            }}
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {searchTerm && searchResults.length > 0 && (
                      <div className="search-results" ref={searchResultsRef}>
                        {searchResults.map((product, index) => (
                          <div
                            key={product.id}
                            className={`product-row ${focusedIndex === index ? "focused" : ""
                              } ${(
                                product.productVariations.length > 0
                                  ? product.productVariations.some(
                                    (v) => selectedVariations[v.id]
                                  )
                                  : selectedVariations[product.id]
                              )
                                ? "selected"
                                : ""
                              }`}
                            onClick={() => handleProductSelect(product)}
                          >
                            <div className="product-content flex justify-between items-start gap-4">
                              <div className="row d-flex justify-content-between">
                                {/* Product Info */}
                                <div className="col-8 product-info">
                                  <div className="product-main-info">
                                    <span className="product-name">
                                      {product.productName}
                                    </span>
                                    <span className="product-sku">
                                      {product.sku}
                                    </span>
                                    {/* <span
                                      className={`stock ${
                                        product.stock > 0
                                          ? "in-stock"
                                          : "out-of-stock"
                                      }`}
                                    >
                                      {product.stock > 0
                                        ? `Stock: ${product.stock}`
                                        : "Out of stock"}
                                    </span> */}
                                    <span className="product-type">
                                      {product.productType}
                                    </span>
                                  </div>
                                </div>

                                {/* Product Variations (only if VARIABLE) */}
                                {product.productType === "VARIABLE" && (
                                  <div className=" col-4 product-variations flex flex-wrap gap-2">
                                    {product.productVariations.map(
                                      (variation) => (
                                        <div
                                          key={variation.id}
                                          className={`variation-item py-0 border rounded px-2 ${selectedVariations[variation.id]
                                            ? "selected"
                                            : ""
                                            }`}
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevents parent onClick
                                            handleVariationSelect(
                                              product,
                                              variation,
                                              e
                                            );
                                          }}
                                        >
                                          <span>
                                            {variation.variationValue}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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
                                (unitCostAfterDiscount * quantity * taxRate) /
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
                                      type=""
                                      value={product.quantity}
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
                                      type=""
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
                                    />
                                  </td>
                                  <td>{unitCostAfterDiscount.toFixed(2)}</td>
                                  <td>{lineTotal.toFixed(2)}</td>
                                  <td style={{ width: "200px" }}>
                                    <Select
                                      options={taxOptions}
                                      value={
                                        product.selectedTax || taxOptions[0]
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
                                      styles={{
                                        control: (provided) => ({
                                          ...provided,
                                          width: "100%",
                                        }),
                                      }}
                                    />
                                  </td>
                                  <td>{taxAmount.toFixed(2)}</td>
                                  <td>{(lineTotal + taxAmount).toFixed(2)}</td>
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
                                  <label>Purchase Tax</label>
                                  <Select
                                    options={taxOptions}
                                    value={
                                      taxOptions.find(
                                        (opt) => opt.value === purchaseTax
                                      ) || taxOptions[0] // Default to "None"
                                    }
                                    onChange={handleTaxIdChange}
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
                            className={`fas ${isVisible ? "fa-chevron-up" : "fa-chevron-down"
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

export default AddDIPurchase;
