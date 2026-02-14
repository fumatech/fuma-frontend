import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import axios from "axios";
import Select from "react-select";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";

function AddProducts() {
  const formRef = useRef(null);
  const navigate = useNavigate();

  // State variables
  const [manageStock, setManageStock] = useState(false);
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [products, setProducts] = useState([]);
  const [comboProducts, setComboProducts] = useState([]);
  const [netTotalAmount, setNetTotalAmount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);

  // Product Details
  const [productName, setProductName] = useState("");
  const [alertQuantity, setAlertQuantity] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [businessLocations, setBusinessLocations] = useState([]);
  const [businessLocation, setBusinessLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [applicableTax, setApplicableTax] = useState("");
  const [sellingPriceTaxType, setSellingPriceTaxType] = useState("Exclusive");
  const [productType, setProductType] = useState("SINGLE");
  const [defaultPurchasePrice, setDefaultPurchasePrice] = useState(0);
  const [defaultSellingPrice, setDefaultSellingPrice] = useState(0);
  const [defaultPurchasePriceExcTax, setDefaultPurchasePriceExcTax] =
    useState(0);
  const [defaultPurchasePriceIncTax, setDefaultPurchasePriceIncTax] =
    useState(0);
  const [subSku, setSubSku] = useState("");
  const [profitMargin, setProfitMargin] = useState();
  const [productImage, setProductImage] = useState(null);
  const [productVariantImage, setProductVariantImage] = useState([]);

  // Dropdown options
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variationValues, setVariationValues] = useState([]);
  const [variations, setVariations] = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Unit modal state
  const [unitName, setUnitName] = useState("");
  const [unitShortName, setUnitShortName] = useState("");
  const [allowDecimal, setAllowDecimal] = useState("");

  // Brand modal state
  const [brandName, setBrandName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
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

  // Helper function to get tax rate by ID
  const getTaxRateById = (taxId) => {
    const tax = taxes.find((t) => t.id == taxId); // Use loose equality for string/number comparison
    return tax ? tax.taxValue / 100 : 0; // Convert percentage to decimal
  };

  // Calculate inclusive tax from exclusive price
  const calculateIncTaxFromExc = (excTaxPrice) => {
    const taxRate = applicableTax ? getTaxRateById(applicableTax) : 0;
    return excTaxPrice * (1 + taxRate);
  };

  // Calculate exclusive tax from inclusive price
  const calculateExcTaxFromInc = (incTaxPrice) => {
    const taxRate = applicableTax ? getTaxRateById(applicableTax) : 0;
    return incTaxPrice / (1 + taxRate);
  };

  // Recalculate prices when tax or other factors change
  const recalculatePrices = (selectedTaxId) => {
    const taxRate = getTaxRateById(selectedTaxId);
    const excTaxPrice = parseFloat(defaultPurchasePriceExcTax) || 0;

    // Calculate Inc. Tax based on Exc. Tax and applicable tax rate
    const newIncTaxPrice = excTaxPrice * (1 + taxRate);
    setDefaultPurchasePriceIncTax(newIncTaxPrice.toFixed(2));

    // Update the default selling price based on the current tax type
    const profitMarginValue = parseFloat(profitMargin) || 0;
    let sellingPrice = 0;

    if (sellingPriceTaxType === "Exclusive") {
      sellingPrice = excTaxPrice * (1 + profitMarginValue / 100);
    } else if (sellingPriceTaxType === "Inclusive") {
      sellingPrice = newIncTaxPrice * (1 + profitMarginValue / 100);
    }

    setDefaultSellingPrice(sellingPrice.toFixed(2));
  };

  // Handle tax selection change
  const handleApplicableTaxChange = (selectedTaxId) => {
    setApplicableTax(selectedTaxId);
    recalculatePrices(selectedTaxId);
  };

  // Calculate default selling price
  const calculateDefaultSellingPrice = () => {
    const excTaxPrice = parseFloat(defaultPurchasePriceExcTax) || 0;
    const incTaxPrice = parseFloat(defaultPurchasePriceIncTax) || 0;
    const profitMarginValue = parseFloat(profitMargin) || 0;
    let sellingPrice = 0;

    if (sellingPriceTaxType === "Exclusive") {
      sellingPrice = excTaxPrice * (1 + profitMarginValue / 100);
    } else if (sellingPriceTaxType === "Inclusive") {
      sellingPrice = incTaxPrice * (1 + profitMarginValue / 100);
    }

    return sellingPrice.toFixed(2);
  };

  // Handle Exc. Tax input change
  const handleExcTaxChange = (e) => {
    const excTax = parseFloat(e.target.value) || 0;
    setDefaultPurchasePriceExcTax(excTax);

    // Automatically calculate the Inc. Tax when the Exc. Tax changes
    const newIncTax = calculateIncTaxFromExc(excTax);
    setDefaultPurchasePriceIncTax(newIncTax.toFixed(2));
  };

  // Handle Inc. Tax input change
  const handleIncTaxChange = (e) => {
    const incTax = parseFloat(e.target.value) || 0;
    setDefaultPurchasePriceIncTax(incTax);

    // Automatically calculate the Exc. Tax when the Inc. Tax changes
    const newExcTax = calculateExcTaxFromInc(incTax);
    setDefaultPurchasePriceExcTax(newExcTax.toFixed(2));
  };

  // Calculate selling price for variation rows
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

  // Recalculate prices for variation rows
  const recalculatePricesForVariationRows = () => {
    if (!Array.isArray(variations)) return;

    const updatedVariations = variations.map((variation) => {
      const updatedRows = Array.isArray(variation.rows)
        ? variation.rows.map((row) => {
          const excTaxPrice = parseFloat(row.defaultPurchasePriceExcTax) || 0;
          const newIncTaxPrice = calculateIncTaxFromExc(excTaxPrice);
          row.defaultPurchasePriceIncTax = newIncTaxPrice.toFixed(2);
          row.defaultSellingPrice = calculateDefaultSellingPriceForRow(row);
          return row;
        })
        : [];
      return { ...variation, rows: updatedRows };
    });

    setVariations(updatedVariations);
  };

  // Handle Exc. Tax change for variation rows
  const handleExcTaxChangeForRow = (e, index, rowIndex) => {
    const excTax = parseFloat(e.target.value) || 0;
    const updatedVariations = [...variations];

    if (updatedVariations[index]?.rows?.[rowIndex]) {
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceExcTax =
        excTax;
      const newIncTax = calculateIncTaxFromExc(excTax);
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceIncTax =
        newIncTax.toFixed(2);
      updatedVariations[index].rows[rowIndex].defaultSellingPrice =
        calculateDefaultSellingPriceForRow(
          updatedVariations[index].rows[rowIndex]
        );
      setVariations(updatedVariations);
    }
  };

  // Handle Inc. Tax change for variation rows
  const handleIncTaxChangeForRow = (e, index, rowIndex) => {
    const incTax = parseFloat(e.target.value) || 0;
    const updatedVariations = [...variations];

    if (updatedVariations[index]?.rows?.[rowIndex]) {
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceIncTax =
        incTax;
      const newExcTax = calculateExcTaxFromInc(incTax);
      updatedVariations[index].rows[rowIndex].defaultPurchasePriceExcTax =
        newExcTax.toFixed(2);
      updatedVariations[index].rows[rowIndex].defaultSellingPrice =
        calculateDefaultSellingPriceForRow(
          updatedVariations[index].rows[rowIndex]
        );
      setVariations(updatedVariations);
    }
  };

  // Fetch data functions
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
  // Flatten categories for dropdown
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

  // Initialize data on component mount
  useEffect(() => {
    fetchBrands();
    fetchUnits();
    fetchVariations();
    fetchCategories();
    fetchTaxes();
  }, []);

  // Update selling price when dependencies change
  useEffect(() => {
    const newSellingPrice = calculateDefaultSellingPrice();
    setDefaultSellingPrice(newSellingPrice);
  }, [
    sellingPriceTaxType,
    defaultPurchasePriceExcTax,
    defaultPurchasePriceIncTax,
    profitMargin,
  ]);

  // Recalculate prices when tax or other factors change
  useEffect(() => {
    recalculatePrices(applicableTax);
  }, [
    applicableTax,
    defaultPurchasePriceExcTax,
    sellingPriceTaxType,
    profitMargin,
  ]);

  // Recalculate variation prices when dependencies change
  useEffect(() => {
    if (Array.isArray(variations) && variations.length > 0) {
      recalculatePricesForVariationRows();
    }
  }, [sellingPriceTaxType, applicableTax, variations]);

  // Handle product price and margin changes
  useEffect(() => {
    const purchasePrice = parseFloat(defaultPurchasePrice);
    const margin = parseFloat(profitMargin);

    if (!isNaN(purchasePrice) && !isNaN(margin)) {
      const sellingPrice = purchasePrice + purchasePrice * (margin / 100);
      setDefaultSellingPrice(sellingPrice.toFixed(2));
    } else {
      setDefaultSellingPrice("");
    }
  }, [defaultPurchasePrice, profitMargin]);

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.warning("Max file size is 5MB");
        return;
      }
      setProductImage(selectedFile);
      setFile(selectedFile);
    }
  };

  // Handle description change
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  // Handle variation changes
  const handleVariationChange = (e, index, fieldName) => {
    const { value } = e.target;
    const newVariations = [...variations];
    newVariations[index][fieldName] = value;
    if (fieldName === "name") newVariations[index].selectedValue = "";
    setVariations(newVariations);
  };

  // Handle variation image changes
  const handleVariationImageChange = (e, index, rowIndex) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.warning("Max file size: 5MB");
        return;
      }

      const newVariations = [...variations];
      if (!newVariations[index].rows[rowIndex]) {
        newVariations[index].rows[rowIndex] = {};
      }
      newVariations[index].rows[rowIndex].variationProductImages = selectedFile;
      setVariations(newVariations);
    }
  };

  // Remove variation
  const removeVariation = (index) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  // Handle row changes
  const handleRowChange = (e, index, rowIndex, field) => {
    const value = parseFloat(e.target.value) || 0;
    setVariations((prevVariations) => {
      const newVariations = [...prevVariations];
      const row = newVariations[index].rows[rowIndex];
      row[field] = value;
      return newVariations;
    });
  };

  // Add variation
  const addVariation = () => {
    setVariations([
      ...variations,
      {
        name: "",
        selectedValues: [],
        rows: [],
      },
    ]);
  };

  // Add row to variation
  const addRow = (variationIndex) => {
    setVariations((prevVariations) => {
      return prevVariations.map((variation, vIndex) => {
        if (vIndex === variationIndex) {
          const updatedRows = [...variation.rows];
          updatedRows.push({
            sku: "",
            value: "",
            defaultPurchasePriceExcTax: "",
            defaultPurchasePriceIncTax: "",
            profitMargin: "",
            defaultSellingPrice: "",
            defaultSellingPriceIncTax: "",
            image: null,
          });
          return { ...variation, rows: updatedRows };
        }
        return variation;
      });
    });
  };

  // Remove row from variation
  const removeRow = (variationIndex, rowIndex) => {
    const newVariations = [...variations];
    newVariations[variationIndex].rows.splice(rowIndex, 1);
    setVariations(newVariations);
  };

  // Handle single product image change
  const handleSingleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setProductVariantImage(files);
  };

  // Combo product functions
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      await searchProducts(value);
    } else {
      setSearchResults([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchProducts(searchTerm);
    }
  };

  const searchProducts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/search?query=${searchTerm}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setSearchResults([]);
    }
  };

  const addProductRow = (product) => {
    let updatedProducts = [...products];
    product.productVariations.forEach((variation) => {
      updatedProducts.push({
        ...product,
        quantity: 1,
        productVariationId: variation.id,
        defaultPurchasePriceExcTax: variation.defaultPurchasePriceExcTax,
        defaultPurchasePriceIncTax: variation.defaultPurchasePriceIncTax,
        defaultSellingPrice: variation.defaultSellingPrice,
        defaultPurchasePriceExcTax:
          variation.defaultPurchasePriceExcTax &&
            !isNaN(variation.defaultPurchasePriceExcTax)
            ? parseFloat(variation.defaultPurchasePriceExcTax)
            : 0,
      });
    });

    setProducts(updatedProducts);
    setSearchTerm("");
    setSearchResults([]);
    calculateTotals(updatedProducts);
  };

  const updateQuantity = (index, value) => {
    const updatedProducts = [...products];
    updatedProducts[index].quantity = Number(value);
    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
  };

  const calculateTotals = (updatedProducts = products) => {
    const totalAmount = updatedProducts.reduce((acc, product) => {
      const productTotal =
        product.defaultSellingPrice && !isNaN(product.defaultSellingPrice)
          ? parseFloat(product.defaultSellingPrice) * (product.quantity || 0)
          : 0;
      return acc + productTotal;
    }, 0);

    setNetTotalAmount(totalAmount);
    const sellingPrice =
      totalAmount > 0 && !isNaN(profitMargin)
        ? (totalAmount * (1 + profitMargin / 100)).toFixed(2)
        : "0.00";
    setDefaultSellingPrice(Number(sellingPrice));
  };

  const handleProfitMarginChange = (e) => {
    const margin = parseFloat(e.target.value);
    setProfitMargin(isNaN(margin) ? 0 : margin);
    calculateTotals(products);
  };

  const removeProductRow = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const checkSkuExists = await checkIfSkuExists(sku);
    if (checkSkuExists) {
      toast.warning("SKU already exists. Please choose a unique SKU.");
      return;
    }

    const formData = new FormData();
    const productObject = {
      productName,
      sku,
      barcode,
      unit,
      brand,
      status: 1,
      manageStock,
      alertQuantity,
      category,
      businessLocation: businessLocation?.value || "",
      description,
      applicableTax,
      sellingPriceTaxType,
      productType,
      productVariations: [],
    };

    if (productType === "SINGLE") {
      productObject.productVariations.push({
        defaultPurchasePriceIncTax,
        defaultPurchasePriceExcTax,
        defaultSellingPrice,
        margin: profitMargin,
      });
    } else if (productType === "VARIABLE") {
      variations.forEach((variation) => {
        variation.rows.forEach((row) => {
          productObject.productVariations.push({
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
    } else if (productType === "COMBO") {
      const comboVariations = products.map((product) => ({
        productVariationId: product.productVariationId,
        productName: product.productName,
        defaultPurchasePriceExcTax: product.defaultPurchasePriceExcTax,
        defaultPurchasePriceIncTax: product.defaultPurchasePriceIncTax,
        defaultSellingPrice: product.defaultSellingPrice,
        quantity: product.quantity,
      }));

      const totalPurchasePrice = products.reduce(
        (acc, product) => acc + product.defaultSellingPrice * product.quantity,
        0
      );
      const calculatedSellingPrice =
        totalPurchasePrice > 0 && !isNaN(profitMargin)
          ? (totalPurchasePrice * (1 + profitMargin / 100)).toFixed(2)
          : "0.00";

      productObject.productVariations.push({
        comboVariations: JSON.stringify(comboVariations),
        defaultPurchasePriceExcTax: totalPurchasePrice.toFixed(2),
        defaultSellingPrice: calculatedSellingPrice,
        margin: profitMargin,
      });
    }

    formData.append("product", JSON.stringify(productObject));

    if (productImage) {
      formData.append("productImage", productImage);
    }

    if (productVariantImage && productVariantImage.length > 0) {
      productVariantImage.forEach((image) =>
        formData.append("variationImages", image)
      );
    }

    const variationImages = [];
    variations.forEach((variation) => {
      variation.rows.forEach((row) => {
        if (row.variationProductImages) {
          variationImages.push(row.variationProductImages);
        }
      });
    });

    variationImages.forEach((image) => {
      if (image) {
        formData.append("variationImages", image);
      }
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/product/save`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success("Product Saved Successfully!");
      resetForm();
      navigate("/ListProducts");
    } catch (error) {
      // console.error(
      //   "Error saving product:",
      //   error.response?.data || error.message
      // );
      toast.error("Failed to save product. Please try again.");
    }
  };

  const checkIfSkuExists = async (sku) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL
        }/product/skuExists?sku=${encodeURIComponent(sku)}`
      );
      const data = await response.json();
      return data.exists; // true means it exists
    } catch (error) {
      console.error("Error checking SKU:", error);
      return false;
    }
  };

  // Add rows for selected values
  const addRowForSelectedValues = (index, selectedValues) => {
    const updatedVariations = [...variations];
    if (!updatedVariations[index].rows) updatedVariations[index].rows = [];

    selectedValues.forEach((value) => {
      if (!updatedVariations[index].rows.find((row) => row.value === value)) {
        updatedVariations[index].rows.push({
          subSku: "",
          value,
          defaultPurchasePriceExcTax: "",
          defaultPurchasePriceIncTax: "",
          defaultSellingPrice: "",
          profitMargin: "",
          variationProductImages: null,
        });
      }
    });

    setVariations(updatedVariations);
  };

  // Reset form
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
    setProductType("SINGLE");
    setDefaultPurchasePriceExcTax("");
    setDefaultPurchasePriceIncTax("");
    setDefaultSellingPrice("");
    setProfitMargin("");
    setVariations([]);
    setFile("");
    setProducts([]);
    if (formRef.current) formRef.current.reset();
  };

  // Unit modal functions
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    const unitData = { name: unitName, shortName: unitShortName, allowDecimal };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/units/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unitData),
        }
      );
      if (response.ok) {
        toast.success("Unit saved successfully!");
        fetchUnits();
        closeUnitModal();
      } else {
        toast.error("Error saving unit");
      }
    } catch (error) {
      //console.error("Network error:", error);
      toast.error("Network error: Unable to save unit");
    }
  };
  const closeUnitModal = () => {
    setUnitName("");
    setUnitShortName("");
    setAllowDecimal("");
    const unitModal = new window.bootstrap.Modal(
      document.getElementById("addUnitModal")
    );
    unitModal.hide();
  };

  // Brand modal functions
  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    const brandData = { brandName, description: shortDescription };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/brands/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(brandData),
        }
      );
      if (response.ok) {
        toast.success("Brand saved successfully!");
        fetchBrands();
        closeBrandModal();
      } else {
        toast.error("Error saving brand");
      }
    } catch (error) {
      //  console.error("Network error:", error);
      toast.error("Network error: Unable to save brand");
    }
  };

  const closeBrandModal = () => {
    setBrandName("");
    setShortDescription("");
    const brandModal = new window.bootstrap.Modal(
      document.getElementById("addBrandModal")
    );
    brandModal.hide();
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
                  <h1>Add Products</h1>
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
                            placeholder="Enter unique SKU"
                            value={sku}
                            onKeyDown={(e) => {
                              if (e.key === " ") {
                                e.preventDefault();
                              }
                            }}
                            onChange={async (e) => {
                              let newSku = e.target.value.replace(/\s+/g, "");
                              setSku(newSku);

                              if (newSku) {
                                const exists = await checkIfSkuExists(newSku);
                                if (exists) {
                                  toast.warning(
                                    "This SKU already exists. Please enter a unique SKU."
                                  );
                                  setSku(""); // optional
                                }
                              }
                            }}
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

                      {/* Manage Stock */}
                      <div className="col-md-4">
                        <div className="form-check form-check-lg">
                          <br />
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="manageStock"
                            name="manageStock"
                            checked={manageStock}
                            onChange={(e) => setManageStock(e.target.checked)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="manageStock"
                          >
                            Manage Stock
                          </label>
                        </div>
                      </div>

                      {/* Alert Quantity */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="alertQuantity">Alert Quantity:</label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="alertQuantity"
                            name="alertQuantity"
                            placeholder="Enter here.."
                            value={alertQuantity}
                            onChange={(e) => setAlertQuantity(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Product image */}
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label htmlFor="image">Product image:</label>
                          <div className="file-input file-input-new">
                            <div className="file-preview">
                              {file ? (
                                <>
                                  <div className="file-preview-thumbnails">
                                    <div>{file.name}</div>
                                  </div>
                                  <div className="file-preview-status text-center text-success"></div>
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
                              <div className="input-group-append ">
                                <div className="btn btn-primary btn-file rounded-0 py-1 px-2 ms-2 ">
                                  <i className="glyphicon glyphicon-folder-open"></i>
                                  &nbsp; Browse..
                                  <input
                                    id="upload_image"
                                    accept="image/*"
                                    className="upload-element "
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
                                    handleApplicableTaxChange(e.target.value)
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
                                  className="form-select me-2"
                                  id="sellingTax"
                                  name="sellingTax"
                                  required
                                  value={sellingPriceTaxType}
                                  onChange={(e) =>
                                    setSellingPriceTaxType(e.target.value)
                                  }
                                >
                                  <option value="">None</option>
                                  <option value="Exclusive">Exclusive</option>
                                  <option value="Inclusive">Inclusive</option>
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
                                  onChange={(e) =>
                                    setProductType(e.target.value)
                                  }
                                >
                                  <option value="SINGLE">Single</option>
                                  <option value="VARIABLE">Variable</option>
                                  <option value="COMBO">Combo</option>
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
                                            value={defaultPurchasePriceExcTax}
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
                                            value={defaultPurchasePriceIncTax}
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
                                          {sellingPriceTaxType === "Exclusive"
                                            ? "Exc. Tax"
                                            : "Inc. Tax"}
                                        </span>
                                      </label>

                                      {/* Hidden field always present, for internal logic */}
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
                                        placeholder={
                                          sellingPriceTaxType === "Exclusive"
                                            ? "Exc. tax"
                                            : "Inc. tax"
                                        }
                                        id="single_dsp_inc_tax"
                                        required
                                        name="single_dsp_inc_tax"
                                        type="text"
                                        value={defaultSellingPrice}
                                        onChange={(e) =>
                                          setDefaultSellingPrice(e.target.value)
                                        }
                                      />
                                    </td>

                                    <td>
                                      <div className="form-group">
                                        <label htmlFor="productImage">
                                          Product Image:
                                        </label>
                                        <input
                                          id="image"
                                          accept="image/*"
                                          name="image"
                                          type="file"
                                          onChange={handleSingleImageChange}
                                        />
                                        <small>
                                          <p className="help-block">
                                            Max File size: 5MB <br /> Aspect
                                            ratio should be 1:1
                                          </p>
                                        </small>
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
                                Add Variation:
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
                                        <th className="col-sm-2">Variation</th>
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
                                        {/* Variation Name Selection */}
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
                                                  {variationValue.variationName}
                                                </option>
                                              )
                                            )}
                                          </select>

                                          {/* Variation Values Selection */}
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
                                                        parseInt(variation.name)
                                                    )
                                                    ?.values.map((val) => ({
                                                      label: val,
                                                      value: val,
                                                    })) || []
                                                }
                                                onChange={(selectedOptions) => {
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
                                                        value: selectedValues,
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

                                        {/* Rows for Each Selected Variation Value */}
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
                                                  <th>Default Selling Price</th>
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
                                                      {/* SKU Input */}
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

                                                      {/* Variation Value (Read-Only) */}
                                                      <td>
                                                        <input
                                                          className="form-control input-sm"
                                                          type="text"
                                                          value={row.value}
                                                          readOnly
                                                        />
                                                      </td>

                                                      {/* Default Purchase Price (Exc. and Inc. Tax) */}
                                                      <td>
                                                        <div className="d-flex">
                                                          <input
                                                            className="form-control input-sm variable_dpp input_number me-1"
                                                            placeholder="Exc. tax"
                                                            type="text"
                                                            value={
                                                              row.defaultPurchasePriceExcTax ||
                                                              ""
                                                            }
                                                            onChange={(e) => {
                                                              handleRowChange(
                                                                e,
                                                                index,
                                                                rowIndex,
                                                                "defaultPurchasePriceExcTax"
                                                              );
                                                            }}
                                                          />
                                                          <input
                                                            className="form-control input-sm variable_dpp_inc_tax input_number"
                                                            placeholder="Inc. tax"
                                                            type="text"
                                                            value={
                                                              row.defaultPurchasePriceIncTax ||
                                                              ""
                                                            }
                                                            onChange={(e) => {
                                                              handleRowChange(
                                                                e,
                                                                index,
                                                                rowIndex,
                                                                "defaultPurchasePriceIncTax"
                                                              );
                                                            }}
                                                          />
                                                        </div>
                                                      </td>

                                                      {/* Profit Margin */}
                                                      <td>
                                                        <input
                                                          className="form-control input-sm input_number"
                                                          type="text"
                                                          value={
                                                            row.profitMargin ||
                                                            ""
                                                          }
                                                          onChange={(e) => {
                                                            handleRowChange(
                                                              e,
                                                              index,
                                                              rowIndex,
                                                              "profitMargin"
                                                            );
                                                          }}
                                                        />
                                                      </td>

                                                      {/* Default Selling Price (Exc. and Inc. Tax) */}
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

                                                      {/* Image Upload */}
                                                      <td>
                                                        <input
                                                          type="file"
                                                          required
                                                          onChange={(e) =>
                                                            handleVariationImageChange(
                                                              e,
                                                              index,
                                                              rowIndex
                                                            )
                                                          }
                                                        />
                                                      </td>

                                                      {/* Remove Row Button */}
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
                                                          X
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
                                    onKeyPress={handleKeyPress}
                                    onChange={handleSearch}
                                  />
                                </div>
                              </div>

                              {searchResults.length > 0 && (
                                <ul className="list-group mt-2">
                                  {searchResults.map((product) => (
                                    <li
                                      key={product.id}
                                      className="list-group-item d-flex justify-content-between align-items-center"
                                      onClick={() => addProductRow(product)}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {product.productName} (SKU: {product.sku})
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
                                          Sale Price
                                        </th>
                                        <th className="text-center">
                                          Total Amount
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
                                              value={product.quantity}
                                              onChange={(e) =>
                                                updateQuantity(
                                                  index,
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </td>
                                          <td>{product.defaultSellingPrice}</td>
                                          <td>
                                            {(
                                              product.defaultSellingPrice *
                                              product.quantity
                                            ).toFixed(2)}
                                          </td>
                                          <td>
                                            <button
                                              onClick={() =>
                                                removeProductRow(index)
                                              }
                                              className="btn btn-danger"
                                            >
                                              <i className="fa fa-trash"></i>
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr>
                                        <td colSpan="3" className="text-center">
                                          <b>Net Total Amount:</b>
                                        </td>
                                        <td>
                                          <input
                                            className="form-control"
                                            id="netTotalAmount"
                                            name="netTotalAmount"
                                            type="number"
                                            value={netTotalAmount.toFixed(2)}
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
                                      netTotalAmount &&
                                        !isNaN(netTotalAmount) &&
                                        profitMargin &&
                                        !isNaN(profitMargin)
                                        ? Number(
                                          netTotalAmount *
                                          (1 + profitMargin / 100)
                                        ).toFixed(2)
                                        : "0.00"
                                    }
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

                {/* Save */}
                <div className="container-fluid text-center ">
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
              <form onSubmit={handleUnitSubmit}>
                <div className="mb-3">
                  <label htmlFor="unitName" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="unitName"
                    placeholder="Enter unit name"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    required
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
                    value={unitShortName}
                    onChange={(e) => setUnitShortName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="allowDecimal" className="form-label">
                    Allow Decimal
                  </label>
                  <select
                    className="form-select"
                    id="allowDecimal"
                    value={allowDecimal}
                    onChange={(e) => setAllowDecimal(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose option
                    </option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
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
              <form onSubmit={handleBrandSubmit}>
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
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
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
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddProducts;
