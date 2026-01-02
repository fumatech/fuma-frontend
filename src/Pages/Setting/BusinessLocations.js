import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Collapse } from "react-bootstrap";
import { toast } from "react-toastify";

const BusinessLocations = () => {
  const [businessLocations, setBusinessLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    locationId: "",
    landmark: "",
    city: "",
    zipCode: "",
    state: "",
    country: "",
    mobile: "",
    businessCategoryId: "",
    alternateContact: "",
    email: "",
    website: "",
    invoiceSchemePOS: "",
    invoiceSchemeSale: "",
    invoiceLayoutPOS: "",
    invoiceLayoutSale: "",
    defaultSellingPriceGroup: "",
    customField1: "",
    customField2: "",
    customField3: "",
    customField4: "",
    posFeaturedProducts: "",
  });

  // Product search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedProductNames, setSelectedProductNames] = useState("");

  const [paymentOptions, setPaymentOptions] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  useEffect(() => {
    // Fetch payment methods
    fetch(`${process.env.REACT_APP_BASE_URL}/payment-method/getall`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((method) => ({
          paymentMethodId: method.id,
          method: method.name,
          enabled: method.isActive ?? false,
          defaultAccountId: "",
        }));
        setPaymentOptions(mapped);
      })
      .catch((err) => console.error("Error fetching payment methods:", err));

    // Fetch payment accounts
    fetch(`${process.env.REACT_APP_BASE_URL}/payment-account/getall`)
      .then((res) => res.json())
      .then((data) => {
        setPaymentAccounts(data);
      })
      .catch((err) => console.error("Error fetching payment accounts:", err));
  }, []);

  const handlePaymentOptionChange = (index, field, value) => {
    setPaymentOptions((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "enabled" ? value === "true" : value,
            }
          : item
      )
    );
  };

  // Pagination states
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column visibility state
  const [columnsVisibility, setColumnsVisibility] = useState({
    Name: true,
    LocationID: true,
    City: true,
    State: true,
    Country: true,
    Mobile: true,
    Email: true,
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    cities: [],
    states: [],
    countries: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    city: "",
    state: "",
    country: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  const invoiceSchemes = [
    { id: "", name: "Please Select" },
    { id: 1, name: "Scheme A" },
    { id: 2, name: "Scheme B" },
    { id: 3, name: "Scheme C" },
    { id: 4, name: "Scheme D" },
  ];

  const invoiceLayouts = [
    { id: "", name: "Please Select" },
    { id: 1, name: "Layout A" },
    { id: 2, name: "Layout B" },
    { id: 3, name: "Layout C" },
    { id: 4, name: "Layout D" },
  ];

  const sellingPriceGroups = [
    { id: "", name: "Please Select" },
    { id: 1, name: "Group A" },
    { id: 2, name: "Group B" },
    { id: 3, name: "Group C" },
    { id: 4, name: "Group D" },
  ];

  const [businessCategories, setBusinessCategories] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-category/getall`)
      .then((res) => res.json())
      .then((data) => {
        setBusinessCategories(data);
      })
      .catch((err) =>
        console.error("Error fetching business categories:", err)
      );
  }, []);

  useEffect(() => {
    fetchBusinessLocations();
  }, []);

  // Extract filter values when businessLocations changes
  useEffect(() => {
    if (businessLocations.length > 0) {
      const cities = [
        ...new Set(businessLocations.map((item) => item.city)),
      ].filter(Boolean);
      const states = [
        ...new Set(businessLocations.map((item) => item.state)),
      ].filter(Boolean);
      const countries = [
        ...new Set(businessLocations.map((item) => item.country)),
      ].filter(Boolean);

      setFilterValues({
        cities,
        states,
        countries,
      });
    }
  }, [businessLocations]);

  // Apply filters whenever activeFilters or businessLocations changes
  useEffect(() => {
    const filteredData = businessLocations.filter((location) => {
      const cityMatch =
        activeFilters.city === "" || location.city === activeFilters.city;
      const stateMatch =
        activeFilters.state === "" || location.state === activeFilters.state;
      const countryMatch =
        activeFilters.country === "" ||
        location.country === activeFilters.country;

      return cityMatch && stateMatch && countryMatch;
    });

    setFilteredLocations(filteredData);
  }, [activeFilters, businessLocations]);

  const fetchBusinessLocations = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/business-locations/getall`
      );
      const data = await response.json();
      setBusinessLocations(data);
      setFilteredLocations(data);
    } catch (error) {
      console.error("Error fetching business locations:", error);
    }

    // Add external script directly without setTimeout
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;

    document.body.appendChild(script);

    // Cleanup function to remove the script element when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  };

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setActiveFilters({
      city: "",
      state: "",
      country: "",
    });
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Product search function
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Changed to search only active products
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/search-active?query=${query}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Fallback: try the original endpoint if the new one doesn't exist
      try {
        const fallbackResponse = await fetch(
          `${process.env.REACT_APP_BASE_URL}/product/search?query=${query}`
        );
        const fallbackData = await fallbackResponse.json();
        // Filter to show only active products (isActive = true or status = 1)
        const activeProducts = fallbackData.filter(
          (product) => product.isActive === true || product.status === 1
        );
        setSearchResults(activeProducts);
      } catch (fallbackError) {
        console.error("Error with fallback search:", fallbackError);
        setSearchResults([]);
      }
    }
  };

  const handleProductSelect = (product) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      const updatedProducts = [
        ...selectedProducts,
        {
          id: product.id,
          name: product.productName, // ✅ important
        },
      ];

      setSelectedProducts(updatedProducts);

      // 🔥 Store JSON instead of comma-separated IDs
      setFormData((prev) => ({
        ...prev,
        posFeaturedProducts: JSON.stringify(updatedProducts),
      }));

      setSelectedProductNames(updatedProducts.map((p) => p.name).join(", "));
    }

    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleProductRemove = (productId) => {
    const updatedProducts = selectedProducts.filter((p) => p.id !== productId);

    setSelectedProducts(updatedProducts);

    setFormData((prev) => ({
      ...prev,
      posFeaturedProducts: JSON.stringify(updatedProducts),
    }));

    setSelectedProductNames(updatedProducts.map((p) => p.name).join(", "));
  };

  const clearSelectedProducts = () => {
    setSelectedProducts([]);
    setSelectedProductNames("");

    setFormData((prev) => ({
      ...prev,
      posFeaturedProducts: JSON.stringify([]),
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      searchProducts(query);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSaveLocation = () => {
    const dataToSend = {
      name: formData.name,
      locationId: formData.locationId,
      landmark: formData.landmark,
      city: formData.city,
      zipCode: Number(formData.zipCode),
      state: formData.state,
      country: formData.country,
      mobileNumber: Number(formData.mobile),
      alternateContactNumber: Number(formData.alternateContact),
      email: formData.email,
      website: formData.website,

      businessCategoryId: Number(formData.businessCategoryId),

      invoiceSchemeForPosId: Number(formData.invoiceSchemePOS),
      invoiceSchemeForSaleId: Number(formData.invoiceSchemeSale),
      invoiceLayoutForPosId: Number(formData.invoiceLayoutPOS),
      invoiceLayoutForSaleId: Number(formData.invoiceLayoutSale),

      defaultSellingPriceGroupId: Number(formData.defaultSellingPriceGroup),

      customField1: formData.customField1,
      customField2: formData.customField2,
      customField3: formData.customField3,
      customField4: formData.customField4,

      featuredProducts: formData.posFeaturedProducts,

      // 🔥 IMPORTANT — Store payment options as JSON
      defaultPaymentAccount: JSON.stringify(
        paymentOptions.map((p) => ({
          paymentMethodId: p.paymentMethodId,
          enabled: p.enabled,
          defaultAccountId: p.defaultAccountId || null,
        }))
      ),

      isActive: 1,
    };

    const method = modalType === "edit" ? "PUT" : "POST";
    const url =
      modalType === "edit"
        ? `${process.env.REACT_APP_BASE_URL}/business-locations/update/${currentLocation.id}`
        : `${process.env.REACT_APP_BASE_URL}/business-locations/save`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Save failed");
        return res.json();
      })
      .then(() => {
        fetchBusinessLocations();
        closeModal();
        toast.success(
          `Business location ${
            modalType === "edit" ? "updated" : "added"
          } successfully!`
        );
      })
      .catch((error) => {
        console.error("Error saving business location:", error);
        toast.error("Failed to save business location");
      });
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setCurrentLocation(null);
    setFormData({
      name: "",
      locationId: "",
      landmark: "",
      city: "",
      zipCode: "",
      state: "",
      country: "",
      mobile: "",
      businessCategoryId: "",
      alternateContact: "",
      email: "",
      website: "",
      invoiceSchemePOS: "",
      invoiceSchemeSale: "",
      invoiceLayoutPOS: "",
      invoiceLayoutSale: "",
      defaultSellingPriceGroup: "",
      customField1: "",
      customField2: "",
      customField3: "",
      customField4: "",
      posFeaturedProducts: "",
    });
    // Reset product search states
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedProducts([]);
    setSelectedProductNames("");

    // Reset payment options
    setPaymentOptions(
      paymentOptions.map((option) => ({
        ...option,
        enabled: false,
        defaultAccount: "None",
      }))
    );
  };

  const handleEdit = (id) => {
    const locationToEdit = businessLocations.find(
      (location) => location.id === id
    );

    if (!locationToEdit) return;

    setCurrentLocation(locationToEdit);

    setFormData({
      name: locationToEdit.name || "",
      locationId: locationToEdit.locationId || "",
      landmark: locationToEdit.landmark || "",
      city: locationToEdit.city || "",
      zipCode: locationToEdit.zipCode || "",
      state: locationToEdit.state || "",
      country: locationToEdit.country || "",
      mobile: locationToEdit.mobileNumber || "",
      businessCategoryId: locationToEdit.businessCategoryId || "",
      alternateContact: locationToEdit.alternateContactNumber || "",
      email: locationToEdit.email || "",
      website: locationToEdit.website || "",

      invoiceSchemePOS: locationToEdit.invoiceSchemeForPosId || "",
      invoiceSchemeSale: locationToEdit.invoiceSchemeForSaleId || "",
      invoiceLayoutPOS: locationToEdit.invoiceLayoutForPosId || "",
      invoiceLayoutSale: locationToEdit.invoiceLayoutForSaleId || "",

      defaultSellingPriceGroup: locationToEdit.defaultSellingPriceGroupId || "",

      customField1: locationToEdit.customField1 || "",
      customField2: locationToEdit.customField2 || "",
      customField3: locationToEdit.customField3 || "",
      customField4: locationToEdit.customField4 || "",

      // ✅ Keep JSON as-is
      posFeaturedProducts: locationToEdit.featuredProducts || "[]",
    });

    /* ================================
     ✅ PRESELECT FEATURED PRODUCTS
     ================================ */
    if (locationToEdit.featuredProducts) {
      try {
        const parsedProducts = JSON.parse(locationToEdit.featuredProducts);

        setSelectedProducts(parsedProducts);

        setSelectedProductNames(parsedProducts.map((p) => p.name).join(", "));
      } catch (err) {
        console.error("Invalid featuredProducts JSON", err);
        setSelectedProducts([]);
        setSelectedProductNames("");
      }
    } else {
      setSelectedProducts([]);
      setSelectedProductNames("");
    }

    /* ================================
     ✅ PAYMENT OPTIONS
     ================================ */
    if (locationToEdit.defaultPaymentAccount) {
      const savedPayments = JSON.parse(locationToEdit.defaultPaymentAccount);

      setPaymentOptions((prev) =>
        prev.map((option) => {
          const saved = savedPayments.find(
            (p) => p.paymentMethodId === option.paymentMethodId
          );

          return saved
            ? {
                ...option,
                enabled: saved.enabled,
                defaultAccountId: saved.defaultAccountId,
              }
            : option;
        })
      );
    }

    setModalType("edit");
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    if (
      window.confirm("Are you sure you want to delete this business location?")
    ) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/business-locations/delete/${id}`,
        {
          method: "DELETE",
        }
      )
        .then((response) => {
          if (response.ok) {
            fetchBusinessLocations();
            toast.success("Business location deleted successfully!");
          } else {
            toast.error("Failed to delete business location.");
          }
        })
        .catch((error) =>
          console.error("Error deleting business location:", error)
        );
    }
  };

  const exportCSV = () => {
    const csvData = filteredLocations.map((location) => ({
      Name: location.name,
      "Location ID": location.locationId,
      Landmark: location.landmark,
      City: location.city,
      "Zip Code": location.zipCode,
      State: location.state,
      Country: location.country,
      Mobile: location.mobileNumber,
      businessCategoryId: location.businessCategoryId,
      "Alternate Contact": location.alternateContactNumber,
      Email: location.email,
      Website: location.website,
      "Invoice Scheme POS": location.invoiceSchemePOS,
      "Invoice Scheme Sale": location.invoiceSchemeSale,
      "Invoice Layout POS": location.invoiceLayoutPOS,
      "Invoice Layout Sale": location.invoiceLayoutSale,
      "Default Selling Price Group": location.defaultSellingPriceGroup,
    }));

    const csv = [
      Object.keys(csvData[0] || {}),
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "business_locations.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredLocations.map((location) => ({
        Name: location.name,
        "Location ID": location.locationId,
        Landmark: location.landmark,
        City: location.city,
        "Zip Code": location.zipCode,
        State: location.state,
        Country: location.country,
        Mobile: location.mobileNumber,
        businessCategoryId: location.businessCategoryId,
        "Alternate Contact": location.alternateContactNumber,
        Email: location.email,
        Website: location.website,
        "Invoice Scheme POS": location.invoiceSchemePOS,
        "Invoice Scheme Sale": location.invoiceSchemeSale,
        "Invoice Layout POS": location.invoiceLayoutPOS,
        "Invoice Layout Sale": location.invoiceLayoutSale,
        "Default Selling Price Group": location.defaultSellingPriceGroup,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Business Locations");
    XLSX.writeFile(wb, "business_locations.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        ["Name", "Location ID", "City", "State", "Country", "Mobile", "Email"],
      ],
      body: filteredLocations.map((location) => [
        location.name,
        location.locationId,
        location.city,
        location.state,
        location.country,
        location.mobile,
        location.email,
      ]),
    });
    doc.save("business_locations.pdf");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            <div className="col-sm-6">
              <h1>Business Locations</h1>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {/* Filter Card */}
            <div className="card card-default rounded-4 border-0 cardHover mb-3">
              <div
                className="my- p-3 d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className={`fa fa-filter me-3`}></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row py-2 g-2">
                      {/* Country Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">Country:</label>
                          <select
                            className="form-select"
                            name="country"
                            value={activeFilters.country}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Countries</option>
                            {filterValues.countries.map((country, index) => (
                              <option key={`country-${index}`} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* State Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">State:</label>
                          <select
                            className="form-select"
                            name="state"
                            value={activeFilters.state}
                            onChange={handleFilterChange}
                          >
                            <option value="">All States</option>
                            {filterValues.states.map((state, index) => (
                              <option key={`state-${index}`} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* City Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">City:</label>
                          <select
                            className="form-select"
                            name="city"
                            value={activeFilters.city}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Cities</option>
                            {filterValues.cities.map((city, index) => (
                              <option key={`city-${index}`} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-12 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetFilters();
                          }}
                          disabled={!Object.values(activeFilters).some(Boolean)}
                        >
                          <i className="fa fa-times me-1"></i> Reset All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="card cardHover rounded-4 ">
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-add"
                  onClick={() => {
                    setModalType("add");
                    setModalVisible(true);
                  }}
                >
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-2">
                  <div className="row mb-3 d-flex align-items-center">
                    <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                      <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                        Show
                      </label>
                      <select
                        id="entriesPerPage"
                        className="form-control form-control-sm mr-2"
                        value={entriesPerPage}
                        onChange={(e) => {
                          setEntriesPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={75}>75</option>
                        <option value={100}>100</option>
                      </select>
                      Entries
                    </div>

                    <div className="col d-flex flex-wrap align-items-center">
                      <button
                        onClick={exportCSV}
                        className="btn Export-Btn mt-2 mb-2 mr-2"
                      >
                        <i className="fa fa-file-csv"></i> Export CSV
                      </button>

                      <button
                        onClick={exportExcel}
                        className="btn Export-Btn mt-2 mb-2 mr-2"
                      >
                        <i className="fa fa-file-excel"></i> Export Excel
                      </button>

                      <button
                        onClick={printData}
                        className="btn Export-Btn mt-2 mb-2 mr-2"
                      >
                        <i className="fa fa-print"></i> Print
                      </button>

                      <button
                        onClick={exportPDF}
                        className="btn Export-Btn mt-2 mb-2 mr-2"
                      >
                        <i className="fa fa-file-pdf"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <div id="table-container" style={{ overflowX: "auto" }}>
                      <table
                        id="example1"
                        className="table table-bordered table-hover shadow"
                      >
                        <thead>
                          <tr>
                            {columnsVisibility.Name && <th>Name</th>}
                            {columnsVisibility.LocationID && (
                              <th>Location ID</th>
                            )}
                            {columnsVisibility.City && <th>City</th>}
                            {columnsVisibility.State && <th>State</th>}
                            {columnsVisibility.Country && <th>Country</th>}
                            {columnsVisibility.Mobile && <th>Mobile</th>}
                            {columnsVisibility.Email && <th>Email</th>}
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLocations
                            .slice(
                              (currentPage - 1) * entriesPerPage,
                              currentPage * entriesPerPage
                            )
                            .map((location) => (
                              <tr key={location.id}>
                                {columnsVisibility.Name && (
                                  <td>{location.name}</td>
                                )}
                                {columnsVisibility.LocationID && (
                                  <td>{location.locationId}</td>
                                )}
                                {columnsVisibility.City && (
                                  <td>{location.city}</td>
                                )}
                                {columnsVisibility.State && (
                                  <td>{location.state}</td>
                                )}
                                {columnsVisibility.Country && (
                                  <td>{location.country}</td>
                                )}
                                {columnsVisibility.Mobile && (
                                  <td>{location.mobileNumber}</td>
                                )}
                                {columnsVisibility.Email && (
                                  <td>{location.email}</td>
                                )}
                                <td>
                                  <button
                                    className="btn btn-edit btn-sm mr-2"
                                    onClick={() => handleEdit(location.id)}
                                  >
                                    <i className="fas fa-edit"></i> Edit
                                  </button>
                                  <button
                                    className="btn btn-delete btn-sm"
                                    onClick={() => handleDelete(location.id)}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal for adding/editing business locations */}
            {modalVisible && (
              <div
                className="modal fade show"
                style={{ display: "block" }}
                id="locationModal"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="locationModalLabel"
                aria-hidden="true"
              >
                <div className="modal-dialog modal-lg" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title" id="locationModalLabel">
                        {modalType === "edit"
                          ? "Edit Business Location"
                          : "Add a new business location"}
                      </h5>
                      <button
                        type="button"
                        className="close"
                        onClick={closeModal}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="row">
                        {/* Left Column */}
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="name">Name:*</label>
                            <input
                              type="text"
                              id="name"
                              className="form-control"
                              value={formData.name}
                              onChange={handleFormChange}
                              placeholder="Name"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="locationId">Location ID:</label>
                            <input
                              type="text"
                              id="locationId"
                              className="form-control"
                              value={formData.locationId}
                              onChange={handleFormChange}
                              placeholder="Location ID"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="landmark">Landmark:</label>
                            <input
                              type="text"
                              id="landmark"
                              className="form-control"
                              value={formData.landmark}
                              onChange={handleFormChange}
                              placeholder="Landmark"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="city">City:*</label>
                            <input
                              type="text"
                              id="city"
                              className="form-control"
                              value={formData.city}
                              onChange={handleFormChange}
                              placeholder="City"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="zipCode">Zip Code:*</label>
                            <input
                              type="text"
                              id="zipCode"
                              className="form-control"
                              value={formData.zipCode}
                              onChange={handleFormChange}
                              placeholder="Zip Code"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="state">State:*</label>
                            <input
                              type="text"
                              id="state"
                              className="form-control"
                              value={formData.state}
                              onChange={handleFormChange}
                              placeholder="State"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="country">Country:*</label>
                            <input
                              type="text"
                              id="country"
                              className="form-control"
                              value={formData.country}
                              onChange={handleFormChange}
                              placeholder="Country"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="mobile">Mobile:</label>
                            <input
                              type="text"
                              id="mobile"
                              className="form-control"
                              value={formData.mobile}
                              onChange={handleFormChange}
                              placeholder="Mobile"
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="alternateContact">
                              Alternate contact number:
                            </label>
                            <input
                              type="text"
                              id="alternateContact"
                              className="form-control"
                              value={formData.alternateContact}
                              onChange={handleFormChange}
                              placeholder="Alternate contact number"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input
                              type="email"
                              id="email"
                              className="form-control"
                              value={formData.email}
                              onChange={handleFormChange}
                              placeholder="Email"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="website">Website:</label>
                            <input
                              type="text"
                              id="website"
                              className="form-control"
                              value={formData.website}
                              onChange={handleFormChange}
                              placeholder="Website"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="invoiceSchemePOS">
                              Invoice scheme for POS:*
                            </label>
                            <select
                              id="invoiceSchemePOS"
                              className="form-control"
                              value={formData.invoiceSchemePOS}
                              onChange={handleFormChange}
                            >
                              {invoiceSchemes.map((scheme) => (
                                <option key={scheme.id} value={scheme.id}>
                                  {scheme.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="invoiceSchemeSale">
                              Invoice scheme for sale:*
                            </label>
                            <select
                              id="invoiceSchemeSale"
                              className="form-control"
                              value={formData.invoiceSchemeSale}
                              onChange={handleFormChange}
                            >
                              {invoiceSchemes.map((scheme) => (
                                <option key={scheme.id} value={scheme.id}>
                                  {scheme.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="invoiceLayoutPOS">
                              Invoice layout for POS:*
                            </label>
                            <select
                              id="invoiceLayoutPOS"
                              className="form-control"
                              value={formData.invoiceLayoutPOS}
                              onChange={handleFormChange}
                            >
                              {invoiceLayouts.map((layout) => (
                                <option key={layout.id} value={layout.id}>
                                  {layout.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="invoiceLayoutSale">
                              Invoice layout for sale:*
                            </label>
                            <select
                              id="invoiceLayoutSale"
                              className="form-control"
                              value={formData.invoiceLayoutSale}
                              onChange={handleFormChange}
                            >
                              {invoiceLayouts.map((layout) => (
                                <option key={layout.id} value={layout.id}>
                                  {layout.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="businessCategoryId">
                              Business Location Category:
                            </label>

                            <select
                              id="businessCategoryId"
                              className="form-control"
                              value={formData.businessCategoryId}
                              onChange={handleFormChange}
                              required
                            >
                              <option value="">Select Business Category</option>

                              {businessCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name} ({category.locationId})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Additional Fields */}
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="defaultSellingPriceGroup">
                              Default Selling Price Group:
                            </label>
                            <select
                              id="defaultSellingPriceGroup"
                              className="form-control"
                              value={formData.defaultSellingPriceGroup}
                              onChange={handleFormChange}
                            >
                              {sellingPriceGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Custom Fields */}
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="customField1">
                              Custom field 1:
                            </label>
                            <input
                              type="text"
                              id="customField1"
                              className="form-control"
                              value={formData.customField1}
                              onChange={handleFormChange}
                              placeholder="Custom field 1"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="customField2">
                              Custom field 2:
                            </label>
                            <input
                              type="text"
                              id="customField2"
                              className="form-control"
                              value={formData.customField2}
                              onChange={handleFormChange}
                              placeholder="Custom field 2"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="customField3">
                              Custom field 3:
                            </label>
                            <input
                              type="text"
                              id="customField3"
                              className="form-control"
                              value={formData.customField3}
                              onChange={handleFormChange}
                              placeholder="Custom field 3"
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="customField4">
                              Custom field 4:
                            </label>
                            <input
                              type="text"
                              id="customField4"
                              className="form-control"
                              value={formData.customField4}
                              onChange={handleFormChange}
                              placeholder="Custom field 4"
                            />
                          </div>
                        </div>
                      </div>

                      {/* POS Screen Featured Products Search */}
                      <div className="row mt-3">
                        <div className="col-md-12">
                          <div className="form-group">
                            <label htmlFor="posFeaturedProducts">
                              POS screen Featured Products:
                            </label>

                            {/* Selected Products Display */}
                            {selectedProducts.length > 0 && (
                              <div className="mb-3 p-2 border rounded bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <strong>Selected Products:</strong>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={clearSelectedProducts}
                                  >
                                    <i className="fas fa-times"></i> Clear All
                                  </button>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                  {selectedProducts.map((product) => (
                                    <div
                                      key={product.id}
                                      className="badge badge-primary p-2 d-flex align-items-center"
                                    >
                                      <span>{product.name}</span>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-link text-white ml-2 p-0"
                                        onClick={() =>
                                          handleProductRemove(product.id)
                                        }
                                        style={{ fontSize: "0.75rem" }}
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Search Input */}
                            <div className="position-relative">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Search products by name..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setShowSearchResults(true)}
                              />

                              {/* Search Results Dropdown */}
                              {showSearchResults &&
                                searchResults.length > 0 && (
                                  <div
                                    className="position-absolute w-100 border rounded bg-white shadow-lg"
                                    style={{
                                      zIndex: 1050,
                                      maxHeight: "200px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <ul className="list-group list-group-flush">
                                      {searchResults.map((product) => (
                                        <li
                                          key={product.id}
                                          className="list-group-item list-group-item-action"
                                          onClick={() =>
                                            handleProductSelect(product)
                                          }
                                          style={{ cursor: "pointer" }}
                                        >
                                          <div className="d-flex justify-content-between align-items-center">
                                            <span>{product.productName}</span>
                                            {product.sku && (
                                              <small className="text-muted">
                                                SKU: {product.sku}
                                              </small>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>

                            {/* No results message */}
                            {showSearchResults &&
                              searchQuery &&
                              searchResults.length === 0 && (
                                <div className="mt-2 text-muted">
                                  No products found. Try a different search
                                  term.
                                </div>
                              )}

                            {/* Instructions */}
                            <small className="form-text text-muted">
                              Search and select products to feature on the POS
                              screen. Selected products will be stored as
                              comma-separated IDs.
                            </small>
                          </div>
                        </div>
                      </div>

                      {/* Payment Options Table */}
                      <div className="mt-4">
                        <h6>Payment Options:</h6>

                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Payment Method</th>
                              <th>Enable</th>
                              <th>Default Account</th>
                            </tr>
                          </thead>

                          <tbody>
                            {paymentOptions.map((option, index) => (
                              <tr key={option.paymentMethodId}>
                                <td>{option.method}</td>

                                <td>
                                  <select
                                    className="form-control form-control-sm"
                                    value={option.enabled.toString()}
                                    onChange={(e) =>
                                      handlePaymentOptionChange(
                                        index,
                                        "enabled",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                  </select>
                                </td>

                                <td>
                                  <select
                                    className="form-control form-control-sm"
                                    value={option.defaultAccountId}
                                    onChange={(e) =>
                                      handlePaymentOptionChange(
                                        index,
                                        "defaultAccountId",
                                        e.target.value
                                      )
                                    }
                                    disabled={!option.enabled}
                                  >
                                    <option value="">Select Account</option>

                                    {paymentAccounts.map((account) => (
                                      <option
                                        key={account.id}
                                        value={account.id}
                                      >
                                        {account.accountName} (
                                        {account.accountType})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeModal}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveLocation}
                      >
                        Save and Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BusinessLocations;
