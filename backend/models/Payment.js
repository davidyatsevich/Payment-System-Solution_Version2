class Payment {
  constructor(paymentID, amount) {
    if (this.constructor === Payment) {
      throw new Error("Cannot instantiate abstract class Payment directly");
    }
    this.paymentID = paymentID;
    this.amount = amount;
  }

  getPaymentID() {
    return this.paymentID;
  }

  getAmount() {
    return this.amount;
  }

  getPaymentType() {
    throw new Error("getPaymentType() must be implemented by subclasses");
  }
}

module.exports = { Payment };
