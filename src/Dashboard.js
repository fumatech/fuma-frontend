import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BusinessFunctionCards from "./components/Dashboard/BusinessFunctionCards";
import "./Pages/Dashboard.css";
const Dashboard = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [notices, setNotices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/user/count`)
      .then((res) => res.json())
      .then((data) => setUserCount(data))
      .catch((err) => console.error("User fetch error:", err));

    fetch(`${process.env.REACT_APP_BASE_URL}/vendor/count`)
      .then((res) => res.json())
      .then((data) => setVendorCount(data))
      .catch((err) => console.error("Vendor fetch error:", err));

    fetch(`${process.env.REACT_APP_BASE_URL}/customer/count`)
      .then((res) => res.json())
      .then((data) => setFranchiseCount(data))
      .catch((err) => console.error("Franchise fetch error:", err));

    // Fetch active notices for the announcement widget
    axios.get(`${process.env.REACT_APP_BASE_URL}/notice-board/active`)
      .then((res) => setNotices(res.data || []))
      .catch((err) => console.error("Notice fetch error:", err));
  }, []);

  return (
    <div>
      <div className="content-wrapper dashboard-background bg-transparent">
        {/* Content Header (Page header) */}
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h2 className="m-0  all-heading fs-1 ">Dashboard</h2>
                <label className="sub-heading">
                  {" "}
                  Welcome, <b>{userEmail}</b>
                </label>
              </div>
              {/* /.col */}
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right"></ol>
              </div>
              {/* /.col */}
            </div>
            {/* /.row */}
          </div>
          {/* /.container-fluid */}
        </div>
        {/* /.content-header */}
        {/* Main content */}
        <section className="content">
          <div className="container-fluid">
            {/* Small boxes (Stat box) */}
            <div className="row">
              {/* Users */}
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="dashboard-card users">
                  <div className="card-content">
                    <div>
                      <h3>{userCount}</h3>
                      <p>User Registrations</p>
                    </div>
                    <div
                      className="card-icon"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/Users")}
                    >
                      <i className="fas fa-user-plus" />
                    </div>
                  </div>

                  <div
                    className="card-footer"
                    onClick={() => navigate("/Users")}
                  >
                    More info <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>

              {/* Vendors */}
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="dashboard-card vendors">
                  <div className="card-content">
                    <div>
                      <h3>{vendorCount}</h3>
                      <p>Vendor Registrations</p>
                    </div>
                    <div
                      className="card-icon"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/Vendor")}
                    >
                      <i className="fas fa-store"></i>
                    </div>
                  </div>

                  <div
                    className="card-footer"
                    onClick={() => navigate("/Vendor")}
                  >
                    More info <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>

              {/* Franchise */}
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="dashboard-card franchise">
                  <div className="card-content">
                    <div>
                      <h3>{franchiseCount}</h3>
                      <p>Franchise Registrations</p>
                    </div>
                    <div
                      className="card-icon"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/Customer")}
                    >
                      <i className="fas fa-building"></i>
                    </div>
                  </div>

                  <div
                    className="card-footer"
                    onClick={() => navigate("/Customer")}
                  >
                    More info <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>

            <BusinessFunctionCards />

            {/* /.row */}
            {/* Main row */}
            <div className="row">
              {/* Left col */}
              <section className="col-lg-7 connectedSortable">
                {/* Custom tabs (Charts with tabs)*/}
                <div className="card  blur-card text-light shadow bg-transparent">
                  <div className="card-header">
                    <h3 className="card-title">
                      <i className="fas fa-chart-pie mr-1" />
                      Sales
                    </h3>
                    <div className="card-tools">
                      <ul className="nav nav-pills ml-auto">
                        <li className="nav-item">
                          <a
                            className="nav-link active"
                            href="#revenue-chart"
                            data-toggle="tab"
                          >
                            Area
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            className="nav-link"
                            href="#sales-chart"
                            data-toggle="tab"
                          >
                            Donut
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* /.card-header */}
                  <div className="card-body ">
                    <div className="tab-content p-0">
                      {/* Morris chart - Sales */}
                      <div
                        className="chart tab-pane active"
                        id="revenue-chart"
                        style={{ position: "relative", height: 300 }}
                      >
                        <canvas
                          id="revenue-chart-canvas"
                          height={300}
                          style={{ height: 300 }}
                        />
                      </div>
                      <div
                        className="chart tab-pane"
                        id="sales-chart"
                        style={{ position: "relative", height: 300 }}
                      >
                        <canvas
                          id="sales-chart-canvas"
                          height={300}
                          style={{ height: 300 }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* /.card-body */}
                </div>
                {/* /.card */}
                {/* DIRECT CHAT */}
                <div className="card direct-chat direct-chat-primary  bg-transparent blur-card text-light shadow">
                  <div className="card-header">
                    <h3 className="card-title">Direct Chat</h3>
                    <div className="card-tools">
                      <span
                        data-toggle="tooltip"
                        title="3 New Messages"
                        className="badge badge-primary"
                      >
                        3
                      </span>
                      <button
                        type="button"
                        className="btn btn-tool"
                        data-card-widget="collapse"
                      >
                        <i className="fas fa-minus" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-tool"
                        data-toggle="tooltip"
                        title="Contacts"
                        data-widget="chat-pane-toggle"
                      >
                        <i className="fas fa-comments" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-tool"
                        data-card-widget="remove"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  </div>
                  {/* /.card-header */}
                  <div className="card-body">
                    {/* Conversations are loaded here */}
                    <div className="direct-chat-messages">
                      {/* Message. Default to the left */}
                      <div className="direct-chat-msg">
                        <div className="direct-chat-infos clearfix">
                          <span className="direct-chat-name float-left">
                            Alexander Pierce
                          </span>
                          <span className="direct-chat-timestamp float-right">
                            23 Jan 2:00 pm
                          </span>
                        </div>
                        {/* /.direct-chat-infos */}
                        <img
                          className="direct-chat-img"
                          src="dist/img/user1-128x128.jpg"
                          alt="message user image"
                        />
                        {/* /.direct-chat-img */}
                        <div className="direct-chat-text">
                          Is this template really for free? That's unbelievable!
                        </div>
                        {/* /.direct-chat-text */}
                      </div>
                      {/* /.direct-chat-msg */}
                      {/* Message to the right */}
                      <div className="direct-chat-msg right">
                        <div className="direct-chat-infos clearfix">
                          <span className="direct-chat-name float-right">
                            Sarah Bullock
                          </span>
                          <span className="direct-chat-timestamp float-left">
                            23 Jan 2:05 pm
                          </span>
                        </div>
                        {/* /.direct-chat-infos */}
                        <img
                          className="direct-chat-img"
                          src="dist/img/user3-128x128.jpg"
                          alt="message user image"
                        />
                        {/* /.direct-chat-img */}
                        <div className="direct-chat-text">
                          You better believe it!
                        </div>
                        {/* /.direct-chat-text */}
                      </div>
                      {/* /.direct-chat-msg */}
                      {/* Message. Default to the left */}
                      <div className="direct-chat-msg">
                        <div className="direct-chat-infos clearfix">
                          <span className="direct-chat-name float-left">
                            Alexander Pierce
                          </span>
                          <span className="direct-chat-timestamp float-right">
                            23 Jan 5:37 pm
                          </span>
                        </div>
                        {/* /.direct-chat-infos */}
                        <img
                          className="direct-chat-img"
                          src="dist/img/user1-128x128.jpg"
                          alt="message user image"
                        />
                        {/* /.direct-chat-img */}
                        <div className="direct-chat-text">
                          Working with AdminLTE on a great new app! Wanna join?
                        </div>
                        {/* /.direct-chat-text */}
                      </div>
                      {/* /.direct-chat-msg */}
                      {/* Message to the right */}
                      <div className="direct-chat-msg right">
                        <div className="direct-chat-infos clearfix">
                          <span className="direct-chat-name float-right">
                            Sarah Bullock
                          </span>
                          <span className="direct-chat-timestamp float-left">
                            23 Jan 6:10 pm
                          </span>
                        </div>
                        {/* /.direct-chat-infos */}
                        <img
                          className="direct-chat-img"
                          src="dist/img/user3-128x128.jpg"
                          alt="message user image"
                        />
                        {/* /.direct-chat-img */}
                        <div className="direct-chat-text">I would love to.</div>
                        {/* /.direct-chat-text */}
                      </div>
                      {/* /.direct-chat-msg */}
                    </div>
                    {/*/.direct-chat-messages*/}
                    {/* Contacts are loaded here */}
                    <div className="direct-chat-contacts">
                      <ul className="contacts-list">
                        <li>
                          <a href="#">
                            <img
                              className="contacts-list-img"
                              src="dist/img/user1-128x128.jpg"
                            />
                            <div className="contacts-list-info">
                              <span className="contacts-list-name">
                                Count Dracula
                                <small className="contacts-list-date float-right">
                                  2/28/2015
                                </small>
                              </span>
                              <span className="contacts-list-msg">
                                How have you been? I was...
                              </span>
                            </div>
                            {/* /.contacts-list-info */}
                          </a>
                        </li>
                        {/* End Contact Item */}
                        <li>
                          <a href="#">
                            <img
                              className="contacts-list-img"
                              src="dist/img/user7-128x128.jpg"
                            />
                            <div className="contacts-list-info">
                              <span className="contacts-list-name">
                                Sarah Doe
                                <small className="contacts-list-date float-right">
                                  2/23/2015
                                </small>
                              </span>
                              <span className="contacts-list-msg">
                                I will be waiting for...
                              </span>
                            </div>
                            {/* /.contacts-list-info */}
                          </a>
                        </li>
                        {/* End Contact Item */}
                        <li>
                          <a href="#">
                            <img
                              className="contacts-list-img"
                              src="dist/img/user3-128x128.jpg"
                            />
                            <div className="contacts-list-info">
                              <span className="contacts-list-name">
                                Nadia Jolie
                                <small className="contacts-list-date float-right">
                                  2/20/2015
                                </small>
                              </span>
                              <span className="contacts-list-msg">
                                I'll call you back at...
                              </span>
                            </div>
                            {/* /.contacts-list-info */}
                          </a>
                        </li>
                        {/* End Contact Item */}
                        <li>
                          <a href="#">
                            <img
                              className="contacts-list-img"
                              src="dist/img/user5-128x128.jpg"
                            />
                            <div className="contacts-list-info">
                              <span className="contacts-list-name">
                                Nora S. Vans
                                <small className="contacts-list-date float-right">
                                  2/10/2015
                                </small>
                              </span>
                              <span className="contacts-list-msg">
                                Where is your new...
                              </span>
                            </div>
                            {/* /.contacts-list-info */}
                          </a>
                        </li>
                        {/* End Contact Item */}
                        <li>
                          <a href="#">
                            <img
                              className="contacts-list-img"
                              src="dist/img/user6-128x128.jpg"
                            />
                            <div className="contacts-list-info">
                              <span className="contacts-list-name">
                                John K.
                                <small className="contacts-list-date float-right">
                                  1/27/2015
                                </small>
                              </span>
                              <span className="contacts-list-msg">
                                Can I take a look at...
                              </span>
                            </div>
                            {/* /.contacts-list-info */}
                          </a>
                        </li>
                        {/* End Contact Item */}
                        <li>
                          <a href="#">
                            <img
                              className="contacts-list-img"
                              src="dist/img/user8-128x128.jpg"
                            />
                            <div className="contacts-list-info">
                              <span className="contacts-list-name">
                                Kenneth M.
                                <small className="contacts-list-date float-right">
                                  1/4/2015
                                </small>
                              </span>
                              <span className="contacts-list-msg">
                                Never mind I found...
                              </span>
                            </div>
                            {/* /.contacts-list-info */}
                          </a>
                        </li>
                        {/* End Contact Item */}
                      </ul>
                      {/* /.contacts-list */}
                    </div>
                    {/* /.direct-chat-pane */}
                  </div>
                  {/* /.card-body */}
                  <div className="card-footer">
                    <form action="#" method="post">
                      <div className="input-group">
                        <input
                          type="text"
                          name="message"
                          placeholder="Type Message ..."
                          className="form-control"
                        />
                        <span className="input-group-append">
                          <button type="button" className="btn btn-primary">
                            Send
                          </button>
                        </span>
                      </div>
                    </form>
                  </div>
                  {/* /.card-footer*/}
                </div>
                {/*/.direct-chat */}
                {/* TO DO List */}
                <div className="card blur-card text-light">
                  <div className="card-header">
                    <h3 className="card-title">
                      <i className="ion ion-clipboard mr-1" />
                      To Do List
                    </h3>
                    <div className="card-tools">
                      <ul className="pagination pagination-sm blur">
                        <li className="page-item">
                          <a href="#" className="page-link">
                            «
                          </a>
                        </li>
                        <li className="page-item">
                          <a href="#" className="page-link">
                            1
                          </a>
                        </li>
                        <li className="page-item">
                          <a href="#" className="page-link">
                            2
                          </a>
                        </li>
                        <li className="page-item">
                          <a href="#" className="page-link">
                            3
                          </a>
                        </li>
                        <li className="page-item">
                          <a href="#" className="page-link">
                            »
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* /.card-header */}
                  <div className="card-body">
                    <ul className="todo-list" data-widget="todo-list">
                      <li>
                        {/* drag handle */}
                        <span className="handle">
                          <i className="fas fa-ellipsis-v" />
                          <i className="fas fa-ellipsis-v" />
                        </span>
                        {/* checkbox */}
                        <div className="icheck-primary d-inline ml-2">
                          <input
                            type="checkbox"
                            defaultValue
                            name="todo1"
                            id="todoCheck1"
                          />
                          <label htmlFor="todoCheck1" />
                        </div>
                        {/* todo text */}
                        <span className="text">Design a nice theme</span>
                        {/* Emphasis label */}
                        <small className="badge badge-danger">
                          <i className="far fa-clock" /> 2 mins
                        </small>
                        {/* General tools such as edit or delete*/}
                        <div className="tools">
                          <i className="fas fa-edit" />
                          <i className="fas fa-trash-o" />
                        </div>
                      </li>
                      <li>
                        <span className="handle">
                          <i className="fas fa-ellipsis-v" />
                          <i className="fas fa-ellipsis-v" />
                        </span>
                        <div className="icheck-primary d-inline ml-2">
                          <input
                            type="checkbox"
                            defaultValue
                            name="todo2"
                            id="todoCheck2"
                            defaultChecked
                          />
                          <label htmlFor="todoCheck2" />
                        </div>
                        <span className="text">Make the theme responsive</span>
                        <small className="badge badge-info">
                          <i className="far fa-clock" /> 4 hours
                        </small>
                        <div className="tools">
                          <i className="fas fa-edit" />
                          <i className="fas fa-trash-o" />
                        </div>
                      </li>
                      <li>
                        <span className="handle">
                          <i className="fas fa-ellipsis-v" />
                          <i className="fas fa-ellipsis-v" />
                        </span>
                        <div className="icheck-primary d-inline ml-2">
                          <input
                            type="checkbox"
                            defaultValue
                            name="todo3"
                            id="todoCheck3"
                          />
                          <label htmlFor="todoCheck3" />
                        </div>
                        <span className="text">
                          Let theme shine like a star
                        </span>
                        <small className="badge badge-warning">
                          <i className="far fa-clock" /> 1 day
                        </small>
                        <div className="tools">
                          <i className="fas fa-edit" />
                          <i className="fas fa-trash-o" />
                        </div>
                      </li>
                      <li>
                        <span className="handle">
                          <i className="fas fa-ellipsis-v" />
                          <i className="fas fa-ellipsis-v" />
                        </span>
                        <div className="icheck-primary d-inline ml-2">
                          <input
                            type="checkbox"
                            defaultValue
                            name="todo4"
                            id="todoCheck4"
                          />
                          <label htmlFor="todoCheck4" />
                        </div>
                        <span className="text">
                          Let theme shine like a star
                        </span>
                        <small className="badge badge-success">
                          <i className="far fa-clock" /> 3 days
                        </small>
                        <div className="tools">
                          <i className="fas fa-edit" />
                          <i className="fas fa-trash-o" />
                        </div>
                      </li>
                      <li>
                        <span className="handle">
                          <i className="fas fa-ellipsis-v" />
                          <i className="fas fa-ellipsis-v" />
                        </span>
                        <div className="icheck-primary d-inline ml-2">
                          <input
                            type="checkbox"
                            defaultValue
                            name="todo5"
                            id="todoCheck5"
                          />
                          <label htmlFor="todoCheck5" />
                        </div>
                        <span className="text">
                          Check your messages and notifications
                        </span>
                        <small className="badge badge-primary">
                          <i className="far fa-clock" /> 1 week
                        </small>
                        <div className="tools">
                          <i className="fas fa-edit" />
                          <i className="fas fa-trash-o" />
                        </div>
                      </li>
                      <li>
                        <span className="handle">
                          <i className="fas fa-ellipsis-v" />
                          <i className="fas fa-ellipsis-v" />
                        </span>
                        <div className="icheck-primary d-inline ml-2">
                          <input
                            type="checkbox"
                            defaultValue
                            name="todo6"
                            id="todoCheck6"
                          />
                          <label htmlFor="todoCheck6" />
                        </div>
                        <span className="text">
                          Let theme shine like a star
                        </span>
                        <small className="badge badge-secondary">
                          <i className="far fa-clock" /> 1 month
                        </small>
                        <div className="tools">
                          <i className="fas fa-edit" />
                          <i className="fas fa-trash-o" />
                        </div>
                      </li>
                    </ul>
                  </div>
                  {/* /.card-body */}
                  <div className="card-footer clearfix">
                    <button type="button" className="btn btn-info float-right">
                      <i className="fas fa-plus" /> Add item
                    </button>
                  </div>
                </div>
                {/* /.card */}
              </section>
              {/* /.Left col */}
              {/* right col (We are only adding the ID to make the widgets sortable)*/}
              <section className="col-lg-5 connectedSortable">
                {/* Company Announcements */}
                <div className="card blur-card text-dark shadow" style={{ background: "#fff", borderTop: "3px solid #6f42c1" }}>
                  <div className="card-header d-flex justify-content-between align-items-center" style={{ background: "linear-gradient(135deg, #6f42c1 0%, #4361ee 100%)", color: "#fff", borderRadius: "0" }}>
                    <h3 className="card-title mb-0">
                      <i className="fas fa-bullhorn mr-2" />
                      Company Announcements
                    </h3>
                    <span className="badge badge-light">{notices.filter(n => n.active).length} Active</span>
                  </div>
                  <div className="card-body p-0" style={{ maxHeight: "360px", overflowY: "auto" }}>
                    {notices.length === 0 ? (
                      <div className="text-center text-muted py-4">
                        <i className="fas fa-clipboard fa-2x mb-2 d-block" style={{ opacity: 0.3 }}></i>
                        <small>No announcements at this time</small>
                      </div>
                    ) : (
                      notices.slice(0, 5).map((notice) => {
                        const categoryColors = {
                          Announcement: "#3498db", Achievement: "#2ecc71", Alert: "#e74c3c",
                          Event: "#9b59b6", Policy: "#f39c12", General: "#95a5a6",
                        };
                        const categoryIcons = {
                          Announcement: "fas fa-bullhorn", Achievement: "fas fa-trophy", Alert: "fas fa-exclamation-triangle",
                          Event: "fas fa-calendar-alt", Policy: "fas fa-file-alt", General: "fas fa-info-circle",
                        };
                        const timeAgo = (dateStr) => {
                          if (!dateStr) return "";
                          const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
                          if (seconds < 60) return "Just now";
                          const minutes = Math.floor(seconds / 60);
                          if (minutes < 60) return `${minutes}m ago`;
                          const hours = Math.floor(minutes / 60);
                          if (hours < 24) return `${hours}h ago`;
                          const days = Math.floor(hours / 24);
                          if (days < 30) return `${days}d ago`;
                          return `${Math.floor(days / 30)}mo ago`;
                        };
                        return (
                          <div
                            key={notice.id}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #f0f0f0",
                              borderLeft: `4px solid ${categoryColors[notice.category] || "#95a5a6"}`,
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="d-flex align-items-center mb-1">
                                {notice.pinned && (
                                  <i className="fas fa-thumbtack text-warning mr-2" style={{ fontSize: "11px" }} title="Pinned"></i>
                                )}
                                <span
                                  className="badge mr-2"
                                  style={{
                                    backgroundColor: categoryColors[notice.category] || "#95a5a6",
                                    color: "#fff",
                                    fontSize: "10px",
                                  }}
                                >
                                  <i className={`${categoryIcons[notice.category] || "fas fa-info-circle"} mr-1`}></i>
                                  {notice.category}
                                </span>
                              </div>
                              <small className="text-muted" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                                {timeAgo(notice.createdAt)}
                              </small>
                            </div>
                            <h6 className="mb-1 font-weight-bold" style={{ fontSize: "13px" }}>{notice.title}</h6>
                            <p className="mb-0 text-muted" style={{ fontSize: "12px", maxHeight: "36px", overflow: "hidden" }}>
                              {notice.content}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {notices.length > 5 && (
                    <div className="card-footer text-center p-2" style={{ background: "#f8f9fa" }}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate("/HRMDashboard")}
                      >
                        View All Announcements <i className="fas fa-arrow-right ml-1"></i>
                      </button>
                    </div>
                  )}
                </div>

                {/* Map card */}
                <div className="card card bg-transparent blur-card text-light shadow">
                  <div className="card-header border-0">
                    <h3 className="card-title">
                      <i className="fas fa-map-marker-alt mr-1" />
                      Visitors
                    </h3>
                    {/* card tools */}
                    <div className="card-tools">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm daterange"
                        data-toggle="tooltip"
                        title="Date range"
                      >
                        <i className="far fa-calendar-alt" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        data-card-widget="collapse"
                        data-toggle="tooltip"
                        title="Collapse"
                      >
                        <i className="fas fa-minus" />
                      </button>
                    </div>
                    {/* /.card-tools */}
                  </div>
                  <div className="card-body">
                    <div
                      id="world-map"
                      style={{ height: 250, width: "100%" }}
                    />
                  </div>
                  {/* /.card-body*/}
                  <div className="card-footer bg-transparent">
                    <div className="row">
                      <div className="col-4 text-center">
                        <div id="sparkline-1" />
                        <div className="text-white">Visitors</div>
                      </div>
                      {/* ./col */}
                      <div className="col-4 text-center">
                        <div id="sparkline-2" />
                        <div className="text-white">Online</div>
                      </div>
                      {/* ./col */}
                      <div className="col-4 text-center">
                        <div id="sparkline-3" />
                        <div className="text-white">Sales</div>
                      </div>
                      {/* ./col */}
                    </div>
                    {/* /.row */}
                  </div>
                </div>
                {/* /.card */}
                {/* solid sales graph */}
                <div className="card bg-gradient-info">
                  <div className="card-header border-0">
                    <h3 className="card-title">
                      <i className="fas fa-th mr-1" />
                      Sales Graph
                    </h3>
                    <div className="card-tools">
                      <button
                        type="button"
                        className="btn bg-info btn-sm"
                        data-card-widget="collapse"
                      >
                        <i className="fas fa-minus" />
                      </button>
                      <button
                        type="button"
                        className="btn bg-info btn-sm"
                        data-card-widget="remove"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <canvas
                      className="chart"
                      id="line-chart"
                      style={{
                        minHeight: 250,
                        height: 250,
                        maxHeight: 250,
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                  {/* /.card-body */}
                  <div className="card-footer bg-transparent">
                    <div className="row">
                      <div className="col-4 text-center">
                        {/* <input
                            type="text"
                            className="knob"
                            data-readonly="true"
                            defaultValue={20}
                            data-width={60}
                            data-height={60}
                            data-fgcolor="#39CCCC"
                          /> */}
                        <div className="text-white">Mail-Orders</div>
                      </div>
                      {/* ./col */}
                      <div className="col-4 text-center">
                        {/* <input
                            type="text"
                            className="knob"
                            data-readonly="true"
                            defaultValue={50}
                            data-width={60}
                            data-height={60}
                            data-fgcolor="#39CCCC"
                          /> */}
                        <div className="text-white">Online</div>
                      </div>
                      {/* ./col */}
                      <div className="col-4 text-center">
                        {/* <input
                            type="text"
                            className="knob"
                            data-readonly="true"
                            defaultValue={30}
                            data-width={60}
                            data-height={60}
                            data-fgcolor="#39CCCC"
                          /> */}
                        <div className="text-white">In-Store</div>
                      </div>
                      {/* ./col */}
                    </div>
                    {/* /.row */}
                  </div>
                  {/* /.card-footer */}
                </div>
                {/* /.card */}
                {/* Calendar */}
                <div className="card bg-gradient-success">
                  <div className="card-header border-0">
                    <h3 className="card-title">
                      <i className="far fa-calendar-alt" />
                      Calendar
                    </h3>
                    {/* tools card */}
                    <div className="card-tools">
                      {/* button with a dropdown */}
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-success btn-sm dropdown-toggle"
                          data-toggle="dropdown"
                        >
                          <i className="fas fa-bars" />
                        </button>
                        <div className="dropdown-menu float-right" role="menu">
                          <a href="#" className="dropdown-item">
                            Add new event
                          </a>
                          <a href="#" className="dropdown-item">
                            Clear events
                          </a>
                          <div className="dropdown-divider" />
                          <a href="#" className="dropdown-item">
                            View calendar
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        data-card-widget="collapse"
                      >
                        <i className="fas fa-minus" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        data-card-widget="remove"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                    {/* /. tools */}
                  </div>
                  {/* /.card-header */}
                  <div className="card-body pt-0">
                    {/*The calendar */}
                    <div id="calendar" style={{ width: "100%" }} />
                  </div>
                  {/* /.card-body */}
                </div>
                {/* /.card */}
              </section>
              {/* right col */}
            </div>
            {/* /.row (main row) */}
          </div>
          {/* /.container-fluid */}
        </section>
        {/* /.content */}
      </div>
    </div>
  );
};

export default Dashboard;
