import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');

  // Firebase Collections State
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [chandaList, setChandaList] = useState([]);

  // Form States
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPass, setSignupPass] = useState('');

  // Expense Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  // Chanda Form
  const [donorName, setDonorName] = useState('');
  const [chandaAmount, setChandaAmount] = useState('');
  const [collectedBy, setCollectedBy] = useState('');

  // Real-time Listener for Firebase
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubChanda = onSnapshot(collection(db, 'chanda'), (snapshot) => {
      setChandaList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUsers(); unsubExpenses(); unsubChanda(); };
  }, []);

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    if ((loginMobile === 'admin' || loginMobile === '9999999999') && loginPass === 'admin123') {
      setCurrentUser({ name: 'Admin', role: 'admin', status: 'approved' });
      setActiveTab('dashboard');
      return;
    }
    const foundUser = users.find(u => u.mobile === loginMobile && u.password === loginPass);
    if (!foundUser) {
      alert('Invalid Mobile Number or Password!');
    } else if (foundUser.status === 'pending') {
      alert('Your account registration is pending Admin approval.');
    } else if (foundUser.status === 'rejected') {
      alert('Your registration request was rejected.');
    } else {
      setCurrentUser(foundUser);
      setActiveTab('dashboard');
    }
  };

  // Handle Sign-Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signupName || !signupMobile || !signupPass) return alert('Please fill all fields');
    try {
      await addDoc(collection(db, 'users'), {
        name: signupName,
        mobile: signupMobile,
        password: signupPass,
        role: 'member',
        status: 'pending',
        createdAt: new Date().toLocaleDateString()
      });
      alert('Sign Up request submitted! Admin will approve your account soon.');
      setSignupName(''); setSignupMobile(''); setSignupPass('');
      setActiveTab('login');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Admin Actions: Approve/Reject/Remove Member
  const handleUserStatus = async (userId, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (err) { alert('Error updating status: ' + err.message); }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (err) { alert('Error deleting user: ' + err.message); }
    }
  };

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return alert('Fill all fields');
    try {
      await addDoc(collection(db, 'expenses'), {
        description,
        amount: Number(amount),
        paidBy,
        date: new Date().toLocaleDateString()
      });
      alert('Expense recorded successfully!');
      setDescription(''); setAmount(''); setPaidBy('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Add Chanda (Vargani)
  const handleAddChanda = async (e) => {
    e.preventDefault();
    if (!donorName || !chandaAmount || !collectedBy) return alert('Fill all fields');
    try {
      await addDoc(collection(db, 'chanda'), {
        donorName,
        amount: Number(chandaAmount),
        collectedBy,
        date: new Date().toLocaleDateString()
      });
      alert('Vargani (Chanda) recorded successfully!');
      setDonorName(''); setChandaAmount(''); setCollectedBy('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Excel Downloads
  const exportExpensesToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "Mandal_Expense_Report.xlsx");
  };

  const exportChandaToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(chandaList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vargani_Chanda");
    XLSX.writeFile(workbook, "Mandal_Vargani_Chanda_Report.xlsx");
  };

  // Calculations
  const todayDate = new Date().toLocaleDateString();
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalChanda = chandaList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayChanda = chandaList
    .filter(item => item.date === todayDate)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '15px' }}>
      <header style={{ backgroundColor: '#b45309', color: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🚩 Raje Mitra Mandal Portal 🚩</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Live Expense & Vargani (Chanda) Tracker</p>
      </header>

      {!currentUser ? (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
            <button onClick={() => setActiveTab('login')} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'login' ? '#b45309' : 'none', color: activeTab === 'login' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
            <button onClick={() => setActiveTab('signup')} style={{ flex: 1, padding: '10px', border: 'none', background: activeTab === 'signup' ? '#b45309' : 'none', color: activeTab === 'signup' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>Sign Up</button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin}>
              <h3>Account Login</h3>
              <input type="text" placeholder="Mobile Number (Admin: 'admin')" value={loginMobile} onChange={e => setLoginMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Password (Admin: 'admin123')" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#b45309', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Login</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <h3>New Member Registration</h3>
              <input type="text" placeholder="Full Name" value={signupName} onChange={e => setSignupName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} required />
              <input type="text" placeholder="Mobile Number" value={signupMobile} onChange={e => setSignupMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Create Password" value={signupPass} onChange={e => setSignupPass(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Registration Request</button>
            </form>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Top Bar */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>User: {currentUser.name}</strong> ({currentUser.role.toUpperCase()})</div>
            <button onClick={() => setCurrentUser(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </div>

          {/* Realtime Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '8px', border: '1px solid #86efac' }}>
              <small style={{ color: '#166534', fontWeight: 'bold' }}>Aaj Ka Total Chanda ({todayDate})</small>
              <h2 style={{ margin: '5px 0 0 0', color: '#15803d' }}>₹{todayChanda}</h2>
            </div>
            <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde047' }}>
              <small style={{ color: '#854d0e', fontWeight: 'bold' }}>Overall Total Chanda</small>
              <h2 style={{ margin: '5px 0 0 0', color: '#b45309' }}>₹{totalChanda}</h2>
            </div>
            <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <small style={{ color: '#991b1b', fontWeight: 'bold' }}>Total Expenses (Kharcha)</small>
              <h2 style={{ margin: '5px 0 0 0', color: '#dc2626' }}>₹{totalExpense}</h2>
            </div>
          </div>

          {/* Admin Member Management Panel */}
          {currentUser.role === 'admin' && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>👑 Admin Panel: Member Management & Approvals</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Name</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Mobile</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Password</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.mobile}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#b45309', fontWeight: 'bold' }}>{u.password || 'N/A'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textTransform: 'capitalize' }}>{u.status}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                          {u.status === 'pending' && (
                            <>
                              <button onClick={() => handleUserStatus(u.id, 'approved')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', marginRight: '4px', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => handleUserStatus(u.id, 'rejected')} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '4px 8px', marginRight: '4px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                            </>
                          )}
                          <button onClick={() => handleRemoveUser(u.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forms Section: Add Chanda & Add Expense */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Add Chanda */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <h3>🧾 Record Vargani (Chanda)</h3>
              <form onSubmit={handleAddChanda} style={{ display: 'grid', gap: '10px' }}>
                <input type="text" placeholder="Donor Name (Kisne Chanda Diya)" value={donorName} onChange={e => setDonorName(e.target.value)} required style={{ padding: '8px' }} />
                <input type="number" placeholder="Amount (₹)" value={chandaAmount} onChange={e => setChandaAmount(e.target.value)} required style={{ padding: '8px' }} />
                <input type="text" placeholder="Collected By (Kiske Paas Jama Hua)" value={collectedBy} onChange={e => setCollectedBy(e.target.value)} required style={{ padding: '8px' }} />
                <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Add Chanda</button>
              </form>
            </div>

            {/* Add Expense */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <h3>💸 Record Expense (Kharcha)</h3>
              <form onSubmit={handleAddExpense} style={{ display: 'grid', gap: '10px' }}>
                <input type="text" placeholder="Description (e.g. Tea / Stage Decor)" value={description} onChange={e => setDescription(e.target.value)} required style={{ padding: '8px' }} />
                <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ padding: '8px' }} />
                <input type="text" placeholder="Paid By Name" value={paidBy} onChange={e => setPaidBy(e.target.value)} required style={{ padding: '8px' }} />
                <button type="submit" style={{ background: '#b45309', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Add Expense</button>
              </form>
            </div>
          </div>

          {/* Reports & Lists */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Chanda List */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Vargani (Chanda) List</h3>
                <button onClick={exportChandaToExcel} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📊 Download Chanda Report</button>
              </div>
              {chandaList.map(c => (
                <div key={c.id} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{c.donorName}</strong> - ₹{c.amount}
                    <br /><small style={{ color: '#666' }}>Collected by: {c.collectedBy} | Date: {c.date}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Expense List */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Expenses List</h3>
                <button onClick={exportExpensesToExcel} style={{ background: '#b45309', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📊 Download Expense Report</button>
              </div>
              {expenses.map(exp => (
                <div key={exp.id} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{exp.description}</strong> - ₹{exp.amount}
                    <br /><small style={{ color: '#666' }}>Paid by: {exp.paidBy} | Date: {exp.date}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
