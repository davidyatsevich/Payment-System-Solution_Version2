import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, Receipt, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// API Client
class PaymentAPI {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async getInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}`);
  }

  static async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: invoiceData,
    });
  }

  static async addCardPayment(invoiceId, cardData) {
    return this.request(`/invoices/${invoiceId}/card-payment`, {
      method: 'POST',
      body: cardData,
    });
  }

  static async addChequePayment(invoiceId, chequeData) {
    return this.request(`/invoices/${invoiceId}/cheque-payment`, {
      method: 'POST',
      body: chequeData,
    });
  }

  static async removePayment(invoiceId, paymentId) {
    return this.request(`/invoices/${invoiceId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  static async getNextPaymentId() {
    return this.request('/next-payment-id');
  }
}

// Notification Component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center">
        {type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
        {message}
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
};

const PaymentSystem = () => {
  const [activeTab, setActiveTab] = useState('card');
  const [nextPaymentID, setNextPaymentID] = useState(1001);
  const [currentInvoice, setCurrentInvoice] = useState({
    invoiceID: 1001,
    customerName: "Default Customer",
    payments: [],
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form states
  const [cardForm, setCardForm] = useState({
    amount: 100.00,
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: 123
  });

  const [chequeForm, setChequeForm] = useState({
    amount: 100.00,
    chequeNumber: 123456,
    bankName: '',
    accountHolder: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceID: 1001,
    customerName: 'Default Customer'
  });

  // Initialize system - Connect to backend
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        setLoading(true);
        const invoice = await PaymentAPI.getInvoice(1001);
        setCurrentInvoice(invoice);
        
        const { nextPaymentID } = await PaymentAPI.getNextPaymentId();
        setNextPaymentID(nextPaymentID);
      } catch (err) {
        console.error('Failed to initialize:', err);
        try {
          await PaymentAPI.createInvoice({
            invoiceID: 1001,
            customerName: 'Default Customer'
          });
          const invoice = await PaymentAPI.getInvoice(1001);
          setCurrentInvoice(invoice);
        } catch (createErr) {
          showNotification('Failed to initialize payment system', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeSystem();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const refreshInvoice = async () => {
    try {
      setLoading(true);
      const updatedInvoice = await PaymentAPI.getInvoice(currentInvoice.invoiceID);
      setCurrentInvoice(updatedInvoice);
    } catch (err) {
      showNotification('Failed to refresh invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add card payment - Now uses backend models
  const addCardPayment = async () => {
    if (!cardForm.cardNumber || !cardForm.cardHolder) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setLoading(true);
      const result = await PaymentAPI.addCardPayment(currentInvoice.invoiceID, cardForm);
      setNextPaymentID(result.nextPaymentID);
      await refreshInvoice();
      clearCardForm();
      showNotification(result.message, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to add card payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add cheque payment - Now uses backend models
  const addChequePayment = async () => {
    if (!chequeForm.bankName || !chequeForm.accountHolder) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setLoading(true);
      const result = await PaymentAPI.addChequePayment(currentInvoice.invoiceID, chequeForm);
      setNextPaymentID(result.nextPaymentID);
      await refreshInvoice();
      clearChequeForm();
      showNotification(result.message, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to add cheque payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createNewInvoice = async () => {
    if (!invoiceForm.invoiceID || !invoiceForm.customerName) {
      showNotification('Please enter valid invoice details.', 'error');
      return;
    }

    try {
      setLoading(true);
      await PaymentAPI.createInvoice(invoiceForm);
      const newInvoice = await PaymentAPI.getInvoice(invoiceForm.invoiceID);
      setCurrentInvoice(newInvoice);
      showNotification('Invoice created successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to create invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removePayment = async (paymentID) => {
    try {
      setLoading(true);
      await PaymentAPI.removePayment(currentInvoice.invoiceID, paymentID);
      await refreshInvoice();
      showNotification('Payment removed successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to remove payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearCardForm = () => {
    setCardForm({
      amount: 100.00,
      cardNumber: '',
      cardHolder: '',
      expiry: '',
      cvv: 123
    });
  };

  const clearChequeForm = () => {
    setChequeForm({
      amount: 100.00,
      chequeNumber: 123456,
      bankName: '',
      accountHolder: ''
    });
  };

  const showPaymentDetails = (payment) => {
    let details = `Payment ID: ${payment.paymentID}\nType: ${payment.type}\nAmount: $${payment.amount.toFixed(2)}\n\n`;
    
    if (payment.type === 'Card') {
      details += `Card Number: ${payment.details.cardNumber}\nCard Holder: ${payment.details.cardHolder}\nExpiry: ${payment.details.expiry}\nCVV: ${payment.details.cvv}`;
    } else {
      details += `Cheque Number: ${payment.details.chequeNumber}\nBank Name: ${payment.details.bankName}\nAccount Holder: ${payment.details.accountHolder}`;
    }
    
    alert(details);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Payment System (React+Node) GUI</h1>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              className={`flex items-center px-6 py-4 font-medium ${
                activeTab === 'card' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('card')}
              disabled={loading}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Card Payment
            </button>
            <button
              className={`flex items-center px-6 py-4 font-medium ${
                activeTab === 'cheque' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('cheque')}
              disabled={loading}
            >
              <FileText className="w-5 h-5 mr-2" />
              Cheque Payment
            </button>
            <button
              className={`flex items-center px-6 py-4 font-medium ${
                activeTab === 'invoice' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('invoice')}
              disabled={loading}
            >
              <Receipt className="w-5 h-5 mr-2" />
              Invoice
            </button>
          </div>
        </div>

        {/* Card Payment Tab */}
        {activeTab === 'card' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add Card Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment ID</label>
                <input
                  type="text"
                  value={nextPaymentID}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={cardForm.amount}
                  onChange={(e) => setCardForm(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  maxLength="16"
                  placeholder="1234567890123456"
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm(prev => ({...prev, cardNumber: e.target.value.replace(/\D/g, '')}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardForm.cardHolder}
                  onChange={(e) => setCardForm(prev => ({...prev, cardHolder: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="text"
                  maxLength="5"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    setCardForm(prev => ({...prev, expiry: value}));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                <input
                  type="number"
                  min="100"
                  max="9999"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm(prev => ({...prev, cvv: parseInt(e.target.value) || 123}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={addCardPayment}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Add Card Payment
              </button>
              <button
                onClick={clearCardForm}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Clear Form
              </button>
            </div>
          </div>
        )}

        {/* Cheque Payment Tab */}
        {activeTab === 'cheque' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add Cheque Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment ID</label>
                <input
                  type="text"
                  value={nextPaymentID}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={chequeForm.amount}
                  onChange={(e) => setChequeForm(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Number</label>
                <input
                  type="number"
                  value={chequeForm.chequeNumber}
                  onChange={(e) => setChequeForm(prev => ({...prev, chequeNumber: parseInt(e.target.value) || 123456}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  placeholder="Bank of Example"
                  value={chequeForm.bankName}
                  onChange={(e) => setChequeForm(prev => ({...prev, bankName: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={chequeForm.accountHolder}
                  onChange={(e) => setChequeForm(prev => ({...prev, accountHolder: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={addChequePayment}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Add Cheque Payment
              </button>
              <button
                onClick={clearChequeForm}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Clear Form
              </button>
            </div>
          </div>
        )}

        {/* Invoice Tab */}
        {activeTab === 'invoice' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Invoice Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice ID</label>
                  <input
                    type="number"
                    value={invoiceForm.invoiceID}
                    onChange={(e) => setInvoiceForm(prev => ({...prev, invoiceID: parseInt(e.target.value) || 1001}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={invoiceForm.customerName}
                    onChange={(e) => setInvoiceForm(prev => ({...prev, customerName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <button
                    onClick={createNewInvoice}
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    Create New Invoice
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Payments</h3>
                  <div className="text-lg font-bold text-green-600 bg-green-100 px-4 py-2 rounded-md border-2 border-green-600">
                    Total: ${currentInvoice.totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentInvoice.payments.map((payment, index) => (
                        <tr key={payment.paymentID} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 text-sm">{payment.paymentID}</td>
                          <td className="px-4 py-2 text-sm">{payment.type}</td>
                          <td className="px-4 py-2 text-sm">${payment.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => showPaymentDetails(payment)}
                                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                title="View Details"
                                disabled={loading}
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removePayment(payment.paymentID)}
                                className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                                title="Remove Payment"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentInvoice.payments.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            No payments added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Invoice Details</h3>
            <button
              onClick={refreshInvoice}
              disabled={loading}
              style={{ backgroundColor: 'orange', color: 'white', padding: '10px', display: 'block', zIndex: 9999 }}
            >
              🔄 Refresh
            </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-md font-mono text-sm whitespace-pre-line">
                  {`========== INVOICE ==========
                    Invoice ID: ${currentInvoice.invoiceID}
                    Customer: ${currentInvoice.customerName}
                    Total Amount: $${currentInvoice.totalAmount.toFixed(2)}
                    Number of Payments: ${currentInvoice.payments.length}

                    ${currentInvoice.payments.map((payment, index) => 
                    `Payment #${index + 1}:
                      ID: ${payment.paymentID}
                      Type: ${payment.type}
                      Amount: $${payment.amount.toFixed(2)}
                    ----------------------------`
                    ).join('\n')}
                    ============================`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSystem;