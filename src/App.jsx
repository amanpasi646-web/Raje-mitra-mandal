import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function App() {
  // Default Accounts Setup
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('mandal_users_v5');
      return saved ? JSON.parse(saved) : [
        { id: 'admin123', username: 'admin', name: 'Main Admin', role: 'admin', pass: 'admin123', status: 'approved' },
        { id: 'adh2026', username: 'adhyaksha', name: 'Adhyaksha Ji', role: 'admin', pass: 'adh2026', status: 'approved' },
        { id: 'khaj2026', username: 'khajanchik', name: 'Khajanchik Ji', role: 'admin', pass: 'khaj2026', status: 'approved' },
        { id: 'sec2026', username: 'secretary', name: 'Secretary Ji', role: 'admin', pass: 'sec2026', status: 'approved' },
        { id: 'aman123', username: 'aman', name: 'Aman Pasi', role: 'member', pass: 'aman123', status: 'approved' }
      ];
    } catch {
      return [];
    }
  });

  const [pendingUsers, setPendingUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('mandal_pending_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('mandal_expenses_v10');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Chat Messages State
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('mandal_chats_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('login'); // 'login', 'signup', 'dashboard', 'admin_panel', 'chat_box'

  // Login Form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupMsg, setSignupMsg] = useState('');

  // Edit Password & Chat States
  const [editingUserId, setEditingUserId] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [chatTargetUser, setChatTargetUser] = useState(null); // Which member admin is talking to
  const [chatInputText, setChatInputText] = useState('');

  // Expense Filters & Inputs
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMember, setFilterMember] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Decoration');
  const [amount, setAmount] = useState('');
  const [shop, setShop] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync LocalStorage
  useEffect(() => { localStorage.setItem('mandal_users_v5', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('mandal_pending_v5', JSON.stringify(pendingUsers)); }, [pendingUsers]);
  useEffect(() => { localStorage.setItem('mandal_expenses_v10', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('mandal_chats_v1', JSON.stringify(messages)); }, [messages]);

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(u => u.username.toLowerCase() === loginUsername.toLowerCase().trim() && u.pass === loginPass);
    if (found) {
      if (found.status !== 'approved') {
        setLoginError('Aapki signup request pending hai!');
        return;
      }
      setCurrentUser(found);
      setLoginError('');
      setLoginUsername('');
      setLoginPass('');
      setViewMode('dashboard');
    } else {
      setLoginError('Galat Username ya Password!');
    }
  };

  // Handle Signup
  const handleSignup = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob || !signupPass) return;

    const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passRegex.test(signupPass)) {
      setSignupMsg('❌ Password me letters, numbers aur special character (@$!%*?&) hone chahiye.');
      return;
    }

    const cleanFirst = firstName.trim().toLowerCase();
    const dobDigits = dob.replace(/-/g, '').slice(-4);
    const generatedUsername = `${cleanFirst}${dobDigits}`;

    const newRequest = {
      id: Date.now().toString(),
      username: generatedUsername,
      name: `${firstName} ${lastName}`,
      role: 'member',
      pass: signupPass,
      status: 'pending',
      dob: dob
    };

    setPendingUsers(prev => [...prev, newRequest]);
    setSignupMsg(`✅ Signup Request bhej di gayi hai! Username: "${generatedUsername}"`);
    setFirstName('');
    setLastName('');
    setDob('');
    setSignupPass('');
  };

  // Password Edit
  const saveUpdatedPassword = (userId) => {
    if (!newPasswordInput.trim()) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pass: newPasswordInput.trim() } : u));
    setEditingUserId(null);
    setNewPasswordInput('');
    alert('✅ Password Update Ho Gaya!');
  };

  // Remove Member
  const handleRemoveMember = (userId, userName) => {
    if (userId === currentUser.id) {
      alert("⚠️ Aap khud ke account ko delete nahi kar sakte!");
      return;
    }
    if (window.confirm(`Kya aap "${userName}" ko remove karna chahte hain?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const approveUser = (reqId) => {
    const userToApprove = pendingUsers.find(u => u.id === reqId);
    if (userToApprove) {
      userToApprove.status = 'approved';
      setUsers(prev => [...prev, userToApprove]);
      setPendingUsers(prev => prev.filter(u => u.id !== reqId));
    }
  };

  const rejectUser = (reqId) => {
    setPendingUsers(prev => prev.filter(u => u.id !== reqId));
  };

  // Send Message (Admin & Member)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    let targetId = '';
    if (currentUser.role === 'admin') {
      targetId = chatTargetUser ? chatTargetUser.id : '';
    } else {
      targetId = 'admin_group'; // Member's message goes to Admin Chat
    }

    const newMsg = {
      id: Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      targetUserId: currentUser.role === 'admin' ? targetId : currentUser.id,
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInputText('');
  };

  // Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size 2MB se kam honi chahiye!");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit Expense
  const handleSubmitExpense = (e) => {
    e.preventDefault();
    if (!item || !amount || isSubmitting) return;

    setIsSubmitting(true);
    const newExpense = {
      id: Date.now(),
      name: currentUser.name,
      item: item.trim(),
      category: category,
      amount: parseFloat(amount),
      shop: shop.trim() || 'N/A',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      image: image
    };

    setExpenses(prev => [newExpense, ...prev]);
    setItem('');
    setAmount('');
    setShop('');
    setImage('');
    setCategory('Decoration');
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = "";
    setIsSubmitting(false);
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Kya aap is entry ko delete karna chahte hain?')) {
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    }
  };

  // Filter Expense Data
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    const matchesMember = filterMember === 'All' || exp.name === filterMember;
    const matchesSearch = searchQuery === '' || 
      exp.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
      exp.shop.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesMember && matchesSearch;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, i) => sum + i.amount, 0);

  // Excel Export
  const exportToExcel = () => {
    const excelData = filteredExpenses.map(i => ({
      ID: i.id, Member: i.name, Item: i.item, Category: i.category, Amount: i.amount, Shop: i.shop, Date: i.date, Time: i.time
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Raje_Mitra_Mandal_Hisab.xlsx`);
  };

  const uniqueMembers = Array.from(new Set(expenses.map(e => e.name)));

  // Calculate Member Unread Messages Alert
  const userUnreadCount = currentUser ? messages.filter(m => m.targetUserId === currentUser.id && m.senderId !== currentUser.id && !m.read).length : 0;

  // ---------------- LOGIN / SIGNUP SCREEN ----------------
  if (!currentUser) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={bannerStyle}>
            <img 
              src="https://i.pinimg.com/originals/38/5a/7c/385a7ce2225a623e6bb136b369fd1a42.jpg" 
              alt="Ganpati Bappa" 
              style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d97706', marginBottom: '6px' }} 
            />
            <h2 style={mandalTitleStyle}>Raje Mitra Mandal</h2>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#78350f', fontWeight: 'bold' }}>Ganpati Utsav Expense Portal</p>
          </div>

          {viewMode === 'login' ? (
            <div>
              <h3 style={{ textAlign: 'center', fontSize: '14px', color: '#374151', margin: '0 0 10px' }}>🔐 Portal Login</h3>
              <form onSubmit={handleLogin}>
                <label style={labelStyle}>Username:</label>
                <input type="text" placeholder="Enter username" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required style={inputStyle} />

                <label style={labelStyle}>Password:</label>
                <input type="password" placeholder="Enter password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required style={inputStyle} />

                {loginError && <p style={{ color: 'red', fontSize: '11px', margin: '0 0 8px' }}>{loginError}</p>}

                <button type="submit" style={buttonStyle}>Login Karein</button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '12px' }}>
                Naye member hain? <span onClick={() => { setViewMode('signup'); setSignupMsg(''); }} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>Sign Up Karein</span>
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ textAlign: 'center', fontSize: '14px', color: '#374151', margin: '0 0 10px' }}>📝 New Member Sign Up</h3>
              <form onSubmit={handleSignup}>
                <label style={labelStyle}>First Name:</label>
                <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />

                <label style={labelStyle}>Last Name:</label>
                <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />

                <label style={labelStyle}>Birth Date:</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} required style={inputStyle} />

                <label style={labelStyle}>Create Password:</label>
                <input type="password" placeholder="e.g. Aman@123" value={signupPass} onChange={e => setSignupPass(e.target.value)} required style={inputStyle} />

                {signupMsg && <p style={{ color: signupMsg.includes('❌') ? 'red' : 'green', fontSize: '11px', margin: '0 0 8px' }}>{signupMsg}</p>}

                <button type="submit" style={buttonStyle}>Request Signup</button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '12px' }}>
                Pehle se account hai? <span onClick={() => setViewMode('login')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>Login Karein</span>
              </p>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ---------------- CHAT / MESSAGE BOX VIEW ----------------
  if (viewMode === 'chat_box') {
    const activeChatUserId = currentUser.role === 'admin' ? (chatTargetUser ? chatTargetUser.id : '') : currentUser.id;
    const conversation = messages.filter(m => m.targetUserId === activeChatUserId);

    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, maxWidth: '600px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
          
          {/* Chat Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: 0, color: '#b45309', fontSize: '14px' }}>
              💬 {currentUser.role === 'admin' ? `Query for: ${chatTargetUser ? chatTargetUser.name : 'Member'}` : 'Admin Communication Box'}
            </h4>
            <button onClick={() => setViewMode(currentUser.role === 'admin' ? 'admin_panel' : 'dashboard')} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
              Close Chat
            </button>
          </div>

          {/* WhatsApp-Style Chat Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversation.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '20px' }}>Koi message nahi hai. Message bhej kar query shuru karein.</p>
            ) : (
              conversation.map(m => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', background: isMe ? '#dcf8c6' : '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontWeight: 'bold' }}>{m.senderName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#111827' }}>{m.text}</p>
                    <span style={{ fontSize: '9px', color: '#9ca3af', display: 'block', textAlign: 'right', marginTop: '2px' }}>{m.time}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
            <input 
              type="text" 
              placeholder="Type message or query..." 
              value={chatInputText} 
              onChange={e => setChatInputText(e.target.value)}
              style={{ flex: 1, padding: '8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <button type="submit" style={{ background: '#d97706', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
              Send
            </button>
          </form>

        </div>
      </div>
    );
  }

  // ---------------- ADMIN PANEL ----------------
  if (viewMode === 'admin_panel' && currentUser.role === 'admin') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#b45309' }}>🛠️ Admin Management Panel</h3>
            <button onClick={() => setViewMode('dashboard')} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
              Back to Dashboard
            </button>
          </div>

          <h4 style={{ fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Pending Signup Requests ({pendingUsers.length})</h4>
          {pendingUsers.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Koi pending request nahi hai.</p>
          ) : (
            pendingUsers.map(u => (
              <div key={u.id} style={{ background: '#fef3c7', padding: '8px', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px' }}>
                  <b>{u.name}</b> (Username: <code>{u.username}</code>)
                </div>
                <div>
                  <button onClick={() => approveUser(u.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', marginRight: '4px' }}>Accept</button>
                  <button onClick={() => rejectUser(u.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>Reject</button>
                </div>
              </div>
            ))
          )}

          <h4 style={{ fontSize: '13px', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginTop: '16px' }}>All Approved Members ({users.length})</h4>
          {users.map(u => (
            <div key={u.id} style={{ background: '#f9fafb', padding: '8px', borderRadius: '6px', marginBottom: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{u.name}</b> ({u.username}) - <i>{u.role.toUpperCase()}</i>
                  <br /><span style={{ color: '#6b7280' }}>Pass: <code>{u.pass}</code></span>
                </div>
                <div>
                  {u.role !== 'admin' && (
                    <button 
                      onClick={() => { setChatTargetUser(u); setViewMode('chat_box'); }} 
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', marginRight: '4px' }}
                    >
                      💬 Send Query
                    </button>
                  )}
                  <button 
                    onClick={() => { setEditingUserId(u.id); setNewPasswordInput(u.pass); }} 
                    style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', marginRight: '4px' }}
                  >
                    ✏️ Edit Pass
                  </button>
                  <button 
                    onClick={() => handleRemoveMember(u.id, u.name)} 
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>

              {editingUserId === u.id && (
                <div style={{ marginTop: '8px', padding: '6px', background: '#fff', border: '1px solid #f59e0b', borderRadius: '4px', display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="New Password" 
                    value={newPasswordInput} 
                    onChange={e => setNewPasswordInput(e.target.value)}
                    style={{ flex: 1, padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '3px' }}
                  />
                  <button onClick={() => saveUpdatedPassword(u.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingUserId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- MAIN DASHBOARD SCREEN ----------------
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, maxWidth: '600px' }}>
        
        {/* Banner */}
        <div style={bannerStyle}>
          <img 
            src="https://i.pinimg.com/originals/38/5a/7c/385a7ce2225a623e6bb136b369fd1a42.jpg" 
            alt="Ganpati Bappa" 
            style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d97706', marginBottom: '4px' }} 
          />
          <h2 style={mandalTitleStyle}>Raje Mitra Mandal</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#78350f', fontWeight: 'bold' }}>Ganpati Hisab Management Portal</p>
        </div>

        {/* Member Alert Bar for Unread Admin Messages */}
        {currentUser.role !== 'admin' && userUnreadCount > 0 && (
          <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '8px', borderRadius: '6px', marginBottom: '10px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🚨 <b>ADMIN ALERT:</b> Aapko admin ka message/query aaya hai!</span>
            <button onClick={() => setViewMode('chat_box')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>View Message</button>
          </div>
        )}

        {/* User Info Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: '#374151' }}>User: <b>{currentUser.name}</b> ({currentUser.role})</span>
          <div>
            {currentUser.role === 'admin' ? (
              <button onClick={() => setViewMode('admin_panel')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '6px' }}>
                Admin Panel
              </button>
            ) : (
              <button onClick={() => setViewMode('chat_box')} style={{ background: userUnreadCount > 0 ? '#ef4444' : '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '6px' }}>
                💬 Messages {userUnreadCount > 0 && `(${userUnreadCount})`}
              </button>
            )}
            <button onClick={() => setCurrentUser(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
              Logout
            </button>
          </div>
        </div>

        {/* Total Summary */}
        <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px', border: '1px solid #fcd34d' }}>
          <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold' }}>Kul Mandal Kharcha</span>
          <h2 style={{ margin: '2px 0 0', color: '#b45309', fontSize: '22px' }}>₹{totalFilteredAmount.toFixed(2)}</h2>
        </div>

        {/* Entry Form */}
        <form onSubmit={handleSubmitExpense} style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#374151' }}>➕ Nayi Kharcha Entry</h4>
          
          <input type="text" placeholder="Kya Saman Laye" value={item} onChange={e => setItem(e.target.value)} required style={inputStyle} />

          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="Decoration">Decoration</option>
              <option value="Hardware & Tools">Hardware & Tools</option>
              <option value="Pooja Samagri">Pooja Samagri</option>
              <option value="Pani & Food">Pani & Food</option>
              <option value="Lighting & Sound">Lighting & Sound</option>
              <option value="Other">Other</option>
            </select>

            <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} required style={{ ...inputStyle, flex: 1 }} />
          </div>

          <input type="text" placeholder="Dukan Ka Naam" value={shop} onChange={e => setShop(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Bill Photo (Optional):</label>
          <input id="file-input" type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: '8px', fontSize: '10px' }} />

          <button type="submit" disabled={isSubmitting} style={buttonStyle}>Submit Expense</button>
        </form>

        {/* Filters & Search */}
        <div style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>🔍 Search & Filter</span>
            {currentUser.role === 'admin' && (
              <button onClick={exportToExcel} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                📊 Export Excel
              </button>
            )}
          </div>

          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={inputStyle} />

          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
              <option value="All">All Categories</option>
              <option value="Decoration">Decoration</option>
              <option value="Hardware & Tools">Hardware & Tools</option>
              <option value="Pooja Samagri">Pooja Samagri</option>
              <option value="Pani & Food">Pani & Food</option>
              <option value="Lighting & Sound">Lighting & Sound</option>
              <option value="Other">Other</option>
            </select>

            <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
              <option value="All">All Members</option>
              {uniqueMembers.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Feed History */}
        <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#374151' }}>📋 Kharcha History ({filteredExpenses.length})</h4>
        
        {filteredExpenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '11px' }}>Koi record nahi mila.</p>
        ) : (
          filteredExpenses.map((exp) => (
            <div key={exp.id} style={itemCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.item} <span style={badgeStyle}>{exp.category}</span></strong>
                <strong style={{ color: '#d97706' }}>₹{exp.amount}</strong>
              </div>

              <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '3px' }}>
                <span>👤 {exp.name} | 📍 {exp.shop}</span><br />
                <span>📅 {exp.date} | 🕒 {exp.time}</span>
              </div>

              {exp.image && (
                <a href={exp.image} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#2563eb', display: 'block', marginTop: '3px' }}>
                  📷 View Bill Receipt
                </a>
              )}

              {currentUser.role === 'admin' && (
                <button onClick={() => handleDeleteExpense(exp.id)} style={{ marginTop: '3px', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer', fontSize: '9px' }}>
                  Delete Entry
                </button>
              )}
            </div>
          ))
        )}

      </div>
    </div>
  );
}

// Styling Objects
const containerStyle = { display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', padding: '6px' };
const cardStyle = { background: '#ffffff', width: '100%', borderRadius: '10px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', boxSizing: 'border-box' };
const bannerStyle = { background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px', textAlign: 'center', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const mandalTitleStyle = { margin: '2px 0 0', color: '#b45309', fontSize: '18px', fontWeight: 'bold' };
const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#374151', marginBottom: '2px' };
const inputStyle = { width: '100%', padding: '6px', marginBottom: '6px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '11px' };
const buttonStyle = { width: '100%', padding: '7px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' };
const itemCardStyle = { border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px', marginBottom: '6px', background: '#fff' };
const badgeStyle = { fontSize: '8px', background: '#fef3c7', color: '#b45309', padding: '1px 3px', borderRadius: '3px' };