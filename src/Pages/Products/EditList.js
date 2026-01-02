import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useParams
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import axios from "axios";
import Select from "react-select";
import { toast } from "react-toastify";

function EditList() {
  const { productId } = useParams(); // Get productId from URL params
  const navigate = useNavigate(); // For navigation
  const formRef = useRef(null);
  const [taxes, setTaxes] = useState([]);
  const [taxRate, setTaxRate] = useState();
  // State variables
  const [file, setFile] = useState(null); // Handle file uploads
  const [errorMessage, setErrorMessage] = useState(""); // Handle error messages
  const [searchTerm, setSearchTerm] = useState(""); // Search term for filtering
  const [totalAmount, setTotalAmount] = useState(0); // Total price calculation
  const [products, setProducts] = useState([]); // List of products
  const [comboProducts, setComboProducts] = useState([]); // Define comboProducts state
  const [netTotalAmount, setNetTotalAmount] = useState(0); // Total price calculation
  const [searchResults, setSearchResults] = useState([]);
  // Product Details
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [businessLocations, setBusinessLocations] = useState([]);
  const [businessLocation, setBusinessLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [applicableTax, setApplicableTax] = useState("");
  const [sellingPriceTaxType, setSellingPriceTaxType] = useState("");
  const [productType, setProductType] = useState("");
  const [defaultPurchasePrice, setDefaultPurchasePrice] = useState(0);
  const [defaultPurchasePriceIncTax, setDefaultPurchasePriceIncTax] =
    useState("");
  const [defaultPurchasePriceExcTax, setDefaultPurchasePriceExcTax] =
    useState("");
  const [defaultSellingPrice, setDefaultSellingPrice] = useState(0); // Initialize as a number
  const [subSku, setSubSku] = useState("");
  const [profitMargin, setProfitMargin] = useState();

  const [productImage, setProductImage] = useState(null);
  const [productVariantImage, setProductVariantImage] = useState([]);
  const [singleExistingImage, setSingleExistingImage] = useState([]);
  // Dropdown options
  const [brands, setBrands] = useState([]); // Initialized as an array
  const [units, setUnits] = useState([]); // Initialized as an array
  const [categories, setCategories] = useState([]); // Initialized as an array
  const [variationValues, setVariationValues] = useState([]); // Initialized as an array
  const [variations, setVariations] = useState([]);
  const [existingImage, setExistingImage] = useState(null); // Store existing image for edit
  const [productVariationId, setProductVariationId] = useState();
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => {
        // Remove duplicate business names
        const uniqueNamesMap = new Map();

        res.data.forEach((item) => {
          if (!uniqueNamesMap.has(item.name)) {
            uniqueNamesMap.set(item.name, {
              value: item.name,
              label: item.name,
            });
          }
        });

        setBusinessLocations(Array.from(uniqueNamesMap.values()));
      })
      .catch((err) => {
        console.error("Error fetching business locations", err);
      });
  }, []);
  useEffect(() => {
    fetchTaxes(); // Load taxes first
  }, []);

  const fetchTaxes = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/tax/getall`
      );
      setTaxes(response.data);
    } catch (error) {
      console.error("Error fetching taxes:", error.message);
    }
  };
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product data");
        }

        const product = await response.json();

        setProductName(product.productName);
        setSku(product.sku);
        setBarcode(product.barcode);
        setUnit(product.unit);
        setBrand(product.brand);
        setCategory(product.category);
        const selectedLocation = businessLocations.find(
          (loc) => loc.value === product.businessLocation
        );

        setBusinessLocation(selectedLocation || null);
        setDescription(product.description);

        const productTax = taxes.find((t) => t.id == product.applicableTax);

        setApplicableTax(product.applicableTax);
        setTaxRate(productTax ? productTax.taxValue / 100 : 0);
        setSellingPriceTaxType(product.sellingPriceTaxType);
        setProductType(product.productType);

        // Set existing image URL
        const imageUrl = `${process.env.REACT_APP_BASE_URL}${product.productImage}`;
        setExistingImage(imageUrl);
        setProductImage(imageUrl); // Set productImage to existing image

        if (
          product.productType === "SINGLE" &&
          product.productVariations.length > 0
        ) {
          const variation = product.productVariations[0];
          setProductVariationId(variation.id);
          setDefaultPurchasePriceExcTax(variation.defaultPurchasePriceExcTax);
          setDefaultPurchasePriceIncTax(variation.defaultPurchasePriceIncTax);
          setDefaultSellingPrice(variation.defaultSellingPrice);
          setProfitMargin(variation.margin);

          // Set variation image (if available)
          const variationImageUrl = `${process.env.REACT_APP_BASE_URL}${variation.variationProductImages}`;
          setSingleExistingImage(variationImageUrl);
          setProductVariantImage([]); // Clear variant image initially (until a new one is selected)
        } else if (
          product.productType === "COMBO" &&
          product.productVariations.length > 0
        ) {
          const variation = product.productVariations[0];
          setProductVariationId(variation.id);
          setDefaultSellingPrice(variation.defaultSellingPrice);
          setDefaultPurchasePriceExcTax(variation.defaultPurchasePriceExcTax);
          setProfitMargin(variation.margin);

          const comboVariations = JSON.parse(variation.comboVariations);
          setProducts(
            comboVariations.map((v) => ({
              productVariationId: v.productVariationId,
              productName: v.productName,
              quantity: v.quantity,
              defaultPurchasePriceExcTax: v.defaultPurchasePriceExcTax,
              defaultPurchasePriceIncTax: v.defaultPurchasePriceIncTax,
              defaultSellingPrice: v.defaultSellingPrice,
            }))
          );
        } else {
          setDefaultPurchasePrice(null);
          setDefaultSellingPrice(null);
          setProfitMargin(null);
        }

        if (
          product.productType === "VARIABLE" &&
          product.productVariations.length > 0
        ) {
          const variationsMap = {}; // Map to hold variations by name

          product.productVariations.forEach((variation) => {
            const variationName = variation.variationName;

            // Check if the variation name already exists in the map
            if (!variationsMap[variationName]) {
              // Initialize the variation entry if it doesn't exist
              variationsMap[variationName] = {
                name: variationName,
                selectedValues: [variation.variationValue],
                rows: [
                  {
                    productVariationId: variation.id,
                    subSku: variation.subSku,
                    value: variation.variationValue,
                    defaultPurchasePriceExcTax:
                      variation.defaultPurchasePriceExcTax,
                    defaultPurchasePriceIncTax:
                      variation.defaultPurchasePriceIncTax,
                    defaultSellingPrice: variation.defaultSellingPrice,
                    profitMargin: variation.margin,
                    variationProductImages: `${process.env.REACT_APP_BASE_URL}${variation.variationProductImages}`,
                  },
                ],
              };
            } else {
              // If the variation name already exists, check for duplicate values
              const existingRow = variationsMap[variationName].rows.find(
                (row) => row.value === variation.variationValue
              );
              if (!existingRow) {
                variationsMap[variationName].rows.push({
                  productVariationId: variation.id,
                  subSku: variation.subSku,
                  value: variation.variationValue,
                  defaultPurchasePriceExcTax:
                    variation.defaultPurchasePriceExcTax,
                  defaultPurchasePriceIncTax:
                    variation.defaultPurchasePriceIncTax,
                  defaultSellingPrice: variation.defaultSellingPrice,
                  profitMargin: variation.margin,
                  variationProductImages: `${process.env.REACT_APP_BASE_URL}${variation.variationProductImages}`,
                });
              }
            }
          });

          // Convert the variations map back to an array
          const variationsArray = Object.values(variationsMap);
          setVariations(variationsArray);
        } else {
          setVariations([]); // Reset variations if not VARIABLE or no variations
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        setErrorMessage("Failed to load product data.");
      }
    };

    fetchProductData();
  }, [productId, businessLocations]);

  const calculateIncTaxFromExc = (excTaxPrice, taxId = applicableTax) => {
    const tax = taxes.find((t) => t.id == taxId);
    const taxRate = tax ? tax.taxValue / 100 : 0;
    return excTaxPrice * (1 + taxRate);
  };

  const calculateExcTaxFromInc = (incTaxPrice, taxId = applicableTax) => {
    const tax = taxes.find((t) => t.id == taxId);
    const taxRate = tax ? tax.taxValue / 100 : 0;
    return incTaxPrice / (1 + taxRate);
  };

  // Function to calculate Default Selling Price based on tax type, Exc. Tax/Inc. Tax, and profit margin
  const calculateDefaultSellingPrice = () => {
    const excTaxPrice = parseFloat(defaultPurchasePriceExcTax) || 0;
    const incTaxPrice = parseFloat(defaultPurchasePriceIncTax) || 0;
    const profitMarginValue = parseFloat(profitMargin) || 0;
    let sellingPrice = 0;

    if (sellingPriceTaxType === "Exclusive") {
      // For Exclusive tax, calculate selling price from excTaxPrice
      sellingPrice = excTaxPrice * (1 + profitMarginValue / 100);
    } else if (sellingPriceTaxType === "Inclusive") {
      // For Inclusive tax, calculate selling price from incTaxPrice
      sellingPrice = incTaxPrice * (1 + profitMarginValue / 100);
    }

    return sellingPrice.toFixed(2); // Returns the price rounded to 2 decimal places
  };

  // Update the selling price whenever the tax type, exc. tax, inc. tax, or profit margin changes
  useEffect(() => {
    const newSellingPrice = calculateDefaultSellingPrice();
    setDefaultSellingPrice(newSellingPrice);
  }, [
    sellingPriceTaxType,
    defaultPurchasePriceExcTax,
    defaultPurchasePriceIncTax,
    profitMargin,
  ]);
  // Handle tax selection change
  const handleApplicableTaxChange = (selectedTaxId) => {
    const selectedTax = taxes.find((tax) => tax.id == selectedTaxId);
    setApplicableTax(selectedTaxId);

    // Store both ID and rate for calculations
    setTaxRate(selectedTax ? selectedTax.taxValue / 100 : 0);
    recalculatePrices(selectedTaxId);
  };
  // Extract tax percentage from applicableTax
  const getTaxRate = (tax) => {
    if (!tax) {
      return 0; // Return 0 if tax is undefined or an empty string
    }

    const taxMatch = tax.match(/\d+%/); // Matches percentage like "10%"
    if (taxMatch) {
      return parseFloat(taxMatch[0]) / 100; // Convert "10%" to 0.10
    }
    return 0; // Return 0 if no match is found
  };
  // Helper function to get tax rate by ID
  const getTaxRateById = (taxId) => {
    const tax = taxes.find((t) => t.id == taxId); // Use loose equality for string/number comparison
    return tax ? tax.taxValue / 100 : 0; // Convert percentage to decimal
  };
  // Recalculate prices when tax or other factors change
  const recalculatePrices = (selectedTaxId) => {
    const tax = taxes.find((t) => t.id == selectedTaxId);
    const taxRate = tax ? tax.taxValue / 100 : 0;

    const excTaxPrice = parseFloat(defaultPurchasePriceExcTax) || 0;
    const newIncTaxPrice = excTaxPrice * (1 + taxRate);
    setDefaultPurchasePriceIncTax(newIncTaxPrice.toFixed(2));

    const profitMarginValue = parseFloat(profitMargin) || 0;
    let sellingPrice = 0;

    if (sellingPriceTaxType === "Exclusive") {
      sellingPrice = excTaxPrice * (1 + profitMarginValue / 100);
    } else if (sellingPriceTaxType === "Inclusive") {
      sellingPrice = newIncTaxPrice * (1 + profitMarginValue / 100);
    }

    setDefaultSellingPrice(sellingPrice.toFixed(2));
  };

  useEffect(() => {
    recalculatePrices(applicableTax); // Recalculate prices whenever tax, purchase price, or tax type changes
  }, [
    applicableTax,
    defaultPurchasePriceExcTax,
    sellingPriceTaxType,
    profitMargin,
  ]);

  // Handler when Exc. Tax is typed
  const handleExcTaxChange = (e) => {
    const excTax = parseFloat(e.target.value) || 0;
    setDefaultPurchasePriceExcTax(excTax);

    // Automatically calculate the Inc. Tax when the Exc. Tax changes
    const newIncTax = calculateIncTaxFromExc(excTax);
    setDefaultPurchasePriceIncTax(newIncTax.toFixed(2)); // Set the calculated Inc. Tax
  };

  // Handler when Inc. Tax is typed
  const handleIncTaxChange = (e) => {
    const incTax = parseFloat(e.target.value) || 0;
    setDefaultPurchasePriceIncTax(incTax);

    // Automatically calculate the Exc. Tax when the Inc. Tax changes
    const newExcTax = calculateExcTaxFromInc(incTax);
    setDefaultPurchasePriceExcTax(newExcTax.toFixed(2)); // Set the calculated Exc. Tax
  };

  // Function to calculate Default Selling Price based on tax type, Exc. Tax/Inc. Tax, and profit margin for a specific row
  const calculateDefaultSellingPriceForRow = (row) => {
    const excTaxPrice = parseFloat(row.defaultPurchasePriceExcTax) || 0;
    const incTaxPrice = parseFloat(row.defaultPurchasePriceIncTax) || 0;
    const profitMarginValue = parseFloat(row.profitMargin) || 0;
    let sellingPrice = 0;

    if (sellingPriceTaxType === "Exclusive") {
      sellingPrice = excTaxPrice * (1 + profitMarginValue / 100);
    } else if (sellingPriceTaxType === "Inclusive") {
      sellingPrice = incTaxPrice * (1 + profitMarginValue / 100);
    }

    return sellingPrice.toFixed(2);
  };

  // Function to recalculate prices for each variation row
  const recalculatePricesForVariationRows = () => {
    // Ensure variations is defined and is an array
    if (!Array.isArray(variations)) {
      return; // Exit early if variations is not an array
    }

    const updatedVariations = variations.map((variation) => {
      // Ensure rows is defined and is an array
      const updatedRows = Array.isArray(variation.rows)
        ? variation.rows.map((row) => {
            const excTaxPrice = parseFloat(row.defaultPurchasePriceExcTax) || 0;

            // Calculate Inc. Tax based on Exc. Tax and applicable tax rate
            const newIncTaxPrice = calculateIncTaxFromExc(excTaxPrice);
            row.defaultPurchasePriceIncTax = newIncTaxPrice.toFixed(2);

            // Calculate Default Selling Price for the current row
            row.defaultSellingPrice = calculateDefaultSellingPriceForRow(row);

            return row;
          })
        : []; // Fallback to an empty array if rows are not defined

      return { ...variation, rows: updatedRows };
    });

    setVariations(updatedVariations); // Update the state with recalculated prices
  };

  // Use Effect to recalculate whenever sellingPriceTaxType, applicableTax, or variations change
  useEffect(() => {
    if (Array.isArray(variations) && variations.length > 0) {
      recalculatePricesForVariationRows();
    }
  }, [sellingPriceTaxType, applicableTax, variations]);

  // Handler when Exc. Tax is typed for a specific row
  const handleExcTaxChangeForRow = (e, index, rowIndex) => {
    const excTax = parseFloat(e.target.value) || 0;
    const updatedVariations = [...variations];

    if (
      updatedVariations[index] &&
      updatedVariations[index].rows &&
      updatedVariations[index].rows[rowIndex]
    ) {
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceExcTax =
        excTax;

      // Automatically calculate the Inc. Tax when the Exc. Tax changes
      const newIncTax = calculateIncTaxFromExc(excTax);
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceIncTax =
        newIncTax.toFixed(2);

      // Recalculate the default selling price
      updatedVariations[index].rows[rowIndex].defaultSellingPrice =
        calculateDefaultSellingPriceForRow(
          updatedVariations[index].rows[rowIndex]
        );

      setVariations(updatedVariations);
    }
  };

  const handleIncTaxChangeForRow = (e, index, rowIndex) => {
    const incTax = parseFloat(e.target.value) || 0;
    const updatedVariations = [...variations];

    if (
      updatedVariations[index] &&
      updatedVariations[index].rows &&
      updatedVariations[index].rows[rowIndex]
    ) {
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceIncTax =
        incTax;

      // Automatically calculate the Exc. Tax when the Inc. Tax changes
      const newExcTax = calculateExcTaxFromInc(incTax);
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceExcTax =
        newExcTax.toFixed(2);

      // Recalculate the default selling price
      updatedVariations[index].rows[rowIndex].defaultSellingPrice =
        calculateDefaultSellingPriceForRow(
          updatedVariations[index].rows[rowIndex]
        );

      setVariations(updatedVariations);
    }
  };

  // Function to handle adding a new variation
  const addVariation = () => {
    const newVariationName = ""; // default empty variation name
    const existingVariation = variations.find(
      (v) => v.name === newVariationName
    );

    if (existingVariation) {
      addRow(existingVariation.id);
    } else {
      setVariations((prevVariations) => [
        ...prevVariations,
        {
          name: newVariationName,
          selectedValues: [],
          rows: [],
        },
      ]);
    }
  };

  // Function to handle changes in variation name or selected values
  const handleVariationChange = (e, index, fieldName) => {
    const { value } = e.target;
    setVariations((prevVariations) => {
      const updatedVariations = [...prevVariations];
      updatedVariations[index][fieldName] = value;

      // Reset selected values and rows when variation changes
      if (fieldName === "name") {
        updatedVariations[index].selectedValues = [];
        updatedVariations[index].rows = [];
      }
      return updatedVariations;
    });
  };

  // Function to handle image change for a specific row
  const handleVariationImageChange = (e, index, rowIndex) => {
    const selectedFile = e.target.files[0];

    // Validate selected file size
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.warning("Max file size: 5MB");
      return;
    }

    setVariations((prevVariations) => {
      const updatedVariations = prevVariations.map((variation, varIndex) => {
        if (varIndex === index) {
          const updatedRows = variation.rows.map((row, rIndex) => {
            if (rIndex === rowIndex) {
              return {
                ...row,
                variationProductImages: selectedFile, // Save the file object here
              };
            }
            return row;
          });
          return {
            ...variation,
            rows: updatedRows,
          };
        }
        return variation;
      });
      return updatedVariations;
    });
  };

  // Function to handle changes in specific row fields, including image uploads
  const handleRowChange = (e, index, rowIndex, field) => {
    const value =
      field === "variationProductImages" ? e.target.files[0] : e.target.value;

    setVariations((prevVariations) => {
      const updatedVariations = [...prevVariations];
      updatedVariations[index].rows[rowIndex][field] = value;
      return updatedVariations;
    });
  };

  // Function to add a row to a specific variation
  const addRow = (variationIndex) => {
    setVariations((prevVariations) => {
      const updatedVariations = [...prevVariations];
      updatedVariations[variationIndex].rows.push({
        productVariationId: "", // Ensure correct ID is used
        subSku: "",
        value: "",
        defaultPurchasePriceExcTax: "",
        defaultPurchasePriceIncTax: "",
        profitMargin: "",
        defaultSellingPrice: "",
        variationProductImages: "", // Initialize image field
      });
      return updatedVariations;
    });
  };

  // Function to remove a specific row
  const removeRow = (variationIndex, rowIndex) => {
    setVariations((prevVariations) => {
      const updatedVariations = [...prevVariations];
      updatedVariations[variationIndex].rows.splice(rowIndex, 1);
      return updatedVariations;
    });
  };

  // Function to remove a variation
  const removeVariation = (index) => {
    setVariations((prevVariations) =>
      prevVariations.filter((_, i) => i !== index)
    );
  };

  const addRowForSelectedValues = (index, selectedValues) => {
    const updatedVariations = [...variations];

    // Ensure rows array is initialized
    if (!updatedVariations[index].rows) {
      updatedVariations[index].rows = [];
    }

    selectedValues.forEach((value) => {
      const existingRow = updatedVariations[index].rows.find(
        (row) => row.value === value
      );
      // Create a new row if it doesn't exist
      if (!existingRow) {
        updatedVariations[index].rows.push({
          productVariationId: "",
          subSku: "",
          value, // Set the variation value here
          defaultPurchasePriceExctax: "",
          defaultPurchasePriceIncTax: "",
          profitMargin: "",
          defaultSellingPrice: "",
          variationProductImages: "", // Initialize image field
        });
      }
    });

    setVariations(updatedVariations);
  };

  const calculateTotalAmount = (defaultPurchasePriceExcTax, quantity) => {
    if (isNaN(defaultPurchasePriceExcTax) || isNaN(quantity)) return 0;
    return (defaultPurchasePriceExcTax * quantity).toFixed(2);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const searchProducts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/search?query=${searchTerm}`
      );
      const data = await response.json();
      setSearchResults(data); // Set the search results
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Function to add a product row for combo products only
  const addProductRow = (product) => {
    let updatedProducts = [...products];

    product.productVariations.forEach((variation) => {
      const purchasePrice = parseFloat(variation.defaultPurchasePriceExcTax);

      updatedProducts.push({
        ...product,
        quantity: 1,
        productVariationId: variation.id,
        defaultPurchasePriceExcTax: !isNaN(purchasePrice) ? purchasePrice : 0.0,
        defaultPurchasePriceIncTax: variation.defaultPurchasePriceIncTax,
        defaultSellingPrice: variation.defaultSellingPrice,
      });
    });

    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
  };

  // Function to update quantity of a product
  const updateQuantity = (index, value) => {
    const updatedProducts = [...products];
    updatedProducts[index].quantity = Number(value); // Ensure value is a number
    setProducts(updatedProducts); // Update the products state
    calculateTotals(updatedProducts); // Recalculate totals when quantity is updated
  };

  const calculateTotals = (updatedProducts = products) => {
    const totalAmount = updatedProducts.reduce((acc, product) => {
      const productTotal =
        product.defaultSellingPrice && !isNaN(product.defaultSellingPrice)
          ? product.defaultSellingPrice * (product.quantity || 0)
          : 0;
      return acc + productTotal;
    }, 0);

    setNetTotalAmount(totalAmount);

    const sellingPrice =
      !isNaN(totalAmount) && totalAmount > 0 && !isNaN(profitMargin)
        ? totalAmount * (1 + profitMargin / 100)
        : 0;

    setDefaultSellingPrice(sellingPrice);
  };

  const handleProfitMarginChange = (e) => {
    const margin = parseFloat(e.target.value);
    setProfitMargin(isNaN(margin) ? 0 : margin); // Ensure it's a number
    calculateTotals(products); // Recalculate totals with updated margin
  };

  const removeProductRow = (index, event) => {
    event.preventDefault(); // Prevent the default form submission
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts); // Update the products state
    calculateTotals(updatedProducts); // Recalculate totals after removing a product
  };

  {
    /*Combo product functions end */
  }

  useEffect(() => {
    const purchasePrice = parseFloat(defaultPurchasePrice);
    const margin = parseFloat(profitMargin);

    if (!isNaN(purchasePrice) && !isNaN(margin)) {
      // Calculate the selling price based on purchase price and profit margin
      const sellingPrice = purchasePrice + purchasePrice * (margin / 100);
      setDefaultSellingPrice(sellingPrice.toFixed(2)); // Format to 2 decimal places
    } else {
      setDefaultSellingPrice(""); // Reset if inputs are invalid
    }
  }, [defaultPurchasePrice, profitMargin]);

  const flattenCategories = (categories, parentName = "", seen = new Set()) => {
    return categories.flatMap((cat) => {
      const categoryName = parentName
        ? `${parentName}/${cat.categoryName}`
        : cat.categoryName;
      if (seen.has(cat.id)) return [];
      seen.add(cat.id);

      const result = [
        {
          id: cat.id,
          categoryName,
          categoryCode: cat.categoryCode,
          description: cat.description,
          parentCategory: parentName || "None",
        },
      ];

      if (cat.subCategories) {
        result.push(
          ...flattenCategories(cat.subCategories, categoryName, seen)
        );
      }

      return result;
    });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMessage("Max file size is 5MB");
        return;
      }
      setFile(selectedFile);
      setProductImage(URL.createObjectURL(selectedFile)); // Update productImage for preview
      setErrorMessage(""); // Clear any previous error messages
    } else {
      setFile(null); // Reset file if no file is selected
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/brands/getall`
      );
      setBrands(response.data);
    } catch (error) {
      console.error("Error fetching brands:", error.message);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/units/getall`
      );
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error.message);
    }
  };

  const fetchVariations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/variations/getall`
      );
      setVariationValues(response.data);
    } catch (error) {
      console.error("Error fetching variations:", error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/categories/getall`
      );
      const flattened = flattenCategories(response.data);
      setCategories(flattened);
    } catch (error) {
      console.error("Error fetching categories:", error.message);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchUnits();
    fetchVariations();
    fetchCategories();
    fetchTaxes();
  }, []);

  useEffect(() => {
    calculateTotals(products);
  }, [products]);

  // Handle single product image change
  const handleSingleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      setProductVariantImage(files); // Set the selected files as an array
    } else {
      setProductVariantImage([singleExistingImage]); // If no new image, use the existing one
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const formData = new FormData(); // Create FormData for file uploads

    // Prepare the product object as JSON
    const productObject = {
      productName,
      sku,
      barcode,
      unit,
      brand,
      status: 1,
      category,
      businessLocation: businessLocation?.value || "",
      description,
      applicableTax,
      sellingPriceTaxType,
      productType,
      productVariations: [],
    };

    // Handle SINGLE product type
    if (productType === "SINGLE") {
      productObject.productVariations.push({
        id: productVariationId,
        defaultPurchasePriceExcTax,
        defaultPurchasePriceIncTax,
        defaultSellingPrice,
        margin: profitMargin,
      });
    }
    // Handle VARIABLE product type
    else if (productType === "VARIABLE") {
      variations.forEach((variation) => {
        variation.rows.forEach((row) => {
          productObject.productVariations.push({
            id: row.productVariationId, // Use row.productVariationId if defined, otherwise fall back to variation.id
            variationName: variation.name,
            subSku: row.subSku || "",
            variationValue: row.value || "",
            defaultPurchasePriceExcTax: row.defaultPurchasePriceExcTax || 0,
            defaultPurchasePriceIncTax: row.defaultPurchasePriceIncTax || 0,
            defaultSellingPrice: row.defaultSellingPrice || 0,
            margin: row.profitMargin || 0,
          });
        });
      });
    }
    // Handle COMBO product type
    else if (productType === "COMBO") {
      const comboVariations = products.map((product) => ({
        productVariationId: product.productVariationId,
        productName: product.productName,
        defaultPurchasePriceExcTax: product.defaultPurchasePriceExcTax,
        defaultPurchasePriceIncTax: product.defaultPurchasePriceIncTax,
        defaultSellingPrice: product.defaultSellingPrice,
        quantity: product.quantity,
      }));

      // Calculate selling price based on total purchase price and profit margin
      const totalPurchasePrice = products.reduce((acc, product) => {
        return acc + product.defaultSellingPrice * product.quantity;
      }, 0);

      const calculatedSellingPrice =
        totalPurchasePrice > 0 && !isNaN(profitMargin)
          ? (totalPurchasePrice * (1 + profitMargin / 100)).toFixed(2)
          : "0.00";

      productObject.productVariations.push({
        comboVariations: JSON.stringify(comboVariations), // Serialize to JSON
        id: productVariationId,
        defaultPurchasePriceExcTax: totalPurchasePrice.toFixed(2),
        defaultSellingPrice: calculatedSellingPrice,
        margin: profitMargin,
      });
    }

    // Append the product object to FormData
    formData.append("product", JSON.stringify(productObject));

    // Append new file or existing image
    if (file) {
      formData.append("productImage", file); // Append new image
    } else {
      formData.append("productImage", existingImage); // Use existing image if no new file is selected
    }

    // Append variation images (if changed)
    if (productVariantImage && productVariantImage.length > 0) {
      productVariantImage.forEach((image) => {
        if (typeof image === "object") {
          formData.append("variationImages", image); // Append new image file
        } else if (typeof image === "string") {
          formData.append("variationImages", image); // Append existing image URL
        }
      });
    }

    // Loop through each variation and its rows
    variations.forEach((variation) => {
      variation.rows.forEach((row) => {
        // Get the image from the current row (this could be a File object or null)
        const image = row.variationProductImages;

        // Check if image is present; if yes, append the image, else append null
        if (image) {
          formData.append("variationImages", image); // Append the image to FormData
        } else {
          formData.append("variationImages", null); // Explicitly append null if image is not present
        }
      });
    });

    // Submit formData (e.g., via axios or fetch)

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BASE_URL}/product/update/${productId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Product Updated Successfully!");

      // Optionally reset the form
      resetForm();
      navigate("/ListProducts"); // Redirect to the List Products page
    } catch (error) {
      toast.error("Failed To Update Product");
      // console.error("Error updating product:", error);
    }
  };

  // Function to reset the form fields
  const resetForm = () => {
    setProductName("");
    setSku("");
    setBarcode("");
    setUnit("");
    setBrand("");
    setCategory("");
    setBusinessLocation("");
    setDescription("");
    setApplicableTax("");
    setSellingPriceTaxType("");
    setProductType("");
    setDefaultPurchasePrice("");
    setDefaultSellingPrice("");
    setProfitMargin("");
    setVariations([]);
    setFile("");
    setProducts([]);
    if (formRef.current) {
      formRef.current.reset(); // Reset the form reference if available
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
                  <h1>Edit Products</h1>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid">
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      {/* Product Name */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="productName">
                            Product Name<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="productName"
                            name="productName"
                            placeholder="Enter here.."
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* SKU */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="sku">
                            SKU<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="sku"
                            name="sku"
                            placeholder="Enter here..."
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Barcode */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Barcode</label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2 "
                                id="barcode"
                                name="barcode"
                                type="text"
                                required
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                <option value="C128">Code 128 (C128)</option>
                                <option value="C39">Code 39 (C39)</option>
                                <option value="EAN-13">EAN-13</option>
                                <option value="EAN-8">EAN-8</option>
                                <option value="UPC-A">UPC-A</option>
                                <option value="UPC-E">UPC-E</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Unit */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Unit</label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2"
                                id="unit"
                                name="unit"
                                required
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                {units.map((unit) => (
                                  <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                  </option>
                                ))}
                              </select>
                              <span className="">
                                <button
                                  type="button"
                                  className="btn btn-light border"
                                  data-bs-toggle="modal"
                                  data-bs-target="#addUnitModal"
                                  title="Add Unit"
                                >
                                  <i className="fa fa-plus-circle text-primary fa-lg"></i>
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brand */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Brand</label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2"
                                id="brand"
                                name="brand"
                                required
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                {brands.map((brand) => (
                                  <option key={brand.id} value={brand.id}>
                                    {brand.brandName}
                                  </option>
                                ))}
                              </select>
                              <span className="">
                                <button
                                  type="button"
                                  className="btn btn-light border"
                                  data-bs-toggle="modal"
                                  data-bs-target="#addBrandModal"
                                  title="Add brand"
                                >
                                  <i className="fa fa-plus-circle text-primary fa-lg"></i>
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Category */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Category</label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2"
                                id="category"
                                name="category"
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                {categories.length > 0 ? (
                                  categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.categoryName}
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>
                                    No categories available
                                  </option>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Business Location */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>
                            Business Location{" "}
                            <span className="text-danger">*</span>
                          </label>

                          <Select
                            options={businessLocations}
                            value={businessLocation}
                            onChange={(selected) =>
                              setBusinessLocation(selected)
                            }
                            placeholder="Select business location..."
                            isSearchable
                            isClearable
                          />
                        </div>
                      </div>

                      {/* Product image */}
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label htmlFor="image">Product Image:</label>
                          <div className="file-input file-input-new">
                            <div className="file-preview">
                              {/* Display existing image if available */}
                              {existingImage && !file && (
                                <div className="existing-image-preview mb-2">
                                  <img
                                    src={existingImage} // Ensure this is the URL to the existing image
                                    alt="Existing Product"
                                    className="img-fluid"
                                    style={{
                                      maxHeight: "200px",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                              )}

                              {/* Display newly selected image preview */}
                              {file && (
                                <div className="new-image-preview mb-2">
                                  <img
                                    src={URL.createObjectURL(file)} // Create URL for the new file
                                    alt="Selected Product"
                                    className="img-fluid"
                                    style={{
                                      maxHeight: "200px",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <div className="text-muted">{file.name}</div>
                                </div>
                              )}

                              {/* Error message display */}
                              {errorMessage && (
                                <div className="file-preview-status text-center text-danger">
                                  {errorMessage}
                                </div>
                              )}
                            </div>

                            <div className="input-group">
                              <div className="form-control file-caption kv-fileinput-caption">
                                <div className="file-caption-name">
                                  {file
                                    ? file.name
                                    : existingImage
                                    ? existingImage.split("/").pop()
                                    : "No file selected"}
                                </div>
                              </div>
                              <div className="input-group-append">
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

                      {/* Description */}
                      <div className="col-md-8">
                        <div className="form-group">
                          <label htmlFor="description">Description</label>
                          <textarea
                            className="form-control rounded"
                            id="description"
                            name="description"
                            type="text"
                            rows="4"
                            placeholder="Enter product description here.."
                            value={description}
                            onChange={handleDescriptionChange}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="wrapper pt-5">
                  <div className="">
                    <div className="container-fluid">
                      <div className="card card-default rounded-4 border-0 cardHover">
                        <div className="card-body">
                          <div className="row">
                            {/* Applicable Tax */}
                            <div className="col-md-4">
                              <div className="dropdown">
                                <div className="">
                                  <label className="me-2 d-md-inline">
                                    Applicable Tax
                                  </label>
                                  <div className="d-flex align-items-center">
                                    <select
                                      className="form-select me-2"
                                      id="application"
                                      name="application"
                                      required
                                      value={applicableTax}
                                      onChange={(e) =>
                                        handleApplicableTaxChange(
                                          e.target.value
                                        )
                                      }
                                    >
                                      <option value="">None</option>
                                      {taxes.map((tax) => (
                                        <option key={tax.id} value={tax.id}>
                                          {tax.taxName} ({tax.taxValue}%)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Selling Price Tax */}
                            <div className="col-md-4">
                              <div className="dropdown">
                                <div className="">
                                  <label className="me-2 d-md-inline">
                                    Selling Price Tax Type
                                  </label>
                                  <div className="d-flex align-items-center">
                                    <select
                                      className="form-select me-2 "
                                      id="sellingTax"
                                      name="sellingTax"
                                      required
                                      value={sellingPriceTaxType}
                                      onChange={(e) =>
                                        setSellingPriceTaxType(e.target.value)
                                      }
                                    >
                                      <option value="">None</option>
                                      <option value="Exclusive">
                                        Exclusive
                                      </option>
                                      <option value="Inclusive">
                                        Inclusive
                                      </option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Product Type */}
                            <div className="col-md-4">
                              <div className="dropdown">
                                <div className="">
                                  <label className="me-2 d-md-inline">
                                    Product Type
                                  </label>
                                  <div className=" ">
                                    <select
                                      className="form-select "
                                      id="productType"
                                      name="productType"
                                      value={productType}
                                      readOnly
                                    >
                                      <option value="4">None</option>
                                      <option value="SINGLE">Single</option>
                                      <option value="VARIABLE">Variable</option>
                                      <option value="COMBO">Combo</option>
                                      readOnly
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Table for Single Product */}
                            {productType === "SINGLE" && (
                              <div className="col-12 pt-3">
                                <div className="table-responsive">
                                  <table className="table table-bordered add-product-price-table table-condensed">
                                    <thead>
                                      <tr>
                                        <th>Default Purchase Price</th>
                                        <th>
                                          x Margin(%)
                                          <i
                                            className="fa fa-info-circle text-info hover-q no-print"
                                            aria-hidden="true"
                                            data-container="body"
                                            data-toggle="popover"
                                            data-placement="auto bottom"
                                            data-content="Default profit margin for the product. <br><small class='text-muted'>(<i>You can manage default profit margin in Business Settings.</i>)</small>"
                                            data-html="true"
                                            data-trigger="hover"
                                          ></i>
                                        </th>
                                        <th>Default Selling Price</th>
                                        <th>Product Image</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>
                                          <div className="row">
                                            <div className="col-sm-6">
                                              <label htmlFor="single_dpp">
                                                Exc. tax:*
                                              </label>
                                              <input
                                                className="form-control input-sm dpp input_number"
                                                placeholder="Exc. tax"
                                                required
                                                name="single_dpp"
                                                type="text"
                                                value={
                                                  defaultPurchasePriceExcTax
                                                }
                                                onChange={handleExcTaxChange}
                                              />
                                            </div>
                                            <div className="col-sm-6">
                                              <label htmlFor="single_dpp_inc_tax">
                                                Inc. tax:*
                                              </label>
                                              <input
                                                className="form-control input-sm dpp_inc_tax input_number"
                                                placeholder="Inc. tax"
                                                required
                                                name="single_dpp_inc_tax"
                                                id="single_dpp_inc_tax"
                                                type="text"
                                                value={
                                                  defaultPurchasePriceIncTax
                                                }
                                                onChange={handleIncTaxChange}
                                              />
                                            </div>
                                          </div>
                                        </td>
                                        <td>
                                          <input
                                            className="form-control input-sm input_number"
                                            id="profit_percent"
                                            required
                                            name="profit_percent"
                                            type="text"
                                            placeholder="Profit Margin"
                                            value={profitMargin}
                                            onChange={(e) => {
                                              setProfitMargin(e.target.value);
                                              recalculatePrices();
                                            }}
                                          />
                                        </td>
                                        <td>
                                          <label>
                                            <span className="dsp_label">
                                              Inc. Tax
                                            </span>
                                          </label>
                                          <input
                                            className="form-control input-sm dsp input_number hide"
                                            placeholder="Exc. tax"
                                            id="single_dsp"
                                            required
                                            name="single_dsp"
                                            type="text"
                                            hidden
                                            value={defaultSellingPrice}
                                            readOnly
                                          />
                                          <input
                                            className="form-control input-sm input_number"
                                            placeholder="Inc. tax"
                                            id="single_dsp_inc_tax"
                                            required
                                            name="single_dsp_inc_tax"
                                            type="text"
                                            value={defaultSellingPrice}
                                            onChange={(e) =>
                                              setDefaultSellingPrice(
                                                e.target.value
                                              )
                                            }
                                          />
                                        </td>

                                        <td>
                                          <div className="form-group">
                                            <label htmlFor="productImage">
                                              Variation Image:
                                            </label>
                                            <input
                                              id="image"
                                              accept="image/*"
                                              name="image"
                                              type="file"
                                              onChange={handleSingleImageChange} // Handle new image selection
                                            />
                                            <small>
                                              <p className="help-block">
                                                Max File size: 5MB <br /> Aspect
                                                ratio should be 1:1
                                              </p>
                                            </small>

                                            {/* Display the selected image preview if available */}
                                            {productVariantImage &&
                                              productVariantImage.length >
                                                0 && (
                                                <div>
                                                  <img
                                                    src={
                                                      typeof productVariantImage[0] ===
                                                      "string"
                                                        ? productVariantImage[0]
                                                        : URL.createObjectURL(
                                                            productVariantImage[0]
                                                          )
                                                    }
                                                    alt="Product"
                                                    width="100"
                                                  />
                                                </div>
                                              )}

                                            {/* Display existing image if no new image is selected */}
                                            {!productVariantImage ||
                                            productVariantImage.length === 0 ? (
                                              <div>
                                                <img
                                                  src={singleExistingImage}
                                                  alt="Existing Product"
                                                  width="100"
                                                />
                                              </div>
                                            ) : null}
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Table for Variable Product */}
                            {productType === "VARIABLE" && (
                              <div className="col-12 pt-3">
                                <div className="table-responsive">
                                  <h4>
                                    Edit Variation:
                                    <button
                                      type="button"
                                      className="btn btn-success m-2"
                                      onClick={addVariation}
                                    >
                                      +
                                    </button>
                                  </h4>
                                  {variations.map((variation, index) => (
                                    <div key={index}>
                                      <table className="table table-bordered add-product-price-table table-condensed">
                                        <thead>
                                          <tr>
                                            <th></th>
                                            <th className="col-sm-2">
                                              Variation
                                            </th>
                                            <th className="col-sm-10">
                                              Variation Values
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr className="variation_row">
                                            <td>
                                              <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={() =>
                                                  removeVariation(index)
                                                }
                                              >
                                                <i className="fa fa-trash"></i>
                                              </button>
                                            </td>
                                            <td>
                                              <select
                                                className="form-control input-sm variation_value_name"
                                                required
                                                value={variation.name || ""}
                                                onChange={(e) =>
                                                  handleVariationChange(
                                                    e,
                                                    index,
                                                    "name"
                                                  )
                                                }
                                              >
                                                <option value="">
                                                  Select Variation
                                                </option>
                                                {variationValues.map(
                                                  (variationValue) => (
                                                    <option
                                                      key={variationValue.id}
                                                      value={variationValue.id}
                                                    >
                                                      {
                                                        variationValue.variationName
                                                      }
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                              {variation.name && (
                                                <div>
                                                  <label>
                                                    Select Variation Values:
                                                  </label>
                                                  <Select
                                                    isMulti
                                                    className="basic-multi-select"
                                                    classNamePrefix="select"
                                                    value={
                                                      variation.selectedValues.map(
                                                        (value) => ({
                                                          label: value,
                                                          value,
                                                        })
                                                      ) || []
                                                    }
                                                    options={
                                                      variationValues
                                                        .find(
                                                          (v) =>
                                                            v.id ===
                                                            parseInt(
                                                              variation.name
                                                            )
                                                        )
                                                        ?.values.map((val) => ({
                                                          label: val,
                                                          value: val,
                                                        })) || []
                                                    }
                                                    onChange={(
                                                      selectedOptions
                                                    ) => {
                                                      const selectedValues =
                                                        selectedOptions
                                                          ? selectedOptions.map(
                                                              (option) =>
                                                                option.value
                                                            )
                                                          : [];
                                                      handleVariationChange(
                                                        {
                                                          target: {
                                                            value:
                                                              selectedValues,
                                                          },
                                                        },
                                                        index,
                                                        "selectedValues"
                                                      );
                                                      addRowForSelectedValues(
                                                        index,
                                                        selectedValues
                                                      );
                                                    }}
                                                    menuPlacement="top"
                                                  />
                                                </div>
                                              )}
                                            </td>
                                            <td>
                                              {variation.rows.length > 0 && (
                                                <table className="table table-condensed table-bordered blue-header variation_value_table">
                                                  <thead>
                                                    <tr>
                                                      <th>SKU</th>
                                                      <th>Value</th>
                                                      <th>
                                                        Default Purchase Price
                                                        <br />
                                                        <span className="pull-left">
                                                          <small>
                                                            <i>Exc. tax</i>
                                                          </small>
                                                        </span>
                                                        <span className="pull-right">
                                                          <small>
                                                            <i>Inc. tax</i>
                                                          </small>
                                                        </span>
                                                      </th>
                                                      <th>x Margin(%)</th>
                                                      <th>
                                                        Default Selling Price
                                                      </th>
                                                      <th>Variation Images</th>
                                                      <th>
                                                        <button
                                                          type="button"
                                                          className="btn btn-success"
                                                          onClick={() =>
                                                            addRow(index)
                                                          }
                                                        >
                                                          +
                                                        </button>
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {variation.rows.map(
                                                      (row, rowIndex) => (
                                                        <tr key={rowIndex}>
                                                          <td>
                                                            <input
                                                              className="form-control input-sm"
                                                              type="text"
                                                              value={
                                                                row.subSku || ""
                                                              }
                                                              onChange={(e) =>
                                                                handleRowChange(
                                                                  e,
                                                                  index,
                                                                  rowIndex,
                                                                  "subSku"
                                                                )
                                                              }
                                                            />
                                                          </td>
                                                          <td>
                                                            <input
                                                              className="form-control input-sm"
                                                              type="text"
                                                              value={row.value}
                                                              readOnly
                                                            />
                                                          </td>
                                                          <td>
                                                            <div className="d-flex">
                                                              <input
                                                                className="form-control input-sm variable_dpp input_number me-1"
                                                                placeholder="Exc. tax"
                                                                type="text"
                                                                value={
                                                                  row.defaultPurchasePriceExcTax
                                                                }
                                                                onChange={(e) =>
                                                                  handleRowChange(
                                                                    e,
                                                                    index,
                                                                    rowIndex,
                                                                    "defaultPurchasePriceExcTax"
                                                                  )
                                                                }
                                                              />
                                                              <input
                                                                className="form-control input-sm variable_dpp_inc_tax input_number"
                                                                placeholder="Inc. tax"
                                                                type="text"
                                                                value={
                                                                  row.defaultPurchasePriceIncTax
                                                                }
                                                                onChange={(e) =>
                                                                  handleRowChange(
                                                                    e,
                                                                    index,
                                                                    rowIndex,
                                                                    "defaultPurchasePriceIncTax"
                                                                  )
                                                                }
                                                              />
                                                            </div>
                                                          </td>
                                                          <td>
                                                            <input
                                                              className="form-control input-sm input_number"
                                                              type="text"
                                                              value={
                                                                row.profitMargin ||
                                                                ""
                                                              }
                                                              onChange={(e) =>
                                                                handleRowChange(
                                                                  e,
                                                                  index,
                                                                  rowIndex,
                                                                  "profitMargin"
                                                                )
                                                              }
                                                            />
                                                          </td>
                                                          <td>
                                                            <div className="d-flex">
                                                              <input
                                                                className="form-control input-sm variable_dsp input_number me-1"
                                                                type="text"
                                                                value={
                                                                  row.defaultSellingPrice ||
                                                                  ""
                                                                }
                                                                readOnly
                                                              />
                                                            </div>
                                                          </td>
                                                          <td>
                                                            {/* File input for uploading the image */}
                                                            <input
                                                              type="file"
                                                              onChange={(e) =>
                                                                handleRowChange(
                                                                  e,
                                                                  index,
                                                                  rowIndex,
                                                                  "variationProductImages"
                                                                )
                                                              }
                                                            />

                                                            {/* Display the uploaded image if it's a string (i.e., an image URL) */}
                                                            {row.variationProductImages &&
                                                              typeof row.variationProductImages ===
                                                                "string" && (
                                                                <img
                                                                  src={
                                                                    row.variationProductImages
                                                                  }
                                                                  alt={`Variation ${rowIndex}`}
                                                                  style={{
                                                                    width:
                                                                      "50px",
                                                                    height:
                                                                      "50px",
                                                                  }}
                                                                />
                                                              )}
                                                          </td>

                                                          <td>
                                                            <button
                                                              type="button"
                                                              className="btn btn-danger"
                                                              onClick={() =>
                                                                removeRow(
                                                                  index,
                                                                  rowIndex
                                                                )
                                                              }
                                                            >
                                                              <i className="fa fa-trash"></i>
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      )
                                                    )}
                                                  </tbody>
                                                </table>
                                              )}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Table for Combo Product */}
                            {productType === "COMBO" && (
                              <div
                                className="form-group col-sm-12"
                                id="product_form_part"
                              >
                                <div className="col-sm-12 mt-3">
                                  <div className="col-sm-8 col-sm-offset-2">
                                    <div className="input-group">
                                      <span className="input-group-text">
                                        <i className="fa fa-search"></i>
                                      </span>
                                      <input
                                        className="form-control py-3"
                                        id="search_product"
                                        placeholder="Enter Product name / SKU / Scan bar code"
                                        name="search_product"
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                      />
                                      <button
                                        className="btn btn-primary py-1"
                                        onClick={(e) => {
                                          e.preventDefault(); // Prevent form submission
                                          searchProducts(); // Call the search function
                                        }}
                                      >
                                        Search
                                      </button>
                                    </div>
                                  </div>

                                  {searchResults.length > 0 && (
                                    <ul className="list-group mt-2">
                                      {searchResults.map((product) => (
                                        <li
                                          key={product.id}
                                          className="list-group-item d-flex justify-content-between align-items-center"
                                          onClick={() => addProductRow(product)} // Add product on click
                                          style={{ cursor: "pointer" }}
                                        >
                                          {product.productName} (SKU:{" "}
                                          {product.sku})
                                          <span className="badge badge-primary badge-pill">
                                            {product.defaultSellingPrice &&
                                            !isNaN(product.defaultSellingPrice)
                                              ? product.defaultSellingPrice.toFixed(
                                                  2
                                                )
                                              : "N/A"}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}

                                  <div className="col-sm-12 mt-3">
                                    <div className="table-responsive">
                                      <table className="table table-condensed table-bordered table-striped">
                                        <thead>
                                          <tr>
                                            <th className="text-center">
                                              Product Name
                                            </th>
                                            <th className="text-center">
                                              Quantity
                                            </th>
                                            <th className="text-center">
                                              Purchase Price (Excluding Tax)
                                            </th>
                                            <th className="text-center">
                                              Total Amount (Exc. Tax)
                                            </th>
                                            <th className="text-center">
                                              <i className="fa fa-trash"></i>
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {products.map((product, index) => (
                                            <tr key={index}>
                                              <td>{product.productName}</td>
                                              <td>
                                                <input
                                                  type="number"
                                                  className="form-control"
                                                  value={product.quantity || 1} // Ensure quantity is always a valid number
                                                  onChange={(e) =>
                                                    updateQuantity(
                                                      index,
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                              </td>
                                              <td>
                                                {product.defaultSellingPrice &&
                                                !isNaN(
                                                  product.defaultSellingPrice
                                                )
                                                  ? product.defaultSellingPrice.toFixed(
                                                      2
                                                    )
                                                  : "0.00"}{" "}
                                                {/* Fallback to 0.00 */}
                                              </td>
                                              <td>
                                                {product.defaultSellingPrice &&
                                                product.quantity
                                                  ? (
                                                      product.defaultSellingPrice *
                                                      product.quantity
                                                    ).toFixed(2)
                                                  : "0.00"}{" "}
                                                {/* Fallback to 0.00 */}
                                              </td>
                                              <td>
                                                <button
                                                  className="btn btn-danger"
                                                  onClick={(event) =>
                                                    removeProductRow(
                                                      index,
                                                      event
                                                    )
                                                  } // Pass the event
                                                >
                                                  <i className="fa fa-trash"></i>
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>

                                        <tfoot>
                                          <tr>
                                            <td
                                              colSpan="3"
                                              className="text-center"
                                            >
                                              <b>Net Total Amount:</b>
                                            </td>
                                            <td>
                                              <input
                                                className="form-control"
                                                id="netTotalAmount"
                                                name="netTotalAmount"
                                                type="number"
                                                value={
                                                  netTotalAmount
                                                    ? netTotalAmount.toFixed(2)
                                                    : "0.00"
                                                }
                                                readOnly
                                              />
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-md-4">
                                      <label htmlFor="profitMargin">
                                        Margin (%)
                                      </label>
                                      <input
                                        className="form-control"
                                        id="profitMargin"
                                        name="profit_percent"
                                        type="number"
                                        value={profitMargin}
                                        onChange={handleProfitMarginChange}
                                      />
                                    </div>
                                    <div className="col-md-4">
                                      <label htmlFor="selling_price">
                                        Default Selling Price
                                      </label>
                                      <input
                                        className="form-control"
                                        name="selling_price"
                                        type="text"
                                        value={
                                          netTotalAmount && profitMargin
                                            ? (
                                                netTotalAmount *
                                                (1 + profitMargin / 100)
                                              ).toFixed(2)
                                            : "0.00"
                                        } // Calculate based on net total and profit margin
                                        readOnly
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save */}
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

      {/* Unit modal */}
      <div
        className="modal fade"
        id="addUnitModal"
        tabIndex="-1"
        aria-labelledby="addUnitModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addUnitModalLabel">
                Add Unit
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {/* Form inside modal */}
              <form>
                <div className="mb-3">
                  <label htmlFor="unitName" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="unitName"
                    placeholder="Enter unit name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="unitShortName" className="form-label">
                    Short Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="unitShortName"
                    placeholder="Enter short name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="allowDecimal" className="form-label">
                    Allow Decimal
                  </label>
                  <select
                    className="form-select"
                    id="allowDecimal"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose option
                    </option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Brand modal */}
      <div
        className="modal fade"
        id="addBrandModal"
        tabIndex="-1"
        aria-labelledby="addBrandModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addBrandModalLabel">
                Add Brand
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {/* Form inside modal */}
              <form>
                <div className="mb-3">
                  <label htmlFor="brandName" className="form-label">
                    Brand Name<span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="brandName"
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="shortDescription" className="form-label">
                    Short Description
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="shortDescription"
                    placeholder="Enter short description"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="useForRepair"
                    />
                    <label htmlFor="useForRepair" className="form-check-label">
                      Use for repair?
                    </label>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditList;
