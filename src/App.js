// const predefinedCategories = {
//   income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Rental Income', 'Business Profits', 'Agriculture', 'Interest Income', 'Dividends', 'Capital gains', 'Pension', 'Stipend', 'Bonus', 'Comission'],
//   expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Education', 'Loan', 'Stationary', 'Insurance', 'Travel', 'Donation', 'Household', 'Mobile Bills', 'Internet Bills', 'Childcare', 'Subscription Fees', 'Festivals', 'Pet Care', 'Car wash', 'Car Park', 'Fuel Expense', 'Home Appliances', 'Electricity Bills', 'School fees', 'College Fees'],
// };
import React, { useState, useEffect, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './App.css';

const App = () => {
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [formType, setFormType] = useState('income'); // 'income' or 'expense'
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const predefinedCategories = {
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Rental Income', 'Business Profits', 'Agriculture', 'Interest Income', 'Dividends', 'Capital gains', 'Pension', 'Stipend', 'Bonus', 'Comission'],
    expense: ['Rent', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Healthcare', 'Education', 'Loan', 'Stationary', 'Insurance', 'Travel', 'Donation', 'Household', 'Mobile Bills', 'Internet Bills', 'Childcare', 'Subscription Fees', 'Festivals', 'Pet Care', 'Car wash', 'Car Park', 'Fuel Expense', 'Home Appliances', 'Electricity Bills', 'School fees', 'College Fees'],
  };

  useEffect(() => {
    const savedIncome = JSON.parse(localStorage.getItem('income')) || [];
    const savedExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    setIncome(savedIncome);
    setExpenses(savedExpenses);
  }, []);

  useEffect(() => {
    localStorage.setItem('income', JSON.stringify(income));
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [income, expenses]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Browser does not support SpeechRecognition');
      return;
    }
    recognitionRef.current = new window.webkitSpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
      processVoiceCommand(text);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, []);

  const processVoiceCommand = (transcript) => {
    const lowerTranscript = transcript.toLowerCase();
    const amountMatch = lowerTranscript.match(/(?:amount|total|value)?\s*(\d+\.?\d*)\s*(?:rupees?|inr|money)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    const type = lowerTranscript.includes('expense') ? 'expense' : (lowerTranscript.includes('income') ? 'income' : null);
    const possibleCategories = [...predefinedCategories.income, ...predefinedCategories.expense];
    let category = possibleCategories.find(cat => lowerTranscript.includes(cat.toLowerCase())) || 'Miscellaneous';
    const date = new Date().toISOString().split('T')[0];

    if (type && amount !== null) {
      addTransaction(type, category, amount, date);
    } else {
      console.error('Could not parse voice command correctly:', { type, category, amount });
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const addTransaction = (type, category, amount, date) => {
    if (type === 'income') {
      setIncome((prevIncome) => [...prevIncome, { category, amount, date }]);
    } else if (type === 'expense') {
      setExpenses((prevExpenses) => [...prevExpenses, { category, amount, date }]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formAmount && formCategory) {
      addTransaction(formType, formCategory, parseFloat(formAmount), formDate);
      setFormCategory('');
      setFormAmount('');
      setFormDate(new Date().toISOString().split('T')[0]);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('income');
    localStorage.removeItem('expenses');
    setIncome([]);
    setExpenses([]);
  };

  const incomeChartData = {
    labels: income.map(i => i.category),
    datasets: [
      {
        data: income.map(i => i.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const expenseChartData = {
    labels: expenses.map(e => e.category),
    datasets: [
      {
        data: expenses.map(e => e.amount),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <h1>Expense Tracker</h1>
      </header>

      <hr />

      <div className="container">
        <div className="chart-container">
          <h2>Income Chart</h2>
          {income.length > 0 ? <Pie data={incomeChartData} /> : <p>No income data available</p>}
        </div>
        <div className="expense-tracker">
          <h2>Add a Transaction</h2>
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            disabled={isListening}
          >
            {isListening ? 'Listening...' : 'Hold to Speak'}
          </button>
          <form onSubmit={handleFormSubmit}>
            <div>
              <label>
                Type:
                <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>
            </div>
            <div>
              <label>
                Category:
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {predefinedCategories[formType].map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label>
                Amount:
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  step="0.01"
                  required
                />
              </label>
            </div>
            <div>
              <label>
                Date:
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </label>
            </div>
            <button className="add-record" type="submit">Add Record</button>
          </form>
          <button className="clear-data" onClick={clearLocalStorage}>
            Clear All Data
          </button>
          <div className="transaction-list">
            {expenses.map((e, i) => (
              <div key={i} className="transaction-item">
                <strong>{e.category}</strong>: ${e.amount} on {e.date}
              </div>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <h2>Expense Chart</h2>
          {expenses.length > 0 ? <Pie data={expenseChartData} /> : <p>No expense data available</p>}
        </div>
      </div>

      <hr />

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
