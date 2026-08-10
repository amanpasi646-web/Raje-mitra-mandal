import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('Mandal Expense');

  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupRole, setSignupRole] = useState('member');

  // Real-time listener for Expenses
  useEffect(() => {
    const unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const expData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expData);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeUsers();
    };
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signupName || !signupMobile) return alert('Name and Mobile required');
    try {
      await addDoc(collection(db, 'users'), {
        name: signupName,
        mobile: signupMobile,
        role: signupRole,
        createdAt: new Date().toISOString()
      });
      alert('Sign Up Successful!');
      setSignupName('');
      setSignupMobile('');
    } catch (err) {
      console.error(err);
      alert('Error signing up: ' + err.message);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return alert('Fill all fields');
    try {
      await addDoc(collection(db, 'expenses'), {
        description,
        amount: Number(amount),
        paidBy,
        category,
        createdAt: new Date().toISOString()
      });
      alert('Expense Added Successfully!');
      setDescription('');
      setAmount('');
      setPaidBy('');
    } catch (err) {
      console.error(err);
      alert('Error adding expense: ' + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: '#b45309' }}>Raje Mitra Mandal Portal</h2>

      {/* Sign Up Section */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <h3>Member Sign-Up</h3>
        <form onSubmit={handleSignUp}>
          <input 
            type="text" 
            placeholder="Name" 
            value={signupName} 
            onChange={e => setSignupName(e.target.value)} 
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
          />
          <input 
            type="text" 
            placeholder="Mobile Number" 
            value={signupMobile} 
            onChange={e => setSignupMobile(e.target.value)} 
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
          />
          <select value={signupRole} onChange={e => setSignupRole(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px' }}>Sign Up</button>
        </form>
      </div>

      {/* Add Expense Section */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <h3>Add Expense (Kharcha)</h3>
        <form onSubmit={handleAddExpense}>
          <input 
            type="text" 
            placeholder="Expense Description (e.g. Tea/Decor)" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
          />
          <input 
            type="number" 
            placeholder="Amount (₹)" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
          />
          <input 
            type="text" 
            placeholder="Paid By (Name)" 
            value={paidBy} 
            onChange={e => setPaidBy(e.target.value)} 
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px' }}>Add Expense</button>
        </form>
      </div>

      {/* Expense List */}
      <div>
        <h3>Live Expenses List ({expenses.length})</h3>
        {expenses.map(exp => (
          <div key={exp.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '8px', borderRadius: '4px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{exp.description}</strong> - ₹{exp.amount} <br/>
              <small style={{ color: '#666' }}>Paid by: {exp.paidBy}</small>
            </div>
            <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}