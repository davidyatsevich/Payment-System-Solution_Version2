class Invoice {
  //==============================
  // Constructor
  constructor(invoiceID, customerName) {
    this.invoiceID = invoiceID;
    this.customerName = customerName;
    this.listOfPayments = [];
    this.totalAmount = 0;
  }
  
  addPayment(payment) {
    this.listOfPayments.push(payment);
    this.totalAmount += payment.getAmount();
  }

  removePayment(paymentID) {
    const index = this.listOfPayments.findIndex(payment => payment.getPaymentID() === paymentID);
    if (index !== -1) {
      const removedPayment = this.listOfPayments.splice(index, 1)[0];
      this.totalAmount -= removedPayment.getAmount();
      return true;
    }
    return false;
  }
  //==============================
  // Getters
  getInvoiceID() {
    return this.invoiceID;
  }

  getCustomerName() {
    return this.customerName;
  }

  getListOfPayments() {
    return this.listOfPayments;
  }

  getTotalAmount() {
    return this.totalAmount;
  }
}

module.exports = { Invoice };
