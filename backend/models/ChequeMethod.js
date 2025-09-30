const { Payment } = require('./Payment');
//==============================
// Constructor
class ChequeMethod extends Payment {
  constructor(paymentID, amount, chequeNumber, bankName, accountHolderName) {
    super(paymentID, amount);
    this.chequeNumber = chequeNumber;
    this.bankName = bankName;
    this.accountHolderName = accountHolderName;
  }
  //==============================
  // Getters
  getPaymentType() {
    return "Cheque";
  }

  getChequeNumber() {
    return this.chequeNumber;
  }

  getBankName() {
    return this.bankName;
  }

  getAccountHolderName() {
    return this.accountHolderName;
  }
}

module.exports = { ChequeMethod };
