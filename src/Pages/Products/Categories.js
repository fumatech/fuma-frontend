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
import BackButton from "../../components/BackButton";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [flattenedCategories, setFlattenedCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: "",
    categoryCode: "",
    description: "",
    parentCategory: "",
  });

  // Pagination states
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column visibility state
  const [columnsVisibility, setColumnsVisibility] = useState({
    CategoryName: true,
    CategoryCode: true,
    Description: true,
    ParentCategory: true,
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    categoryNames: [],
    categoryCodes: [],
    parentCategories: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    categoryName: "",
    categoryCode: "",
    parentCategory: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setFlattenedCategories(flattenCategories(categories));
  }, [categories]);

  // Extract filter values when flattenedCategories changes
  useEffect(() => {
    if (flattenedCategories.length > 0) {
      const categoryNames = [
        ...new Set(flattenedCategories.map((item) => item.categoryName)),
      ].filter(Boolean);
      const categoryCodes = [
        ...new Set(flattenedCategories.map((item) => item.categoryCode)),
      ].filter(Boolean);
      const parentCategories = [
        ...new Set(flattenedCategories.map((item) => item.parentCategory)),
      ].filter(Boolean);

      setFilterValues({
        categoryNames,
        categoryCodes,
        parentCategories,
      });
    }
  }, [flattenedCategories]);

  // Apply filters whenever activeFilters or flattenedCategories changes
  useEffect(() => {
    const filteredData = flattenedCategories.filter((category) => {
      const categoryNameMatch =
        activeFilters.categoryName === "" ||
        category.categoryName === activeFilters.categoryName;
      const categoryCodeMatch =
        activeFilters.categoryCode === "" ||
        category.categoryCode === activeFilters.categoryCode;
      const parentCategoryMatch =
        activeFilters.parentCategory === "" ||
        category.parentCategory === activeFilters.parentCategory;

      return categoryNameMatch && categoryCodeMatch && parentCategoryMatch;
    });

    setFilteredCategories(filteredData);
  }, [activeFilters, flattenedCategories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/categories/getall`
      );
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      categoryName: "",
      categoryCode: "",
      parentCategory: "",
    });
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSaveCategory = () => {
    const dataToSend = {
      ...formData,
      parentCategory: formData.parentCategory
        ? { id: parseInt(formData.parentCategory, 10) }
        : null,
    };

    const method = modalType === "edit" ? "PUT" : "POST";
    const url =
      modalType === "edit"
        ? `${process.env.REACT_APP_BASE_URL}/categories/update/${currentCategory.id}`
        : `${process.env.REACT_APP_BASE_URL}/categories/save`;

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    })
      .then((response) => response.json())
      .then(() => {
        fetchCategories();
        closeModal();
        toast.success(
          `Category ${modalType === "edit" ? "updated" : "added"} successfully!`
        );
      })
      .catch((error) => {
        // console.error(
        //   `Error ${modalType === "edit" ? "updating" : "adding"} category:`,
        //   error
        // );
        toast.error(
          `Error ${modalType === "edit" ? "updating" : "adding"} category`
        );
      });
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setCurrentCategory(null);
    setFormData({
      categoryName: "",
      categoryCode: "",
      description: "",
      parentCategory: "",
    });
  };

  const handleEdit = (id) => {
    const categoryToEdit = flattenedCategories.find(
      (category) => category.id === id
    );

    if (categoryToEdit) {
      const finalCategoryName = categoryToEdit.categoryName.split("/").pop();
      setCurrentCategory(categoryToEdit);
      setFormData({
        categoryName: finalCategoryName,
        categoryCode: categoryToEdit.categoryCode,
        description: categoryToEdit.description,
        parentCategory:
          categoryToEdit.parentCategory === "None"
            ? ""
            : flattenedCategories.find(
              (cat) => cat.categoryName === categoryToEdit.parentCategory
            )?.id || "",
      });
      setModalType("edit");
      setModalVisible(true);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/categories/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.ok) {
            fetchCategories();
            toast.success("Category deleted successfully!");
          } else {
            toast.error("Failed to delete category.");
          }
        })
        .catch((error) => toast.error("Error deleting category:", error));
    }
  };

  const renderDropdownOptions = (excludeId) => {
    return flattenedCategories
      .filter((cat) => cat.id !== excludeId)
      .map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.categoryName}
        </option>
      ));
  };

  const exportCSV = () => {
    const csvData = filteredCategories.map(
      ({ categoryName, categoryCode, description, parentCategory }) => ({
        CategoryName: categoryName,
        CategoryCode: categoryCode,
        Description: description,
        ParentCategory: parentCategory || "None",
      })
    );

    const csv = [
      ["Category Name", "Category Code", "Description", "Parent Category"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "categories.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredCategories.map(
        ({ categoryName, categoryCode, description, parentCategory }) => ({
          CategoryName: categoryName,
          CategoryCode: categoryCode,
          Description: description,
          ParentCategory: parentCategory || "None",
        })
      )
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "categories.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        ["Category Name", "Category Code", "Description", "Parent Category"],
      ],
      body: filteredCategories.map(
        ({ categoryName, categoryCode, description, parentCategory }) => [
          categoryName,
          categoryCode,
          description,
          parentCategory || "None",
        ]
      ),
    });
    doc.save("categories.pdf");
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
            <div className="col-sm-6 d-flex align-items-center">
              <BackButton />
              <h1>Categories</h1>
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
                      {/* Category Name Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">Category Name:</label>
                          <select
                            className="form-select"
                            name="categoryName"
                            value={activeFilters.categoryName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Categories</option>
                            {filterValues.categoryNames.map((name, index) => (
                              <option key={`name-${index}`} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Category Code Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">Category Code:</label>
                          <select
                            className="form-select"
                            name="categoryCode"
                            value={activeFilters.categoryCode}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Codes</option>
                            {filterValues.categoryCodes.map((code, index) => (
                              <option key={`code-${index}`} value={code}>
                                {code}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Parent Category Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">Parent Category:</label>
                          <select
                            className="form-select"
                            name="parentCategory"
                            value={activeFilters.parentCategory}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Parents</option>
                            {filterValues.parentCategories.map(
                              (parent, index) => (
                                <option key={`parent-${index}`} value={parent}>
                                  {parent}
                                </option>
                              )
                            )}
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
                        {" "}
                        <thead>
                          <tr>
                            {columnsVisibility.CategoryName && (
                              <th>Category Name</th>
                            )}
                            {columnsVisibility.CategoryCode && (
                              <th>Category Code</th>
                            )}
                            {columnsVisibility.Description && (
                              <th>Description</th>
                            )}
                            {columnsVisibility.ParentCategory && (
                              <th>Parent Category</th>
                            )}
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCategories
                            .slice(
                              (currentPage - 1) * entriesPerPage,
                              currentPage * entriesPerPage
                            )
                            .map((cat) => (
                              <tr key={cat.id}>
                                {columnsVisibility.CategoryName && (
                                  <td
                                    className="text-center"
                                    style={{
                                      paddingLeft: `${(cat.categoryName.split("/").length -
                                        1) *
                                        20
                                        }px`,
                                    }}
                                  >
                                    {cat.categoryName}
                                  </td>
                                )}
                                {columnsVisibility.CategoryCode && (
                                  <td>{cat.categoryCode}</td>
                                )}
                                {columnsVisibility.Description && (
                                  <td>{cat.description}</td>
                                )}
                                {columnsVisibility.ParentCategory && (
                                  <td
                                    className="text-center"
                                    style={{
                                      paddingLeft: `${(cat.categoryName.split("/").length -
                                        1) *
                                        20
                                        }px`,
                                    }}
                                  >
                                    {cat.parentCategory}
                                  </td>
                                )}
                                <td>
                                  <button
                                    className="btn btn-edit btn-sm mr-2"
                                    onClick={() => handleEdit(cat.id)}
                                  >
                                    <i className="fas fa-edit"></i> Edit
                                  </button>
                                  <button
                                    className="btn btn-delete btn-sm"
                                    onClick={() => handleDelete(cat.id)}
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

            {/* Modal for adding/editing categories */}
            {modalVisible && (
              <div
                className="modal fade show"
                style={{ display: "block" }}
                id="categoryModal"
                tabIndex="-1"
                role="dialog"
                aria-labelledby="categoryModalLabel"
                aria-hidden="true"
              >
                <div className="modal-dialog" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title" id="categoryModalLabel">
                        {modalType === "edit"
                          ? "Edit Category"
                          : "Add Category"}
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
                      <div className="form-group">
                        <label htmlFor="categoryName">Category Name</label>
                        <input
                          type="text"
                          id="categoryName"
                          className="form-control"
                          value={formData.categoryName}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="categoryCode">Category Code</label>
                        <input
                          type="text"
                          id="categoryCode"
                          className="form-control"
                          value={formData.categoryCode}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                          id="description"
                          className="form-control"
                          value={formData.description}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="parentCategory">Parent Category</label>
                        <select
                          id="parentCategory"
                          className="form-control"
                          value={formData.parentCategory}
                          onChange={handleFormChange}
                        >
                          <option value="Null">None</option>
                          {renderDropdownOptions(currentCategory?.id)}
                        </select>
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
                        onClick={handleSaveCategory}
                      >
                        Save changes
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

export default Categories;
