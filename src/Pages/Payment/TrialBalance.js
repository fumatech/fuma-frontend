import React, { useState, useEffect } from "react";

function TrialBalance() {
  const [supplierDue, setSupplierDue] = useState(0.0);
  const [customerDue, setCustomerDue] = useState(0.0);
  const [accountBalances, setAccountBalances] = useState([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toLocaleDateString());

    const fetchData = async () => {
      try {
        const balances = await getAccountBalances();

        // Filter only "actual accounts"
        const actualAccounts = balances.filter(
          (b) =>
            !b.accountName.toLowerCase().includes("supplier") &&
            !b.accountName.toLowerCase().includes("customer") &&
            !b.accountName.toLowerCase().includes("purchase") &&
            !b.accountName.toLowerCase().includes("sales")
        );

        setAccountBalances(actualAccounts);
        calculateTotals(balances, actualAccounts);
      } catch (error) {
        console.error("Error fetching account balances:", error);
      }
    };

    fetchData();
  }, []);

  const getAccountBalances = async () => {
    const response = await fetch(
      `${process.env.REACT_APP_BASE_URL}/trail-balance/get`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    
    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
    
    return data;
  };

  const calculateTotals = (balances, actualAccounts) => {
    // Supplier due = total credit of all supplier accounts
    const supplier = balances
      .filter((b) => b.accountName.toLowerCase().includes("supplier"))
      .reduce((acc, b) => acc + (b.credit || 0), 0);

    // Customer due = total debit of all customer accounts
    const customer = balances
      .filter((b) => b.accountName.toLowerCase().includes("customer"))
      .reduce((acc, b) => acc + (b.debit || 0), 0);

    setSupplierDue(supplier);
    setCustomerDue(customer);

    // Calculate total debit/credit for actual account balances
    let debitSum = 0;
    let creditSum = 0;
    actualAccounts.forEach((b) => {
      if (b.balance >= 0) debitSum += b.balance;
      else creditSum += Math.abs(b.balance);
    });

    setTotalDebit(debitSum + customer); // include customer due in debit
    setTotalCredit(creditSum + supplier); // include supplier due in credit
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    const printContent = `
      <html>
        <head>
          <title>Trial Balance</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; text-align: left; }
            h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Awesome Shop - Trial Balance - ${currentDate}</h2>
          <table>
            <thead>
              <tr>
                <th>Trial Balance</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Supplier Due:</th>
                <td>&nbsp;</td>
                <td>${supplierDue.toFixed(2)}</td>
              </tr>
              <tr>
                <th>Customer Due:</th>
                <td>${customerDue.toFixed(2)}</td>
                <td>&nbsp;</td>
              </tr>
              <tr>
                <th>Account Balances:</th>
                <td colspan="2">&nbsp;</td>
              </tr>
              ${accountBalances
                .map(
                  (b) => `
                  <tr>
                    <th>${b.accountName}</th>
                    <td>${b.balance >= 0 ? b.balance.toFixed(2) : ""}</td>
                    <td>${
                      b.balance < 0 ? Math.abs(b.balance).toFixed(2) : ""
                    }</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <td>${totalDebit.toFixed(2)}</td>
                <td>${totalCredit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Trial Balance</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage balance
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="card-body">
                <div className="box box-solid" id="printSection">
                  <div className="box-header">
                    <h3 className="box-title">
                      Awesome Shop - Trial Balance -{" "}
                      <span id="hidden_date">{currentDate}</span>
                    </h3>
                  </div>
                  <div className="box-body">
                    <table  className="table" >
                      <thead>
                        <tr>
                          <th>Trial Balance</th>
                          <th>Debit</th>
                          <th>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th>Supplier Due:</th>
                          <td>&nbsp;</td>
                          <td>{supplierDue.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th>Customer Due:</th>
                          <td>{customerDue.toFixed(2)}</td>
                          <td>&nbsp;</td>
                        </tr>
                        <tr>
                          <th>Account Balances:</th>
                          <td colSpan="2">&nbsp;</td>
                        </tr>
                        {accountBalances.map((b, index) => (
                          <tr key={index}>
                            <th>{b.accountName}</th>
                            <td>
                              {b.balance >= 0 ? b.balance.toFixed(2) : ""}
                            </td>
                            <td>
                              {b.balance < 0
                                ? Math.abs(b.balance).toFixed(2)
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th>Total:</th>
                          <td>
                            <b>{totalDebit.toFixed(2)}</b>
                          </td>
                          <td>
                            <b>{totalCredit.toFixed(2)}</b>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="box-footer">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handlePrint}
                    >
                      <i className="fa fa-print" /> Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TrialBalance;
