const { Payment } = require('./Payment');

class CardMethod extends Payment {
  constructor(paymentID, amount, cardNumber, cardHolderName, expiryDate, cvv) {
    super(paymentID, amount);
    this.cardNumber = cardNumber;
    this.cardHolderName = cardHolderName;
    this.expiryDate = expiryDate;
    this.cvv = cvv;
  }

  getPaymentType() {
    return "Card";
  }

  getCardNumber() {
    return this.cardNumber;
  }

  getCardHolderName() {
    return this.cardHolderName;
  }

  getExpiryDate() {
    return this.expiryDate;
  }

  getCvv() {
    return this.cvv;
  }
}

module.exports = { CardMethod };