import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('vargani');

  // Firebase State
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [chandaList, setChandaList] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [personalMsgs, setPersonalMsgs] = useState([]);
  const [officialStatus, setOfficialStatus] = useState('');
  const [targetGoal, setTargetGoal] = useState({ date: '12/08/2026', amount: '20000' });

  // Login & Sign-Up Forms
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPass, setSignupPass] = useState('');

  // Expense Form State
  const [expCategory, setExpCategory] = useState('Pooja Samagri');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  // Chanda Form State
  const [donorName, setDonorName] = useState('');
  const [chandaAmount, setChandaAmount] = useState('');
  const [collectedBy, setCollectedBy] = useState('');

  // Admin Controls State
  const [newStatusText, setNewStatusText] = useState('');
  const [inputTargetDate, setInputTargetDate] = useState('');
  const [inputTargetAmount, setInputTargetAmount] = useState('');
  const [selectedUserForDM, setSelectedUserForDM] = useState('');
  const [dmText, setDmText] = useState('');
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
      // 7 Days Auto Cleanup Filter
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const filtered = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => !m.timestamp || m.timestamp >= sevenDaysAgo);
      setChatMessages(filtered);
    });
    const unsubDM = onSnapshot(collection(db, 'direct_messages'), (snapshot) => {
      setPersonalMsgs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAnnounce = onSnapshot(doc(db, 'settings', 'announcement'), (docSnap) => {
      if (docSnap.exists()) setOfficialStatus(docSnap.data().text || '');
    });
    const unsubTarget = onSnapshot(doc(db, 'settings', 'targetGoal'), (docSnap) => {
      if (docSnap.exists()) setTargetGoal(docSnap.data());
    });

    return () => { unsubUsers(); unsubExpenses(); unsubChanda(); unsubChat(); unsubDM(); unsubAnnounce(); unsubTarget(); };
  }, []);

  // Generate Clean User ID (Name + Last 4 Digits Mobile)
  const getUserCustomId = (name, mobile) => {
    const cleanName = (name || 'Member').trim().replace(/\s+/g, '');
    const cleanMobile = (mobile || '0000').slice(-4);
    return `${cleanName}${cleanMobile}`;
  };

  // Login Logic
  const handleLogin = (e) => {
    e.preventDefault();
    if ((loginMobile === 'admin' || loginMobile === '9999999999') && loginPass === 'aman2026') {
      setCurrentUser({ name: 'Admin', userId: 'Admin9999', role: 'admin', status: 'approved' });
      setActiveTab('vargani');
      return;
    }
    if (loginMobile === 'Akshay' && loginPass === 'Raje2026') {
      setCurrentUser({ name: 'Akshay (Admin)', userId: 'AkshayAdmin', role: 'admin', status: 'approved' });
      setActiveTab('vargani');
      return;
    }
    const foundUser = users.find(u => u.mobile === loginMobile && u.password === loginPass);
    if (!foundUser) {
      alert('Invalid Username/Mobile Number or Password!');
    } else if (foundUser.status === 'pending') {
      alert('Your registration is pending Admin approval.');
    } else if (foundUser.status === 'rejected') {
      alert('Your registration request was rejected.');
    } else {
      const customId = getUserCustomId(foundUser.name, foundUser.mobile);
      setCurrentUser({ ...foundUser, userId: customId });
      setActiveTab('vargani');
    }
  };

  // Sign Up Request
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
      alert(`Registration request submitted! Your User ID will be: ${customId}`);
      setSignupName(''); setSignupMobile(''); setSignupPass('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Admin Direct Message
  const handleSendDM = async (e) => {
    e.preventDefault();
    if (!selectedUserForDM || !dmText) return alert('Select user and type message');
    try {
      await addDoc(collection(db, 'direct_messages'), {
        targetUserId: selectedUserForDM,
        sender: currentUser.name,
        text: dmText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      alert('Personal message sent successfully!');
      setDmText('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Add Expense Entry
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return alert('Fill all required fields');
    try {
      await addDoc(collection(db, 'expenses'), {
        category: expCategory,
        description,
        amount: Number(amount),
        paidBy,
        addedByName: currentUser.name,
        addedByUserId: currentUser.userId,
        date: new Date().toLocaleDateString()
      });
      alert('Expense recorded!');
      setDescription(''); setAmount(''); setPaidBy('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Add Chanda Entry
  const handleAddChanda = async (e) => {
    e.preventDefault();
    if (!donorName || !chandaAmount || !collectedBy) return alert('Fill all required fields');
    try {
      await addDoc(collection(db, 'chanda'), {
        donorName,
        amount: Number(chandaAmount),
        collectedBy,
        addedByName: currentUser.name,
        addedByUserId: currentUser.userId,
        date: new Date().toLocaleDateString()
      });
      alert('Vargani recorded!');
      setDonorName(''); setChandaAmount(''); setCollectedBy('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Public Group Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput) return;
    try {
      await addDoc(collection(db, 'messages'), {
        sender: currentUser.name,
        userId: currentUser.userId,
        role: currentUser.role,
        text: chatInput,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setChatInput('');
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Excel Downloads (Admin Only) with Clean Formatting
  const exportExpensesToExcel = () => {
    const cleanData = expenses.map(e => ({
      'Category': e.category || 'N/A',
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
    XLSX.writeFile(workbook, "Raje_Mandal_Expenses_Report.xlsx");
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
    XLSX.writeFile(workbook, "Raje_Mandal_Vargani_Report.xlsx");
  };

  // Aggregations
  const todayDate = new Date().toLocaleDateString();
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalChanda = chandaList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayChanda = chandaList.filter(i => i.date === todayDate).reduce((s, i) => s + Number(i.amount || 0), 0);

  // Filter My Direct Messages
  const myDMs = currentUser ? personalMsgs.filter(m => m.targetUserId === currentUser.userId) : [];

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: '#fdfbf7', minHeight: '100vh', pb: '80px', color: '#2c2c2c' }}>
      
      {/* Header Banner with Ganpati Bappa Aesthetic */}
      <header style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', padding: '20px 15px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '0 0 16px 16px' }}>
        <img src="https://img.icons8.com/color/96/ganesha.png" alt="Ganpati Bappa" style={{ width: '65px', height: '65px', marginBottom: '5px' }} />
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '0.5px' }}>🚩 RAJE MITRA MANDAL 🚩</h1>
        <p style={{ margin: '3px 0 0 0', fontSize: '13px', opacity: 0.9 }}>Ganpati Utsav Expense & Vargani Portal</p>
      </header>

      {!currentUser ? (
        <div style={{ maxWidth: '400px', margin: '25px auto', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #fef3c7' }}>
          <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #fef3c7' }}>
            <button onClick={() => setActiveTab('login')} style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'login' ? '#d97706' : 'none', color: activeTab === 'login' ? '#fff' : '#4b5563', fontWeight: 'bold', borderRadius: '6px 6px 0 0', cursor: 'pointer' }}>Login</button>
            <button onClick={() => setActiveTab('signup')} style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'signup' ? '#d97706' : 'none', color: activeTab === 'signup' ? '#fff' : '#4b5563', fontWeight: 'bold', borderRadius: '6px 6px 0 0', cursor: 'pointer' }}>Sign Up</button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin}>
              <h3 style={{ marginTop: 0, color: '#b45309' }}>Member & Admin Login</h3>
              <input type="text" placeholder="Mobile / Username" value={loginMobile} onChange={e => setLoginMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Login to Dashboard</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <h3 style={{ marginTop: 0, color: '#b45309' }}>New Registration Request</h3>
              <input type="text" placeholder="Full Name" value={signupName} onChange={e => setSignupName(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <input type="text" placeholder="Mobile Number" value={signupMobile} onChange={e => setSignupMobile(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <input type="password" placeholder="Create Password" value={signupPass} onChange={e => setSignupPass(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Submit Sign-Up</button>
            </form>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '15px' }}>
          
          {/* Active User Header */}
          <div style={{ background: '#fff', padding: '12px 15px', borderRadius: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div>
              <strong>User: {currentUser.name}</strong> <span style={{ fontSize: '11px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', color: '#b45309' }}>ID: {currentUser.userId}</span>
            </div>
            <button onClick={() => setCurrentUser(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Logout</button>
          </div>

          {/* Official Target Banner */}
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid #10b981', padding: '15px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center' }}>
            <small style={{ color: '#047857', fontWeight: 'bold', letterSpacing: '0.5px' }}>🎯 TARGET VARGANI (CHANDA)</small>
            <h2 style={{ margin: '4px 0 0 0', color: '#065f46', fontSize: '24px' }}>
              Total Vargani ({targetGoal.date}): ₹{Number(targetGoal.amount).toLocaleString('en-IN')}
            </h2>
          </div>

          {/* Personal Direct Messages Banner */}
          {myDMs.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '10px', marginBottom: '15px' }}>
              <strong style={{ color: '#991b1b' }}>📩 Personal Message from Admin:</strong>
              {myDMs.map(dm => (
                <div key={dm.id} style={{ fontSize: '13px', marginTop: '4px', color: '#7f1d1d' }}>
                  • "{dm.text}" <small style={{ opacity: 0.7 }}>({dm.time})</small>
                </div>
              ))}
            </div>
          )}

          {/* PAGE 1: VARGANI (CHANDA) PAGE */}
          {activeTab === 'vargani' && (
            <div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#16a34a' }}>🧾 Record Vargani (Chanda)</h3>
                <form onSubmit={handleAddChanda} style={{ display: 'grid', gap: '10px' }}>
                  <input type="text" placeholder="Donor Name (Kisne Chanda Diya)" value={donorName} onChange={e => setDonorName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <input type="number" placeholder="Amount (₹)" value={chandaAmount} onChange={e => setChandaAmount(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <input type="text" placeholder="Collected By (Member Name)" value={collectedBy} onChange={e => setCollectedBy(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add Vargani Entry</button>
                </form>
              </div>

              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>Live Vargani List</h3>
                  {currentUser.role === 'admin' && (
                    <button onClick={exportChandaToExcel} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>📊 Download Excel</button>
                  )}
                </div>
                {chandaList.map(c => (
                  <div key={c.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{c.donorName}</strong> - ₹{c.amount}
                      <br /><small style={{ color: '#666' }}>Collected: {c.collectedBy} | Added by: <b>{c.addedByUserId || c.addedByName}</b> | Date: {c.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 2: EXPENSES PAGE */}
          {activeTab === 'expenses' && (
            <div>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#b45309' }}>💸 Record Daily Expense (Kharcha)</h3>
                <form onSubmit={handleAddExpense} style={{ display: 'grid', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Select Category:</label>
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <option value="Pooja Samagri">Pooja Ki Samaghiri</option>
                    <option value="Mandal Ka Kaam">Mandal Ka Kaam</option>
                    <option value="Labour Kharcha">Labour Kharcha</option>
                    <option value="Chai Nasta">Chai Nasta</option>
                    <option value="Har Phool">Har Phool</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Others">Others</option>
                  </select>
                  <textarea placeholder="Description (Max 200 words)" maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '60px' }} />
                  <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <input type="text" placeholder="Paid By Name" value={paidBy} onChange={e => setPaidBy(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <button type="submit" style={{ background: '#b45309', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add Expense Entry</button>
                </form>
              </div>

              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>Expenses List (Total: ₹{totalExpense})</h3>
                  {currentUser.role === 'admin' && (
                    <button onClick={exportExpensesToExcel} style={{ background: '#b45309', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>📊 Download Excel</button>
                  )}
                </div>
                {expenses.map(exp => (
                  <div key={exp.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{exp.category || 'Expense'}</span>
                      <div style={{ marginTop: '2px' }}><strong>{exp.description}</strong> - ₹{exp.amount}</div>
                      <small style={{ color: '#666' }}>Paid by: {exp.paidBy} | Entered by: <b>{exp.addedByUserId || exp.addedByName}</b> | Date: {exp.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 3: CHAT ROOM PAGE */}
          {activeTab === 'chat' && (
            <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>💬 Mandal Live Chat</h3>
                <small style={{ color: '#666', fontSize: '11px' }}>Auto-clears after 7 days</small>
              </div>
              <div style={{ height: '320px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px', marginBottom: '10px', background: '#fcfcfc' }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{ marginBottom: '10px' }}>
                    <small style={{ color: msg.role === 'admin' ? '#b45309' : '#2563eb', fontWeight: 'bold' }}>
                      {msg.sender} ({msg.userId || 'Member'}) - {msg.time}:
                    </small>
                    <div style={{ background: '#f3f4f6', padding: '8px 12px', borderRadius: '8px', marginTop: '2px', fontSize: '14px', display: 'inline-block', maxWidth: '85%' }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Type message..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
                <button type="submit" style={{ background: '#d97706', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
              </form>
            </div>
          )}

          {/* PAGE 4: ADMIN CONTROL PANEL PAGE */}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <div style={{ display: 'grid', gap: '15px' }}>
              {/* Member Approvals */}
              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0 }}>👑 Member Management</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>User ID</th>
                        <th style={{ padding: '8px' }}>Name</th>
                        <th style={{ padding: '8px' }}>Mobile</th>
                        <th style={{ padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#b45309' }}>{u.userId || getUserCustomId(u.name, u.mobile)}</td>
                          <td style={{ padding: '8px' }}>{u.name}</td>
                          <td style={{ padding: '8px' }}>{u.mobile}</td>
                          <td style={{ padding: '8px' }}>{u.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Send Personal Direct Message */}
              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3>📩 Send Personal Message to Member</h3>
                <form onSubmit={handleSendDM} style={{ display: 'grid', gap: '10px' }}>
                  <select value={selectedUserForDM} onChange={e => setSelectedUserForDM(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required>
                    <option value="">Select Member...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.userId || getUserCustomId(u.name, u.mobile)}>
                        {u.name} ({u.userId || getUserCustomId(u.name, u.mobile)})
                      </option>
                    ))}
                  </select>
                  <input type="text" placeholder="Type personal message..." value={dmText} onChange={e => setDmText(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} required />
                  <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Send DM</button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Sticky Bottom Navigation Bar */}
      {currentUser && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', padding: '8px 0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 1000 }}>
          <button onClick={() => setActiveTab('vargani')} style={{ border: 'none', background: 'none', color: activeTab === 'vargani' ? '#d97706' : '#6b7280', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
            🧾 Vargani
          </button>
          <button onClick={() => setActiveTab('expenses')} style={{ border: 'none', background: 'none', color: activeTab === 'expenses' ? '#d97706' : '#6b7280', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
            💸 Expenses
          </button>
          <button onClick={() => setActiveTab('chat')} style={{ border: 'none', background: 'none', color: activeTab === 'chat' ? '#d97706' : '#6b7280', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
            💬 Chat
          </button>
          {currentUser.role === 'admin' && (
            <button onClick={() => setActiveTab('admin')} style={{ border: 'none', background: 'none', color: activeTab === 'admin' ? '#d97706' : '#6b7280', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
              👑 Admin
            </button>
          )}
        </nav>
      )}

    </div>
  );
}
