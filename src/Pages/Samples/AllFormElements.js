import React, { useState, useRef, useEffect } from "react";

import axios from "axios";
import { Dropdown } from "react-bootstrap";
import Select from "react-select";
import $ from "jquery";
import bsCustomFileInput from "bs-custom-file-input";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "select2/dist/css/select2.min.css";
import "select2";

function AllFormElements() {
  const formRef = useRef(null);
  const [saleDate, setSaleDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [weight, setWeight] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [enableProductDescription, setEnableProductDescription] =
    useState(false);
  const [notForSelling, setNotForSelling] = useState(false);
  const [disableWoocommerceSync, setDisableWoocommerceSync] = useState(false);
  const [applicationTax, setApplicationTax] = useState("");
  const [sellingPriceTax, setSellingPriceTax] = useState("");
  const [productType, setProductType] = useState("");
  const [defaultPurchasePrice, setDefaultPurchasePrice] = useState("");
  const [defaultSellingPrice, setDefaultSellingPrice] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileSizeInMB = file.size / (1024 * 1024); // Convert bytes to MB

      if (fileSizeInMB > 5) {
        alert("File size should be 5MB or less.");
        e.target.value = ""; // Clear the input field
        setProductImage(null); // Clear the state if file size is too large
      } else {
        setProductImage(file); // Use the file directly if size is within the limit
      }
    } else {
      setProductImage(null);
    }
  };

  useEffect(() => {
    $(function () {
      bsCustomFileInput.init();

      $(".select2").select2();

      return () => {
        $(".select2").select2("destroy"); // Cleanup on unmount
      };
    });
  }, []);

  const handleSubmit = async (e) => {
    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("sku", sku);
    formData.append("barcodeType", barcode);
    formData.append("unit", unit);
    formData.append("brand", brand);
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("businessLocations", businessLocation);
    formData.append("weight", weight);
    formData.append("prepareTime", prepTime);
    formData.append("manageStock", enableProductDescription);
    formData.append("productDescription", description);
    formData.append("isInactive", enableProductDescription);
    formData.append("notForSelling", notForSelling);
    formData.append("disableWoocommerce", disableWoocommerceSync);
    formData.append("tax", applicationTax);
    formData.append("taxType", sellingPriceTax);
    formData.append("productType", productType);
    formData.append("excludingTax", defaultPurchasePrice);
    formData.append("includingTax", defaultSellingPrice);
    formData.append("margin", profitMargin);
    formData.append("sellingPrice", defaultSellingPrice);

    if (productImage) {
      // console.log("Appending image file:", productImage);
      formData.append("productImage", productImage);
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/vendor/save",
        formData,

        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("product saved", response.data);
      formRef.current.reset();
      setImageUrl(
        response.data.productImage
          ? `data:image/png;base64,${response.data.productImage}`
          : ""
      );
    } catch (error) {
      console.error(
        "Error saving product:",
        error.response ? error.response.data : error.message
      );
    }
  };

  // const handleSave = (event) => {
  //   event.preventDefault(); // Prevent the default form submission

  //   // Clear all form fields in the main form
  //   document
  //     .querySelectorAll('input[type="text"], input[type="number"], textarea')
  //     .forEach((input) => (input.value = ""));
  //   document
  //     .querySelectorAll("select")
  //     .forEach((select) => (select.value = ""));
  //   document
  //     .querySelectorAll('input[type="checkbox"]')
  //     .forEach((checkbox) => (checkbox.checked = false));

  //   // Display success alert
  //   alert("Product added successfully");
  // };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrorMessage("File size exceeds 5MB");
        setFile(null);
      } else {
        setErrorMessage("");
        setFile(selectedFile);
        // Simulate upload progress
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10; // Simulate progress
          });
        }, 100);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setErrorMessage("");
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading ">All Form Elements</h1>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid">
              <form ref={formRef} onSubmit={handleSubmit}>
                {/* old input fields */}
                {/* <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row d-flex align-items-center justify-content-center">
                      
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="productName">
                            Simple Text <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="Text"
                            name="Text"
                            placeholder="Enter here.."
                            required
                          />
                        </div>
                      </div>

                      
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="sku">
                            Email address<span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control rounded"
                            id="email"
                            name="email"
                            placeholder="Enter here..."
                            required
                          />
                        </div>
                      </div>
                     
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="password">
                            Password<span className="text-danger">*</span>
                          </label>
                          <input
                            type="Password"
                            className="form-control rounded"
                            id="password"
                            name="password"
                            placeholder="Password"
                            required
                          />
                        </div>
                      </div>

                   
                      <div className="col-md-4 ">
                        <div className="dropdown ">
                          <div className="">
                            <label className="me-2 d-md-inline">
                              Only Dropdown
                            </label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-control me-2 rounded"
                                id="dropdown"
                                name="dropdown"
                                type="text"
                                required
                                value={Dropdown}
                                onChange={(e) => setBarcode(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                <option value="1">Pieces (Pc(s))</option>
                                <option value="2">Packets (packets)</option>
                                <option value="3">Grams (g)</option>
                                <option value="15">12152 (115)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">
                              Dropdown with add button
                            </label>

                            <div className="d-flex align-items-center">
                              <span className="input_group_addon  bg-transparent border-right-0  rounded-start ">
                                <i className="fa-solid fa-user-large text-dark"></i>
                              </span>
                              <select
                                className="form-control me-2 rounded-right"
                                id="brand"
                                name="brand"
                                type="text"
                                required
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                <option value="1">Brand A</option>
                                <option value="2">Brand B</option>
                                <option value="3">Brand C</option>
                                <option value="4">Brand D</option>
                              </select>
                              <span className="">
                                <button
                                  type="button"
                                  className="btn btn-light border"
                                  data-bs-toggle="modal"
                                  data-bs-target="#addBrandModal"
                                  title="Add Brand"
                                >
                                  <i className="fa fa-plus-circle text-primary fa-lg"></i>
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                   
                      <div className="col-md-4 ">
                        <div className="form-group d-flex flex-row  flex-md-column ">
                          <label htmlFor="transaction_date"> Date:*</label>
                          <DatePicker
                            selected={saleDate}
                            onChange={(date) => setSaleDate(date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                          />
                        </div>
                      </div>

                 
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="shippingCharges">
                            (+) only number with increase option{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded"
                            id="shippingCharges"
                            name="shippingCharges"
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>

                    
                      <div className="col-md-4">
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

                      <div className="col-md-4 col-sm-6">
                        <div className="form-group">
                          <label htmlFor="recur_interval">
                            Custom interval:*
                          </label>
                          <div className="input-group">
                            <input
                              className="form-control rounded-start"
                              style={{ width: "50%", zIndex: 0 }}
                              name="recur_interval"
                              type="number"
                              id="recur_interval"
                            />
                            <select
                              className="form-control rounded-end"
                              style={{ width: "50%", zIndex: 0 }}
                              id="custom_interval_type"
                              name="custom_interval_type"
                            >
                              <option value="days">Days</option>
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                            </select>
                          </div>
                        </div>
                      </div>

                    
                      <div className="form-group col-4">
                        <label htmlFor="exampleInputFile">File input</label>
                        <div className="input-group">
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="exampleInputFile"
                            />
                            <label
                              className="custom-file-label"
                              htmlFor="exampleInputFile"
                            >
                              Choose file
                            </label>
                          </div>
                          <div className="input-group-append">
                            <span className="input-group-text">Upload</span>
                          </div>
                        </div>
                      </div>

                     
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label htmlFor="image">Attach document:</label>
                          <div className="file-input file-input-new ">
                            <div className="file-preview ">
                           
                            </div>

                            <div className="input-group">
                              <div className="form-control file-caption kv-fileinput-caption ro">
                                <div className="file-caption-name">
                                  {file ? file.name : "No file selected"}
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
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="productName">
                            <input className="mx-2" type="checkbox" checked />
                            Custom size<span className="text-danger">*</span>
                          </label>
                          <div className="d-flex align-items-center">
                            <div className="custom-size-textsize rounded-start">
                              {" "}
                              <b>size</b>{" "}
                            </div>
                            <input
                              type="text"
                              className="form-control border-left-0 rounded-end"
                              id="CustomSize"
                              name="CustomSize"
                              placeholder="Custom Size"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}

                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row d-flex align-items-center justify-content-center">
                      {/* simple input */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="productName">
                            Simple Text <span className="text-danger">*</span>
                          </label>
                          <div className="input-group ">
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-transparent">
                                <i class="fa-solid fa-user" />
                              </span>
                            </div>
                            <input
                              type="text"
                              className="form-control rounded-right"
                              id="Text"
                              name="Text"
                              placeholder="Enter here.."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* email */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="sku">
                            Email address<span className="text-danger">*</span>
                          </label>
                          <div className="input-group ">
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-transparent">
                                <i className="fas fa-envelope " />
                              </span>
                            </div>
                            <input
                              type="email"
                              className="form-control rounded-right"
                              id="email"
                              name="email"
                              placeholder="Enter here..."
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* password */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="password">
                            Password<span className="text-danger">*</span>
                          </label>
                          <div className="input-group ">
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-transparent">
                                <i class="fa-solid fa-lock"></i>
                              </span>
                            </div>
                            <input
                              type="Password"
                              className="form-control rounded-right"
                              id="password"
                              name="password"
                              placeholder="Password"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      {/* number */}
                      <div className="col-md-4">
                        <div className="number form-group m-0 mb-2">
                          <label htmlFor="number ">
                            Number<span className="text-danger">*</span>
                          </label>
                          <div className="input-group ">
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-transparent">
                                <i class="fa-solid fa-user"></i>
                              </span>
                            </div>
                            <input
                              type="number"
                              className="form-control rounded-right"
                              id="number"
                              name="number"
                              placeholder="Number"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* only number with increase option */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="increaseOptionNumber">
                            (+) only number with increase option{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control rounded"
                            id="increaseOptionNumber"
                            name="increaseOptionNumber"
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>

                      {/*  Date */}
                      <div className="col-md-4 ">
                        <div className="form-group d-flex flex-row  flex-md-column ">
                          <label htmlFor="transaction_date  ">
                            {" "}
                            Date:<span className="text-danger">*</span>
                          </label>

                          <DatePicker
                            selected={saleDate}
                            onChange={(date) => setSaleDate(date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                          />
                        </div>
                      </div>

                      {/* only dropdown */}
                      <div className="col-md-4 ">
                        <div className="dropdown mt-2 ">
                          <label className=" d-md-inline mb-2 fw-5 ">
                            Only Dropdown
                          </label>
                          <div className="d-flex align-items-center">
                            <div className="input-group mb-2">
                              <div className="input-group-prepend">
                                <span className="input-group-text bg-transparent">
                                  <i className="fa-solid fa-user" />
                                </span>
                              </div>
                              <select
                                className="form-control  rounded-right"
                                id="dropdown"
                                name="dropdown"
                                type="text"
                                required
                                value={Dropdown}
                                onChange={(e) => setBarcode(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                <option value="1">Pieces (Pc(s))</option>
                                <option value="2">Packets (packets)</option>
                                <option value="3">Grams (g)</option>
                                <option value="15">12152 (115)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* dropdown with add button */}
                      <div className="col-md-4">
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline ">
                              Dropdown with add button
                            </label>

                            <div className="d-flex align-items-center">
                              <span className="input_group_addon  bg-transparent border-right-0  rounded-start ">
                                <i className="fa-solid fa-user-large text-dark"></i>
                              </span>
                              <select
                                className="form-control me-2 rounded-right"
                                id="brand"
                                name="brand"
                                type="text"
                                required
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                              >
                                <option value="">Please Select</option>
                                <option value="1">Brand A</option>
                                <option value="2">Brand B</option>
                                <option value="3">Brand C</option>
                                <option value="4">Brand D</option>
                              </select>
                              <span className="">
                                <button
                                  type="button"
                                  className="btn btn-light border"
                                  data-bs-toggle="modal"
                                  data-bs-target="#addBrandModal"
                                  title="Add Brand"
                                >
                                  <i className="fa fa-plus-circle text-primary fa-lg"></i>
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* dropdown with search */}
                      <div className="form-group col-lg-4">
                        <label className="m-0 mt-2">
                          Drop down with search
                        </label>
                        <select
                          className="select2"
                          multiple="multiple"
                          data-placeholder="please Select"
                          style={{ width: "100%" }}
                        >
                          <option>Alabama</option>
                          <option>Alaska</option>
                          <option>California</option>
                          <option>Delaware</option>
                          <option>Tennessee</option>
                          <option>Texas</option>
                          <option>Washington</option>
                        </select>
                      </div>

                      {/* Custom interval */}
                      <div className="col-md-4 col-sm-6">
                        <div className="form-group">
                          <label htmlFor="recur_interval">
                            Custom interval:*
                          </label>
                          <div className="input-group">
                            <input
                              className="form-control rounded-start"
                              style={{ width: "50%", zIndex: 0 }}
                              name="recur_interval"
                              type="number"
                              id="recur_interval"
                            />
                            <select
                              className="form-control rounded-end"
                              style={{ width: "50%", zIndex: 0 }}
                              id="custom_interval_type"
                              name="custom_interval_type"
                            >
                              <option value="days">Days</option>
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="col-md-4">
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

                      {/* file input */}
                      <div className="form-group col-4">
                        <label htmlFor="exampleInputFile">File input</label>
                        <div className="input-group">
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="exampleInputFile"
                            />
                            <label
                              className="custom-file-label"
                              htmlFor="exampleInputFile"
                            >
                              Choose file
                            </label>
                          </div>
                          <div className="input-group-append">
                            <span className="input-group-text">Upload</span>
                          </div>
                        </div>
                      </div>

                      {/* Attach document */}
                      <div className="col-12 col-md-4">
                        <div className="form-group">
                          <label htmlFor="image">Attach document:</label>
                          <div className="file-input file-input-new ">
                            <div className="file-preview ">
                              {/* {file ? (
                                <>
                                
                                 
                               
                                </>
                              ) : ( 
                                <div className="file-drop-disabled">
                                  <div className="file-preview-status text-center text-danger">
                                    {errorMessage}
                                  </div>
                                </div>
                              )} */}
                            </div>

                            <div className="input-group">
                              <div className="form-control file-caption kv-fileinput-caption rounded">
                                <div className="file-caption-name ">
                                  {file ? file.name : "No file selected"}
                                </div>
                              </div>
                              <div className="input-group-append">
                                <div className="btn btn-primary btn-file rounded-0 py-1 px-2 ms-2">
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/*diffrent inputs  */}
                <div className="wrapper pt-5">
                  <div className="">
                    <div className="container-fluid">
                      <div className="card card-default rounded-4 border-0 cardHover">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="card card-danger">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    Input masks
                                  </h3>
                                </div>
                                <div className="card-body">
                                  {/* Date dd/mm/yyyy */}
                                  <div className="form-group">
                                    <label>Date masks:</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="far fa-calendar-alt" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        data-inputmask-alias="datetime"
                                        data-inputmask-inputformat="dd/mm/yyyy"
                                        data-mask
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* Date mm/dd/yyyy */}
                                  <div className="form-group">
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="far fa-calendar-alt" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        data-inputmask-alias="datetime"
                                        data-inputmask-inputformat="mm/dd/yyyy"
                                        data-mask
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* phone mask */}
                                  <div className="form-group">
                                    <label>US phone mask:</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="fas fa-phone" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        data-inputmask='"mask": "(999) 999-9999"'
                                        data-mask
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* phone mask */}
                                  <div className="form-group">
                                    <label>Intl US phone mask:</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="fas fa-phone" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        data-inputmask="'mask': ['999-999-9999 [x99999]', '+099 99 99 9999[9]-9999']"
                                        data-mask
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* IP mask */}
                                  <div className="form-group">
                                    <label>IP mask:</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="fas fa-laptop" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        data-inputmask="'alias': 'ip'"
                                        data-mask
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                </div>
                                {/* /.card-body */}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="card card-primary">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    Date picker
                                  </h3>
                                </div>
                                <div className="card-body">
                                  {/* Date */}
                                  <div className="form-group">
                                    <label>Date:</label>
                                    <div
                                      className="input-group date"
                                      id="reservationdate"
                                      data-target-input="nearest"
                                    >
                                      <input
                                        type="text"
                                        className="form-control datetimepicker-input"
                                        data-target="#reservationdate"
                                      />
                                      <div
                                        className="input-group-append"
                                        data-target="#reservationdate"
                                        data-toggle="datetimepicker"
                                      >
                                        <div className="input-group-text">
                                          <i className="fa fa-calendar" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Date and time */}
                                  <div className="form-group">
                                    <label>Date and time:</label>
                                    <div
                                      className="input-group date"
                                      id="reservationdatetime"
                                      data-target-input="nearest"
                                    >
                                      <input
                                        type="text"
                                        className="form-control datetimepicker-input"
                                        data-target="#reservationdatetime"
                                      />
                                      <div
                                        className="input-group-append"
                                        data-target="#reservationdatetime"
                                        data-toggle="datetimepicker"
                                      >
                                        <div className="input-group-text">
                                          <i className="fa fa-calendar" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* /.form group */}
                                  {/* Date range */}
                                  <div className="form-group">
                                    <label>Date range:</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="far fa-calendar-alt" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control float-right"
                                        id="reservation"
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* Date and time range */}
                                  <div className="form-group">
                                    <label>Date and time range:</label>
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <i className="far fa-clock" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control float-right"
                                        id="reservationtime"
                                      />
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* Date and time range */}
                                  <div className="form-group">
                                    <label>Date range button:</label>
                                    <div className="input-group">
                                      <button
                                        type="button"
                                        className="btn btn-default float-right"
                                        id="daterange-btn"
                                      >
                                        <i className="far fa-calendar-alt" />{" "}
                                        Date range picker
                                        <i className="fas fa-caret-down" />
                                      </button>
                                    </div>
                                  </div>
                                  {/* /.form group */}
                                </div>

                                {/* /.card-body */}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="card card-info">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    Color &amp; Time Picker
                                  </h3>
                                </div>
                                <div className="card-body">
                                  {/* Color Picker */}
                                  <div className="form-group">
                                    <label>Color picker:</label>
                                    <input
                                      type="text"
                                      className="form-control my-colorpicker1"
                                    />
                                  </div>
                                  {/* /.form group */}
                                  {/* Color Picker */}
                                  <div className="form-group">
                                    <label>Color picker with addon:</label>
                                    <div className="input-group my-colorpicker2">
                                      <input
                                        type="text"
                                        className="form-control"
                                      />
                                      <div className="input-group-append">
                                        <span className="input-group-text">
                                          <i className="fas fa-square" />
                                        </span>
                                      </div>
                                    </div>
                                    {/* /.input group */}
                                  </div>
                                  {/* /.form group */}
                                  {/* time Picker */}
                                  <div className="bootstrap-timepicker">
                                    <div className="form-group">
                                      <label>Time picker:</label>
                                      <div
                                        className="input-group date"
                                        id="timepicker"
                                        data-target-input="nearest"
                                      >
                                        <input
                                          type="text"
                                          className="form-control datetimepicker-input"
                                          data-target="#timepicker"
                                        />
                                        <div
                                          className="input-group-append"
                                          data-target="#timepicker"
                                          data-toggle="datetimepicker"
                                        >
                                          <div className="input-group-text">
                                            k Bootstrap
                                            <i className="far fa-clock" />
                                          </div>
                                        </div>
                                      </div>
                                      {/* /.input group */}
                                    </div>
                                    {/* /.form group */}
                                  </div>
                                </div>
                                {/* /.card-body */}
                              </div>
                            </div>

                            <div className="col-lg-6">
                              {/* <!-- iCheck --> */}
                              <div className="card card-success">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    iCheck Bootstrap - Checkbox &amp; Radio
                                    Inputs
                                  </h3>
                                </div>
                                <div className="card-body">
                                  {/* Minimal style */}
                                  <div className="row">
                                    <div className="col-sm-6">
                                      {/* checkbox */}
                                      <div className="form-group clearfix">
                                        <div className="icheck-primary d-inline">
                                          <input
                                            type="checkbox"
                                            id="checkboxPrimary1"
                                            defaultChecked
                                          />
                                          <label htmlFor="checkboxPrimary1"></label>
                                        </div>
                                        <div className="icheck-primary d-inline">
                                          <input
                                            type="checkbox"
                                            id="checkboxPrimary2"
                                          />
                                          <label htmlFor="checkboxPrimary2"></label>
                                        </div>
                                        <div className="icheck-primary d-inline">
                                          <input
                                            type="checkbox"
                                            id="checkboxPrimary3"
                                            disabled
                                          />
                                          <label htmlFor="checkboxPrimary3">
                                            Primary checkbox
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-sm-6">
                                      {/* radio */}
                                      <div className="form-group clearfix">
                                        <div className="icheck-primary d-inline">
                                          <input
                                            type="radio"
                                            id="radioPrimary1"
                                            name="r1"
                                            defaultChecked
                                          />
                                          <label htmlFor="radioPrimary1"></label>
                                        </div>
                                        <div className="icheck-primary d-inline">
                                          <input
                                            type="radio"
                                            id="radioPrimary2"
                                            name="r1"
                                          />
                                          <label htmlFor="radioPrimary2"></label>
                                        </div>
                                        <div className="icheck-primary d-inline">
                                          <input
                                            type="radio"
                                            id="radioPrimary3"
                                            name="r1"
                                            disabled
                                          />
                                          <label htmlFor="radioPrimary3">
                                            Primary radio
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Minimal red style */}
                                  <div className="row">
                                    <div className="col-sm-6">
                                      {/* checkbox */}
                                      <div className="form-group clearfix">
                                        <div className="icheck-danger d-inline">
                                          <input
                                            type="checkbox"
                                            defaultChecked
                                            id="checkboxDanger1"
                                          />
                                          <label htmlFor="checkboxDanger1"></label>
                                        </div>
                                        <div className="icheck-danger d-inline">
                                          <input
                                            type="checkbox"
                                            id="checkboxDanger2"
                                          />
                                          <label htmlFor="checkboxDanger2"></label>
                                        </div>
                                        <div className="icheck-danger d-inline">
                                          <input
                                            type="checkbox"
                                            disabled
                                            id="checkboxDanger3"
                                          />
                                          <label htmlFor="checkboxDanger3">
                                            Danger checkbox
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-sm-6">
                                      {/* radio */}
                                      <div className="form-group clearfix">
                                        <div className="icheck-danger d-inline">
                                          <input
                                            type="radio"
                                            name="r2"
                                            defaultChecked
                                            id="radioDanger1"
                                          />
                                          <label htmlFor="radioDanger1"></label>
                                        </div>
                                        <div className="icheck-danger d-inline">
                                          <input
                                            type="radio"
                                            name="r2"
                                            id="radioDanger2"
                                          />
                                          <label htmlFor="radioDanger2"></label>
                                        </div>
                                        <div className="icheck-danger d-inline">
                                          <input
                                            type="radio"
                                            name="r2"
                                            disabled
                                            id="radioDanger3"
                                          />
                                          <label htmlFor="radioDanger3">
                                            Danger radio
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Minimal red style */}
                                  <div className="row">
                                    <div className="col-sm-6">
                                      {/* checkbox */}
                                      <div className="form-group clearfix">
                                        <div className="icheck-success d-inline">
                                          <input
                                            type="checkbox"
                                            defaultChecked
                                            id="checkboxSuccess1"
                                          />
                                          <label htmlFor="checkboxSuccess1"></label>
                                        </div>
                                        <div className="icheck-success d-inline">
                                          <input
                                            type="checkbox"
                                            id="checkboxSuccess2"
                                          />
                                          <label htmlFor="checkboxSuccess2"></label>
                                        </div>
                                        <div className="icheck-success d-inline">
                                          <input
                                            type="checkbox"
                                            disabled
                                            id="checkboxSuccess3"
                                          />
                                          <label htmlFor="checkboxSuccess3">
                                            Success checkbox
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="col-sm-6">
                                      {/* radio */}
                                      <div className="form-group clearfix">
                                        <div className="icheck-success d-inline">
                                          <input
                                            type="radio"
                                            name="r3"
                                            defaultChecked
                                            id="radioSuccess1"
                                          />
                                          <label htmlFor="radioSuccess1"></label>
                                        </div>
                                        <div className="icheck-success d-inline">
                                          <input
                                            type="radio"
                                            name="r3"
                                            id="radioSuccess2"
                                          />
                                          <label htmlFor="radioSuccess2"></label>
                                        </div>
                                        <div className="icheck-success d-inline">
                                          <input
                                            type="radio"
                                            name="r3"
                                            disabled
                                            id="radioSuccess3"
                                          />
                                          <label htmlFor="radioSuccess3">
                                            Success radio
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* /.card-body */}
                              </div>

                              {/* <!-- /.card --> */}
                            </div>

                            <div className="col-lg-6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/*addon  */}
                <div className="wrapper pt-5">
                  <div className="">
                    <div className="container-fluid">
                      <div className="card card-default rounded-4 border-0 cardHover">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-lg-6">
                              <h3>Input AddOn</h3>
                              <div className="card-body">
                                <div className="input-group mb-3">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text">@</span>
                                  </div>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Username"
                                  />
                                </div>
                                <div className="input-group mb-3">
                                  <input type="text" className="form-control" />
                                  <div className="input-group-append">
                                    <span className="input-group-text">
                                      .00
                                    </span>
                                  </div>
                                </div>
                                <div className="input-group">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text">$</span>
                                  </div>
                                  <input type="text" className="form-control" />
                                  <div className="input-group-append">
                                    <span className="input-group-text">
                                      .00
                                    </span>
                                  </div>
                                </div>
                                <h4>With icons</h4>
                                <div className="input-group mb-3">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text">
                                      <i className="fas fa-envelope" />
                                    </span>
                                  </div>
                                  <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Email"
                                  />
                                </div>
                                <div className="input-group mb-3">
                                  <input type="text" className="form-control" />
                                  <div className="input-group-append">
                                    <span className="input-group-text">
                                      <i className="fas fa-check" />
                                    </span>
                                  </div>
                                </div>
                                <div className="input-group">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text">
                                      <i className="fas fa-dollar-sign" />
                                    </span>
                                  </div>
                                  <input type="text" className="form-control" />
                                  <div className="input-group-append">
                                    <div className="input-group-text">
                                      <i className="fas fa-ambulance" />
                                    </div>
                                  </div>
                                </div>
                                <h5 className="mt-4 mb-2 mx-auto">
                                  With checkbox and radio inputs
                                </h5>
                                <div className="row">
                                  <div className="col-lg-6">
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <input type="checkbox" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                      />
                                    </div>
                                    {/* /input-group */}
                                  </div>
                                  {/* /.col-lg-6 */}
                                  <div className="col-lg-6">
                                    <div className="input-group">
                                      <div className="input-group-prepend">
                                        <span className="input-group-text">
                                          <input type="radio" />
                                        </span>
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                      />
                                    </div>
                                    {/* /input-group */}
                                  </div>
                                  {/* /.col-lg-6 */}
                                </div>
                                {/* /.row */}
                                <h5 className="mt-4 mb-2">With buttons</h5>
                                <p>
                                  Large:{" "}
                                  <code>.input-group.input-group-lg</code>
                                </p>
                                <div className="input-group input-group-lg mb-3">
                                  <div className="input-group-prepend">
                                    <button
                                      type="button"
                                      className="btn btn-warning dropdown-toggle"
                                      data-toggle="dropdown"
                                    >
                                      Action
                                    </button>
                                    <ul className="dropdown-menu">
                                      <li className="dropdown-item">
                                        <a href="#">Action</a>
                                      </li>
                                      <li className="dropdown-item">
                                        <a href="#">Another action</a>
                                      </li>
                                      <li className="dropdown-item">
                                        <a href="#">Something else here</a>
                                      </li>
                                      <li className="dropdown-divider" />
                                      <li className="dropdown-item">
                                        <a href="#">Separated link</a>
                                      </li>
                                    </ul>
                                  </div>
                                  {/* /btn-group */}
                                  <input type="text" className="form-control" />
                                </div>
                                {/* /input-group */}
                                <p>Normal</p>
                                <div className="input-group mb-3">
                                  <div className="input-group-prepend">
                                    <button
                                      type="button"
                                      className="btn btn-danger"
                                    >
                                      Action
                                    </button>
                                  </div>
                                  {/* /btn-group */}
                                  <input type="text" className="form-control" />
                                </div>
                                {/* /input-group */}
                                <p>
                                  Small <code>.input-group.input-group-sm</code>
                                </p>
                                <div className="input-group input-group-sm">
                                  <input type="text" className="form-control" />
                                  <span className="input-group-append">
                                    <button
                                      type="button"
                                      className="btn btn-info btn-flat"
                                    >
                                      Go!
                                    </button>
                                  </span>
                                </div>
                                {/* /input-group */}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="card card-warning">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    General Elements
                                  </h3>
                                </div>
                                {/* /.card-header */}
                                <div className="card-body">
                                  <form>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* text input */}
                                        <div className="form-group">
                                          <label>Text</label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter ..."
                                          />
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Text Disabled</label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter ..."
                                            disabled
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* textarea */}
                                        <div className="form-group">
                                          <label>Textarea</label>
                                          <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Enter ..."
                                            defaultValue={""}
                                          />
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Textarea Disabled</label>
                                          <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Enter ..."
                                            disabled
                                            defaultValue={""}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    {/* input states */}
                                    <div className="form-group">
                                      <label
                                        className="col-form-label"
                                        htmlFor="inputSuccess"
                                      >
                                        <i className="fas fa-check" /> Input
                                        with success
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control is-valid"
                                        id="inputSuccess"
                                        placeholder="Enter ..."
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label
                                        className="col-form-label"
                                        htmlFor="inputWarning"
                                      >
                                        <i className="far fa-bell" /> Input with
                                        warning
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control is-warning"
                                        id="inputWarning"
                                        placeholder="Enter ..."
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label
                                        className="col-form-label"
                                        htmlFor="inputError"
                                      >
                                        <i className="far fa-times-circle" />{" "}
                                        Input with error
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control is-invalid"
                                        id="inputError"
                                        placeholder="Enter ..."
                                      />
                                    </div>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* checkbox */}
                                        <div className="form-group">
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                            />
                                            <label className="form-check-label">
                                              Checkbox
                                            </label>
                                          </div>
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              defaultChecked
                                            />
                                            <label className="form-check-label">
                                              Checkbox checked
                                            </label>
                                          </div>
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              disabled
                                            />
                                            <label className="form-check-label">
                                              Checkbox disabled
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        {/* radio */}
                                        <div className="form-group">
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              name="radio1"
                                            />
                                            <label className="form-check-label">
                                              Radio
                                            </label>
                                          </div>
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              name="radio1"
                                              defaultChecked
                                            />
                                            <label className="form-check-label">
                                              Radio checked
                                            </label>
                                          </div>
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              disabled
                                            />
                                            <label className="form-check-label">
                                              Radio disabled
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* select */}
                                        <div className="form-group">
                                          <label>Select</label>
                                          <select className="form-control">
                                            <option>option 1</option>
                                            <option>option 2</option>
                                            <option>option 3</option>
                                            <option>option 4</option>
                                            <option>option 5</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Select Disabled</label>
                                          <select
                                            className="form-control"
                                            disabled
                                          >
                                            <option>option 1</option>
                                            <option>option 2</option>
                                            <option>option 3</option>
                                            <option>option 4</option>
                                            <option>option 5</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* Select multiple*/}
                                        <div className="form-group">
                                          <label>Select Multiple</label>
                                          <select
                                            multiple
                                            className="form-control"
                                          >
                                            <option>option 1</option>
                                            <option>option 2</option>
                                            <option>option 3</option>
                                            <option>option 4</option>
                                            <option>option 5</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>
                                            Select Multiple Disabled
                                          </label>
                                          <select
                                            multiple
                                            className="form-control"
                                            disabled
                                          >
                                            <option>option 1</option>
                                            <option>option 2</option>
                                            <option>option 3</option>
                                            <option>option 4</option>
                                            <option>option 5</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                                {/* /.card-body */}
                              </div>
                            </div>
                            <div className="col-lg-6 ">
                              <div className="card card-secondary">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    Custom Elements
                                  </h3>
                                </div>
                                {/* /.card-header */}
                                <div className="card-body">
                                  <form>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* checkbox */}
                                        <div className="form-group">
                                          <div className="custom-control custom-checkbox">
                                            <input
                                              className="custom-control-input"
                                              type="checkbox"
                                              id="customCheckbox1"
                                              defaultValue="option1"
                                            />
                                            <label
                                              htmlFor="customCheckbox1"
                                              className="custom-control-label"
                                            >
                                              Custom Checkbox
                                            </label>
                                          </div>
                                          <div className="custom-control custom-checkbox">
                                            <input
                                              className="custom-control-input"
                                              type="checkbox"
                                              id="customCheckbox2"
                                              defaultChecked
                                            />
                                            <label
                                              htmlFor="customCheckbox2"
                                              className="custom-control-label"
                                            >
                                              Custom Checkbox checked
                                            </label>
                                          </div>
                                          <div className="custom-control custom-checkbox">
                                            <input
                                              className="custom-control-input"
                                              type="checkbox"
                                              id="customCheckbox3"
                                              disabled
                                            />
                                            <label
                                              htmlFor="customCheckbox3"
                                              className="custom-control-label"
                                            >
                                              Custom Checkbox disabled
                                            </label>
                                          </div>
                                          <div className="custom-control custom-checkbox">
                                            <input
                                              className="custom-control-input custom-control-input-danger"
                                              type="checkbox"
                                              id="customCheckbox4"
                                              defaultChecked
                                            />
                                            <label
                                              htmlFor="customCheckbox4"
                                              className="custom-control-label"
                                            >
                                              Custom Checkbox with custom color
                                            </label>
                                          </div>
                                          <div className="custom-control custom-checkbox">
                                            <input
                                              className="custom-control-input custom-control-input-danger custom-control-input-outline"
                                              type="checkbox"
                                              id="customCheckbox5"
                                              defaultChecked
                                            />
                                            <label
                                              htmlFor="customCheckbox5"
                                              className="custom-control-label"
                                            >
                                              Custom Checkbox with custom color
                                              outline
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        {/* radio */}
                                        <div className="form-group">
                                          <div className="custom-control custom-radio">
                                            <input
                                              className="custom-control-input"
                                              type="radio"
                                              id="customRadio1"
                                              name="customRadio"
                                            />
                                            <label
                                              htmlFor="customRadio1"
                                              className="custom-control-label"
                                            >
                                              Custom Radio
                                            </label>
                                          </div>
                                          <div className="custom-control custom-radio">
                                            <input
                                              className="custom-control-input"
                                              type="radio"
                                              id="customRadio2"
                                              name="customRadio"
                                              defaultChecked
                                            />
                                            <label
                                              htmlFor="customRadio2"
                                              className="custom-control-label"
                                            >
                                              Custom Radio checked
                                            </label>
                                          </div>
                                          <div className="custom-control custom-radio">
                                            <input
                                              className="custom-control-input"
                                              type="radio"
                                              id="customRadio3"
                                              disabled
                                            />
                                            <label
                                              htmlFor="customRadio3"
                                              className="custom-control-label"
                                            >
                                              Custom Radio disabled
                                            </label>
                                          </div>
                                          <div className="custom-control custom-radio">
                                            <input
                                              className="custom-control-input custom-control-input-danger"
                                              type="radio"
                                              id="customRadio4"
                                              name="customRadio2"
                                              defaultChecked
                                            />
                                            <label
                                              htmlFor="customRadio4"
                                              className="custom-control-label"
                                            >
                                              Custom Radio with custom color
                                            </label>
                                          </div>
                                          <div className="custom-control custom-radio">
                                            <input
                                              className="custom-control-input custom-control-input-danger custom-control-input-outline"
                                              type="radio"
                                              id="customRadio5"
                                              name="customRadio2"
                                            />
                                            <label
                                              htmlFor="customRadio5"
                                              className="custom-control-label"
                                            >
                                              Custom Radio with custom color
                                              outline
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="row">
                                      <div className="col-sm-6">
                                        {/* select */}
                                        <div className="form-group">
                                          <label>Custom Select</label>
                                          <select className="custom-select">
                                            <option>option 1</option>
                                            <option>option 2</option>
                                            <option>option 3</option>
                                            <option>option 4</option>
                                            <option>option 5</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="col-sm-6">
                                        <div className="form-group">
                                          <label>Custom Select Disabled</label>
                                          <select
                                            className="custom-select"
                                            disabled
                                          >
                                            <option>option 1</option>
                                            <option>option 2</option>
                                            <option>option 3</option>
                                            <option>option 4</option>
                                            <option>option 5</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <div className="custom-control custom-switch">
                                        <input
                                          type="checkbox"
                                          className="custom-control-input"
                                          id="customSwitch1"
                                        />
                                        <label
                                          className="custom-control-label"
                                          htmlFor="customSwitch1"
                                        >
                                          Toggle this custom switch element
                                        </label>
                                      </div>
                                    </div>
                                    <div className="form-group">
                                      <div className="custom-control custom-switch custom-switch-off-danger custom-switch-on-success">
                                        <input
                                          type="checkbox"
                                          className="custom-control-input"
                                          id="customSwitch3"
                                        />
                                        <label
                                          className="custom-control-label"
                                          htmlFor="customSwitch3"
                                        >
                                          Toggle this custom switch element with
                                          custom colors danger/success
                                        </label>
                                      </div>
                                    </div>
                                    <div className="form-group">
                                      <div className="custom-control custom-switch">
                                        <input
                                          type="checkbox"
                                          className="custom-control-input"
                                          disabled
                                          id="customSwitch2"
                                        />
                                        <label
                                          className="custom-control-label"
                                          htmlFor="customSwitch2"
                                        >
                                          Disabled custom switch element
                                        </label>
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      {/* <label for="customFile">Custom File</label> */}
                                      <div className="custom-file">
                                        <input
                                          type="file"
                                          className="custom-file-input"
                                          id="customFile"
                                        />
                                        <label
                                          className="custom-file-label"
                                          htmlFor="customFile"
                                        >
                                          Choose file
                                        </label>
                                      </div>
                                    </div>
                                    <div className="form-group"></div>
                                  </form>
                                </div>
                                {/* /.card-body */}
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="card card-info">
                                <div className="card-header">
                                  <h3 className="card-title mx-auto">
                                    Horizontal Form
                                  </h3>
                                </div>
                                {/* /.card-header */}
                                {/* form start */}
                                <form className="form-horizontal">
                                  <div className="card-body">
                                    <div className="form-group row">
                                      <label
                                        htmlFor="inputEmail3"
                                        className="col-sm-2 col-form-label"
                                      >
                                        Email
                                      </label>
                                      <div className="col-sm-10">
                                        <input
                                          type="email"
                                          className="form-control"
                                          id="inputEmail3"
                                          placeholder="Email"
                                        />
                                      </div>
                                    </div>
                                    <div className="form-group row">
                                      <label
                                        htmlFor="inputPassword3"
                                        className="col-sm-2 col-form-label"
                                      >
                                        Password
                                      </label>
                                      <div className="col-sm-10">
                                        <input
                                          type="password"
                                          className="form-control"
                                          id="inputPassword3"
                                          placeholder="Password"
                                        />
                                      </div>
                                    </div>
                                    <div className="form-group row">
                                      <div className="offset-sm-2 col-sm-10">
                                        <div className="form-check">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="exampleCheck2"
                                          />
                                          <label
                                            className="form-check-label"
                                            htmlFor="exampleCheck2"
                                          >
                                            Remember me
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* /.card-body */}
                                  <div className="card-footer">
                                    <button
                                      type="submit"
                                      className="btn btn-info"
                                    >
                                      Sign in
                                    </button>
                                    <button
                                      type="submit"
                                      className="btn btn-default float-right"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  {/* /.card-footer */}
                                </form>
                              </div>
                            </div>
                            <></>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </section>
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
                custom name
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
                    custom Name<span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="brandName"
                    placeholder="Enter custom name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="shortDescription" className="form-label">
                    custom Description
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="shortDescription"
                    placeholder="Enter custom description"
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

export default AllFormElements;
