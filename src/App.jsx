import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('login');

  // Firebase Collections State
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [chandaList, setChandaList] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [officialStatus, setOfficialStatus] = useState('');
  const [targetGoal, setTargetGoal] = useState({ date: '12/08/2026', amount: '20000' });

  // Form States
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPass, setSignupPass] = useState('');

  // Expense & Chanda Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const [donorName, setDonorName] = useState('');
  const [chandaAmount, setChandaAmount] = useState('');
  const [collectedBy, setCollectedBy] = useState('');

  // Admin Inputs
  const [newStatusText, setNewStatusText] = useState('');
  const [inputTargetDate, setInputTargetDate] = useState('');
  const [inputTargetAmount, setInputTargetAmount] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Real-time Listeners
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
    const unsubChat = onSnapshot(collection(db, 'messages'), (snapshot) => {
      setChatMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAnnounce = onSnapshot(doc(db, 'settings', 'announcement'), (docSnap) => {
      if (docSnap.exists()) setOfficialStatus(docSnap.data().text || '');
    });
    const unsubTarget = onSnapshot(doc(db, 'settings', 'targetGoal'), (docSnap) => {
      if (docSnap.exists()) setTargetGoal(docSnap.data());
    });

    return () => { unsubUsers(); unsubExpenses(); unsubChanda(); unsubChat(); unsubAnnounce(); unsubTarget(); };
  }, []);

  // Helper: Format Custom User ID (Name + Last 2 Digits of Mobile)
  const getUserCustomId = (name, mobile) => {
    const cleanName = (name || 'Member').trim().replace(/\s+/g, '');
    const cleanMobile = (mobile || '00').slice(-2);
    return `${cleanName}${cleanMobile}`;
  };

  // Fixed & Smooth Login Handling
  const handleLogin = (e) => {
    e.preventDefault();
    const inputId = loginMobile.trim();
    const inputPassword = loginPass.trim();

    // 1. Admin Logins
    if ((inputId === 'admin' || inputId === '9999999999') && inputPassword === 'aman2026') {
      setCurrentUser({ name: 'Admin', userId: 'Admin99', role: 'admin', status: 'approved' });
      return;
    }
    if (inputId.toLowerCase() === 'akshay' && inputPassword === 'Raje2026') {
      setCurrentUser({ name: 'Akshay (Admin)', userId: 'Akshay88', role: 'admin', status: 'approved' });
      return;
    }

    // 2. Member Logins
    const foundUser = users.find(u => 
      (u.mobile === inputId || u.userId === inputId || u.name.toLowerCase() === inputId.toLowerCase()) && 
      u.password === inputPassword
    );

    if (!foundUser) {
      alert('Invalid Username/Mobile Number or Password! Please try again.');
    } else if (foundUser.status === 'pending') {
      alert('Your account registration is pending Admin approval.');
    } else if (foundUser.status === 'rejected') {
      alert('Your registration request was rejected.');
    } else {
      const customId = foundUser.userId || getUserCustomId(foundUser.name, foundUser.mobile);
      setCurrentUser({ ...foundUser, userId: customId });
    }
  };

  // Sign-Up Handling
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signupName || !signupMobile || !signupPass) return alert('Please fill all fields');
    const customId = getUserCustomId(signupName, signupMobile);
    try {
      await addDoc(collection(db, 'users'), {
        name: signupName,
        mobile: signupMobile,
        password: signupPass,
        userId: customId,
        role: 'member',
        status: 'pending',
        createdAt: new Date().toLocaleDateString()
      });
      alert(`Sign Up request submitted! Your User ID will be: ${customId}`);
      setSignupName(''); setSignupMobile(''); setSignupPass('');
      setActiveTab('login');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Admin Actions
  const handleUserStatus = async (userId, newStatus) => {
    try { await updateDoc(doc(db, 'users', userId), { status: newStatus }); } catch (err) { alert('Error: ' + err.message); }
  };

  const handleRemoveUser = async (userId) => {
    if (window.confirm('Remove this member?')) {
      try { await deleteDoc(doc(db, 'users', userId)); } catch (err) { alert('Error: ' + err.message); }
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense entry?')) {
      try { await deleteDoc(doc(db, 'expenses', id)); } catch (err) { alert('Error: ' + err.message); }
    }
  };

  const handleDeleteChanda = async (id) => {
    if (window.confirm('Delete this Vargani entry?')) {
      try { await deleteDoc(doc(db, 'chanda', id)); } catch (err) { alert('Error: ' + err.message); }
    }
  };

  // Updates
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatusText) return;
    try {
      await setDoc(doc(db, 'settings', 'announcement'), { text: newStatusText });
      alert('Announcement published!');
      setNewStatusText('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleUpdateTarget = async (e) => {
    e.preventDefault();
    if (!inputTargetDate || !inputTargetAmount) return alert('Fill Date and Amount');
    try {
      await setDoc(doc(db, 'settings', 'targetGoal'), {
        date: inputTargetDate,
        amount: inputTargetAmount
      });
      alert('Target Vargani updated!');
      setInputTargetDate(''); setInputTargetAmount('');
    } catch (err) { alert('Error: ' + err.message); }
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
        addedByName: currentUser.name,
        addedByUserId: currentUser.userId,
        date: new Date().toLocaleDateString()
      });
      alert('Expense recorded successfully!');
      setDescription(''); setAmount(''); setPaidBy('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Add Chanda
  const handleAddChanda = async (e) => {
    e.preventDefault();
    if (!donorName || !chandaAmount || !collectedBy) return alert('Fill all fields');
    try {
      await addDoc(collection(db, 'chanda'), {
        donorName,
        amount: Number(chandaAmount),
        collectedBy,
        addedByName: currentUser.name,
        addedByUserId: currentUser.userId,
        date: new Date().toLocaleDateString()
      });
      alert('Vargani recorded successfully!');
      setDonorName(''); setChandaAmount(''); setCollectedBy('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput) return;
    try {
      await addDoc(collection(db, 'messages'), {
        sender: currentUser.name,
        userId: currentUser.userId,
        role: currentUser.role,
        text: chatInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setChatInput('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Clean Excel Reports (With Name + 2 Digit Mobile User ID)
  const exportExpensesToExcel = () => {
    const cleanData = expenses.map(e => ({
      'Description': e.description,
      'Amount (INR)': e.amount,
      'Paid By': e.paidBy,
      'Entered By Name': e.addedByName || 'N/A',
      'Entered By User ID': e.addedByUserId || 'N/A',
      'Date': e.date
    }));
    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "Mandal_Expense_Report.xlsx");
  };

  const exportChandaToExcel = () => {
    const cleanData = chandaList.map(c => ({
      'Donor Name': c.donorName,
      'Amount (INR)': c.amount,
      'Collected By': c.collectedBy,
      'Entered By Name': c.addedByName || 'N/A',
      'Entered By User ID': c.addedByUserId || 'N/A',
      'Date': c.date
    }));
    const worksheet = XLSX.utils.json_to_sheet(cleanData);
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
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Live Expense & Vargani (Chanda) Management</p>
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
              <input type="text" placeholder="Mobile Number or Username" value={loginMobile} onChange={e => setLoginMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#b45309', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <h3>New Member Registration</h3>
              <input type="text" placeholder="Full Name" value={signupName} onChange={e => setSignupName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} required />
              <input type="text" placeholder="Mobile Number" value={signupMobile} onChange={e => setSignupMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Create Password" value={signupPass} onChange={e => setSignupPass(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Registration Request</button>
            </form>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Top User Bar */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>User: {currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              <span style={{ marginLeft: '10px', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', color: '#b45309', fontWeight: 'bold' }}>
                User ID: {currentUser.userId}
              </span>
            </div>
            <button onClick={() => setCurrentUser(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
          </div>

          {/* Target Vargani Banner */}
          <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <small style={{ color: '#15803d', fontWeight: 'bold', fontSize: '13px' }}>🎯 TARGET VARGANI (CHANDA)</small>
            <h2 style={{ margin: '5px 0 0 0', color: '#166534', fontSize: '24px' }}>
              Total Vargani ({targetGoal.date}): ₹{Number(targetGoal.amount).toLocaleString('en-IN')}
            </h2>
          </div>

          {/* Official Announcement Board */}
          {officialStatus && (
            <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #93c5fd', marginBottom: '20px' }}>
              <small style={{ color: '#1e40af', fontWeight: 'bold' }}>📢 OFFICIAL ANNOUNCEMENT:</small>
              <h3 style={{ margin: '5px 0 0 0', color: '#1e3a8a' }}>{officialStatus}</h3>
            </div>
          )}

          {/* Admin Control Section */}
          {currentUser.role === 'admin' && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
              <h3>👑 Admin Panel: Updates & Target Setter</h3>
              
              {/* Set Target Vargani */}
              <form onSubmit={handleUpdateTarget} style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Target Date (e.g. 12/08/2026)" value={inputTargetDate} onChange={e => setInputTargetDate(e.target.value)} style={{ padding: '8px', flex: 1 }} required />
                <input type="number" placeholder="Target Amount in ₹ (e.g. 20000)" value={inputTargetAmount} onChange={e => setInputTargetAmount(e.target.value)} style={{ padding: '8px', flex: 1 }} required />
                <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Update Target Banner</button>
              </form>

              {/* Set Announcement */}
              <form onSubmit={handleUpdateStatus} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Announcement text..." value={newStatusText} onChange={e => setNewStatusText(e.target.value)} style={{ flex: 1, padding: '8px' }} required />
                <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Publish Update</button>
              </form>
            </div>
          )}

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

          {/* Admin Member Management Table */}
          {currentUser.role === 'admin' && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3>👑 Admin Panel: Member Management</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd' }}>User ID</th>
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
                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#b45309', fontWeight: 'bold' }}>{u.userId || getUserCustomId(u.name, u.mobile)}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.mobile}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{u.password || 'N/A'}</td>
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

          {/* Forms Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <h3>🧾 Record Vargani (Chanda)</h3>
              <form onSubmit={handleAddChanda} style={{ display: 'grid', gap: '10px' }}>
                <input type="text" placeholder="Donor Name" value={donorName} onChange={e => setDonorName(e.target.value)} required style={{ padding: '8px' }} />
                <input type="number" placeholder="Amount (₹)" value={chandaAmount} onChange={e => setChandaAmount(e.target.value)} required style={{ padding: '8px' }} />
                <input type="text" placeholder="Collected By Name" value={collectedBy} onChange={e => setCollectedBy(e.target.value)} required style={{ padding: '8px' }} />
                <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Add Chanda</button>
              </form>
            </div>

            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <h3>💸 Record Expense (Kharcha)</h3>
              <form onSubmit={handleAddExpense} style={{ display: 'grid', gap: '10px' }}>
                <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required style={{ padding: '8px' }} />
                <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ padding: '8px' }} />
                <input type="text" placeholder="Paid By Name" value={paidBy} onChange={e => setPaidBy(e.target.value)} required style={{ padding: '8px' }} />
                <button type="submit" style={{ background: '#b45309', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Add Expense</button>
              </form>
            </div>
          </div>

          {/* Data Lists Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Chanda List */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Vargani (Chanda) List</h3>
                {currentUser.role === 'admin' && (
                  <button onClick={exportChandaToExcel} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📊 Download Report</button>
                )}
              </div>
              {chandaList.map(c => (
                <div key={c.id} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.donorName}</strong> - ₹{c.amount}
                    <br />
                    <small style={{ color: '#666' }}>
                      Collected: {c.collectedBy} | Added by: <b>{c.addedByName || 'Member'} ({c.addedByUserId || 'N/A'})</b> | Date: {c.date}
                    </small>
                  </div>
                  {currentUser.role === 'admin' && (
                    <button onClick={() => handleDeleteChanda(c.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Delete</button>
                  )}
                </div>
              ))}
            </div>

            {/* Expense List */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Expenses List</h3>
                {currentUser.role === 'admin' && (
                  <button onClick={exportExpensesToExcel} style={{ background: '#b45309', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>📊 Download Report</button>
                )}
              </div>
              {expenses.map(exp => (
                <div key={exp.id} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{exp.description}</strong> - ₹{exp.amount}
                    <br />
                    <small style={{ color: '#666' }}>
                      Paid by: {exp.paidBy} | Entered by: <b>{exp.addedByName || 'Member'} ({exp.addedByUserId || 'N/A'})</b> | Date: {exp.date}
                    </small>
                  </div>
                  {currentUser.role === 'admin' && (
                    <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Delete</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Chat Room */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px' }}>
            <h3>💬 Mandal Live Chat Room</h3>
            <div style={{ height: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginBottom: '10px', background: '#fafafa' }}>
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ marginBottom: '8px' }}>
                  <small style={{ color: msg.role === 'admin' ? '#b45309' : '#2563eb', fontWeight: 'bold' }}>
                    {msg.sender} ({msg.userId || 'Member'}) [{msg.time}]:
                  </small>
                  <div style={{ background: '#fff', padding: '6px 10px', borderRadius: '4px', display: 'inline-block', marginLeft: '5px', border: '1px solid #eee' }}>{msg.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Type message..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ flex: 1, padding: '8px' }} required />
              <button type="submit" style={{ background: '#b45309', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
