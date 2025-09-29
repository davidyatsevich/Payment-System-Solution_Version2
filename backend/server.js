// server.js - Main Express server
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import our classes
const { Payment } = require('./models/Payment');
const { CardMethod } = require('./models/CardMethod');
const { ChequeMethod } = require('./models/ChequeMethod');
const { Invoice } = require('./models/Invoice');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage (in production, use a database)
let invoices = new Map();
let nextPaymentID = 1001;
let nextInvoiceID = 1001;

// Initialize with default invoice
const defaultInvoice = new Invoice(1001, "Default Customer");
invoices.set(1001, defaultInvoice);

// Routes

// Get all invoices
app.get('/api/invoices', (req, res) => {
  const invoiceList = Array.from(invoices.values()).map(invoice => ({
    invoiceID: invoice.getInvoiceID(),
    customerName: invoice.getCustomerName(),
    totalAmount: invoice.getTotalAmount(),
    paymentCount: invoice.getListOfPayments().length
  }));
  
  res.json(invoiceList);
});

// Get specific invoice with all payments
app.get('/api/invoices/:id', (req, res) => {
  const invoiceID = parseInt(req.params.id);
  const invoice = invoices.get(invoiceID);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  const payments = invoice.getListOfPayments().map(payment => {
    const basePayment = {
      paymentID: payment.getPaymentID(),
      type: payment.getPaymentType(),
      amount: payment.getAmount()
    };
    
    // Add specific details based on payment type
    if (payment instanceof CardMethod) {
      basePayment.details = {
        cardNumber: payment.getCardNumber(),
        cardHolder: payment.getCardHolderName(),
        expiry: payment.getExpiryDate(),
        cvv: payment.getCvv()
      };
    } else if (payment instanceof ChequeMethod) {
      basePayment.details = {
        chequeNumber: payment.getChequeNumber(),
        bankName: payment.getBankName(),
        accountHolder: payment.getAccountHolderName()
      };
    }
    
    return basePayment;
  });
  
  res.json({
    invoiceID: invoice.getInvoiceID(),
    customerName: invoice.getCustomerName(),
    totalAmount: invoice.getTotalAmount(),
    payments: payments
  });
});

// Create new invoice
app.post('/api/invoices', (req, res) => {
  const { invoiceID, customerName } = req.body;
  
  if (!invoiceID || !customerName) {
    return res.status(400).json({ error: 'Invoice ID and customer name are required' });
  }
  
  if (invoices.has(invoiceID)) {
    return res.status(409).json({ error: 'Invoice ID already exists' });
  }
  
  const newInvoice = new Invoice(invoiceID, customerName);
  invoices.set(invoiceID, newInvoice);
  
  if (invoiceID >= nextInvoiceID) {
    nextInvoiceID = invoiceID + 1;
  }
  
  res.status(201).json({
    invoiceID: newInvoice.getInvoiceID(),
    customerName: newInvoice.getCustomerName(),
    totalAmount: newInvoice.getTotalAmount(),
    message: 'Invoice created successfully'
  });
});

// Add card payment to invoice
app.post('/api/invoices/:id/card-payment', (req, res) => {
  const invoiceID = parseInt(req.params.id);
  const { amount, cardNumber, cardHolder, expiry, cvv } = req.body;
  
  const invoice = invoices.get(invoiceID);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  // Validation
  if (!amount || !cardNumber || !cardHolder || !expiry || !cvv) {
    return res.status(400).json({ error: 'All card payment fields are required' });
  }
  
  try {
    const cardPayment = new CardMethod(
      nextPaymentID,
      parseFloat(amount),
      parseInt(cardNumber),
      cardHolder,
      expiry,
      parseInt(cvv)
    );
    
    invoice.addPayment(cardPayment);
    nextPaymentID++;
    
    res.json({
      paymentID: cardPayment.getPaymentID(),
      type: cardPayment.getPaymentType(),
      amount: cardPayment.getAmount(),
      message: 'Card payment added successfully',
      nextPaymentID: nextPaymentID
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add card payment: ' + error.message });
  }
});

// Add cheque payment to invoice
app.post('/api/invoices/:id/cheque-payment', (req, res) => {
  const invoiceID = parseInt(req.params.id);
  const { amount, chequeNumber, bankName, accountHolder } = req.body;
  
  const invoice = invoices.get(invoiceID);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  // Validation
  if (!amount || !chequeNumber || !bankName || !accountHolder) {
    return res.status(400).json({ error: 'All cheque payment fields are required' });
  }
  
  try {
    const chequePayment = new ChequeMethod(
      nextPaymentID,
      parseFloat(amount),
      parseInt(chequeNumber),
      bankName,
      accountHolder
    );
    
    invoice.addPayment(chequePayment);
    nextPaymentID++;
    
    res.json({
      paymentID: chequePayment.getPaymentID(),
      type: chequePayment.getPaymentType(),
      amount: chequePayment.getAmount(),
      message: 'Cheque payment added successfully',
      nextPaymentID: nextPaymentID
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add cheque payment: ' + error.message });
  }
});

// Remove payment from invoice
app.delete('/api/invoices/:invoiceId/payments/:paymentId', (req, res) => {
  const invoiceID = parseInt(req.params.invoiceId);
  const paymentID = parseInt(req.params.paymentId);
  
  const invoice = invoices.get(invoiceID);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  try {
    const removed = invoice.removePayment(paymentID);
    if (removed) {
      res.json({ message: 'Payment removed successfully' });
    } else {
      res.status(404).json({ error: 'Payment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove payment: ' + error.message });
  }
});

// Get next payment ID
app.get('/api/next-payment-id', (req, res) => {
  res.json({ nextPaymentID });
});

// Delete invoice
app.delete('/api/invoices/:id', (req, res) => {
  const invoiceID = parseInt(req.params.id);
  
  if (invoices.has(invoiceID)) {
    invoices.delete(invoiceID);
    res.json({ message: 'Invoice deleted successfully' });
  } else {
    res.status(404).json({ error: 'Invoice not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment System Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;
