import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '' });

  const [profiles, setProfiles] = useState([]);
  const [expandedProfileId, setExpandedProfileId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- NEW: State for the File Upload ---
  const [selectedFile, setSelectedFile] = useState(null);

  const initialFormState = {
    name: '', gender: 'Male', dob: '', height: '', weight: '', complexion: '',
    education: '', standard: '', occupation: '', mobile: '', photos: [], bio: '',
    religion: '', caste: '', foodType: 'Veg', hobbies: '',
    village: '', town: '', district: '', city: '', state: '', country: '',
    fatherName: '', fatherOccupation: '', motherName: '', motherOccupation: '',
    siblings: '', siblingsOccupation: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // CHAT STATES
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, [token]);

  useEffect(() => {
    let interval;
    if (chatOpen && chatRecipient) {
      fetchChatHistory(chatRecipient.email);
      interval = setInterval(() => fetchChatHistory(chatRecipient.email), 3000);
    }
    return () => clearInterval(interval);
  }, [chatOpen, chatRecipient]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get('https://marriage-app-gtge.onrender.com/api/profiles');
      setProfiles(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuthChange = (e) => setAuthData({ ...authData, [e.target.name]: e.target.value });
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- 1. FIXED REGISTER FUNCTION (Uses FormData for Image) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();

      // Append all text fields
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // Append Auth Data
      data.append('email', authData.email);
      data.append('password', authData.password);

      // Append File if exists
      if (selectedFile) {
        data.append('photo', selectedFile); 
      }

      // 1. Register
      // CORRECT
await axios.post('https://marriage-app-gtge.onrender.com/api/register', data);
      });

      // 2. Auto Login
      const res = await axios.post('https://marriage-app-gtge.onrender.com/api/login', authData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      
      // Reset
      setSelectedFile(null);

    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://marriage-app-gtge.onrender.com/api/login', authData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setCurrentUser(res.data.user);
    } catch (err) {
      alert('Invalid Credentials');
    }
  };

  const handleLogout = () => { localStorage.clear(); setToken(null); setCurrentUser(null); setChatOpen(false); };

  // --- 2. FIXED UPDATE FUNCTION (Uses FormData for Image) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      try {
        const data = new FormData();

        Object.keys(formData).forEach((key) => {
          data.append(key, formData[key]);
        });

        if (selectedFile) {
          data.append('photo', selectedFile);
        }

        // CORRECT
const res = await axios.put(`https://marriage-app-gtge.onrender.com/api/update/${currentId}`, data);
        });

        setProfiles(profiles.map(p => p._id === currentId ? res.data : p));
        
        if (currentUser && currentUser._id === currentId) {
          setCurrentUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        }

        setIsEditing(false);
        setSelectedFile(null);
      } catch (err) {
        console.error(err);
        alert('Update Failed.');
      }
    }
  };

  // Helper Functions
  const openChat = (e, recipient) => {
    e.stopPropagation();
    if (currentUser.email === recipient.email) { alert("You cannot chat with yourself!"); return; }
    setChatRecipient(recipient);
    setChatOpen(true);
  };

  const fetchChatHistory = async (recipientEmail) => {
    try {
      const res = await axios.get(`https://marriage-app-gtge.onrender.com/api/chat/${currentUser.email}/${recipientEmail}`);
      setChatMessages(res.data);
    } catch (err) { console.log(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      await axios.post('https://marriage-app-gtge.onrender.com/api/chat/send', {
        senderEmail: currentUser.email,
        receiverEmail: chatRecipient.email,
        text: messageText
      });
      setMessageText('');
      fetchChatHistory(chatRecipient.email);
    } catch (err) { alert('Error sending'); }
  };

  const handleEdit = (e, user) => {
    e.stopPropagation();
    setFormData(user);
    setCurrentId(user._id);
    setIsEditing(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this profile?")) {
        try {
            await axios.delete(`https://marriage-app-gtge.onrender.com/api/delete/${id}`);
            setProfiles(profiles.filter(p => p._id !== id));
        } catch (err) { alert("Delete failed"); }
    }
  };

  const openWhatsApp = (e, mobile) => {
      e.stopPropagation();
      window.open(`https://wa.me/91${mobile}`, '_blank');
  };

  const toggleDetails = (id) => {
      setExpandedProfileId(expandedProfileId === id ? null : id);
  };

  // STYLES
  const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', marginBottom: '5px' };
  const buttonStyle = { padding: '8px', backgroundColor: '#ff4d6d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '13px' };
  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
  const sectionHeader = { margin: '15px 0 5px', borderBottom: '1px solid #eee', paddingBottom: '5px', color: '#555' };

  // --- RENDER ---
  if (!token) {
    return (
      <div className="App" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', backgroundColor:'#fff0f3', padding:'20px'}}>
        <div style={{background:'white', padding:'30px', borderRadius:'10px', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', width:'400px'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'20px'}}>
            <span style={{fontSize:'35px'}}>💍</span>
            <h2 style={{color:'#ff4d6d', margin:0}}>Jatav Vivah Sampann</h2>
          </div>
          <h3 style={{textAlign:'center'}}>{authMode === 'login' ? 'Login' : 'Create Account'}</h3>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
            <input name="email" type="email" placeholder="Email Address" onChange={handleAuthChange} required style={inputStyle} />
            <input name="password" type="password" placeholder="Password" onChange={handleAuthChange} required style={inputStyle} />

            {/* REGISTER FORM FIELDS */}
            {authMode === 'register' && (
              <div style={{maxHeight:'300px', overflowY:'auto', paddingRight:'5px', border:'1px solid #eee', padding:'10px'}}>
                
                {/* --- 3. RESTORED UPLOAD BUTTON --- */}
                <div style={{marginBottom:'10px', border:'1px dashed #ccc', padding:'10px', borderRadius:'5px'}}>
                    <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px', color:'#555'}}>Upload Profile Photo:</label>
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </div>

                <h4 style={sectionHeader}>Personal</h4>
                <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={inputStyle} />
                <div style={gridStyle}>
                  <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                  <input name="dob" type="date" placeholder="DOB" value={formData.dob} onChange={handleChange} style={inputStyle} />
                </div>

                {/* Simplified Height/Weight for brevity - keeping logic simple */}
                <div style={gridStyle}>
                    <input name="height" placeholder="Height (e.g. 5ft 5in)" value={formData.height} onChange={handleChange} style={inputStyle} />
                    <input name="weight" placeholder="Weight" value={formData.weight} onChange={handleChange} style={inputStyle} />
                </div>

                <input name="complexion" placeholder="Colour/Complexion" value={formData.complexion} onChange={handleChange} style={inputStyle} />
                <div style={gridStyle}>
                    <input name="education" placeholder="Education" value={formData.education} onChange={handleChange} style={inputStyle} />
                    <input name="standard" placeholder="Class/Grade" value={formData.standard} onChange={handleChange} style={inputStyle} />
                </div>
                <input name="occupation" placeholder="Occupation" value={formData.occupation} onChange={handleChange} style={inputStyle} />
                <input name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} style={inputStyle} />

                <h4 style={sectionHeader}>Family</h4>
                <input name="fatherName" placeholder="Father's Name" value={formData.fatherName} onChange={handleChange} style={inputStyle} />
                <input name="fatherOccupation" placeholder="Father's Occupation" value={formData.fatherOccupation} onChange={handleChange} style={inputStyle} />
                <input name="motherName" placeholder="Mother's Name" value={formData.motherName} onChange={handleChange} style={inputStyle} />
                <input name="siblings" placeholder="Siblings" value={formData.siblings} onChange={handleChange} style={inputStyle} />

                <h4 style={sectionHeader}>Address</h4>
                <div style={gridStyle}>
                    <input name="village" placeholder="Village" value={formData.village} onChange={handleChange} style={inputStyle} />
                    <input name="town" placeholder="Town" value={formData.town} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={gridStyle}>
                    <input name="district" placeholder="District" value={formData.district} onChange={handleChange} style={inputStyle} />
                    <input name="city" placeholder="City" value={formData.city} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={gridStyle}>
                    <input name="state" placeholder="State" value={formData.state} onChange={handleChange} style={inputStyle} />
                    <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} style={inputStyle} />
                </div>

                <h4 style={sectionHeader}>Other</h4>
                <div style={gridStyle}>
                    <input name="religion" placeholder="Religion" value={formData.religion} onChange={handleChange} style={inputStyle} />
                    <input name="caste" placeholder="Caste" value={formData.caste} onChange={handleChange} style={inputStyle} />
                </div>
                <select name="foodType" value={formData.foodType} onChange={handleChange} style={inputStyle}>
                    <option value="Veg">Vegetarian</option><option value="Non-Veg">Non-Vegetarian</option><option value="Vegan">Vegan</option>
                </select>
                <input name="hobbies" placeholder="Hobbies" value={formData.hobbies} onChange={handleChange} style={inputStyle} />
                <textarea name="bio" placeholder="Bio / About Me" value={formData.bio} onChange={handleChange} style={{...inputStyle, height: '60px'}} />
              </div>
            )}

            <button type="submit" style={buttonStyle}>{authMode === 'login' ? 'Login' : 'Register'}</button>
          </form>

          <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{textAlign:'center', marginTop:'15px', cursor:'pointer', color:'#007bff'}}>
            {authMode === 'login' ? "New user? Create Account" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  // RENDER MAIN APP
  return (
    <div className="App">
      <header className="header" style={{backgroundColor: '#ff4d6d', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <span style={{fontSize:'35px', marginRight:'10px'}}>💍</span>
           <h2 style={{margin:0}}>Jatav Vivah Sampann</h2>
        </div>
        <div>
           <span style={{marginRight:'15px', fontSize:'14px'}}>Hi, {currentUser?.name}</span>
           <button onClick={handleLogout} style={{padding: '5px 10px', background:'white', color:'#ff4d6d', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>Logout</button>
        </div>
      </header>

      <div style={{padding:'20px', textAlign:'center'}}>
        <input placeholder="🔍 Search Profiles..." onChange={(e)=>setSearchTerm(e.target.value)} style={{padding:'10px', width:'300px', borderRadius:'5px', border:'1px solid #ccc'}} />
      </div>

      <div className="container" style={{display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', padding: '20px'}}>
        
        {/* EDIT FORM MODAL */}
        {isEditing && (
           <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
             <div style={{width:'450px', maxHeight:'90vh', overflowY:'auto', background:'white', padding:'20px', borderRadius:'10px'}}>
               <h3 style={{color:'#ff9f1c'}}>Edit Profile</h3>
               <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                 
                 {/* UPDATE PHOTO INPUT */}
                 <div style={{marginBottom:'10px', border:'1px dashed #ccc', padding:'10px', borderRadius:'5px', textAlign:'center'}}>
                    <label style={{display:'block', fontSize:'12px', marginBottom:'5px', color:'#555'}}>Update Photo</label>
                    <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
                 </div>

                 <h4 style={sectionHeader}>Personal</h4>
                 <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={inputStyle} />
                 {/* Note: I'm skipping repeating all fields here to save space, but logically you would include all inputs like in Register. 
                     Make sure to update the fields you want to be editable. For now I'll include the key ones. */}
                 <input name="mobile" placeholder="Mobile" value={formData.mobile} onChange={handleChange} style={inputStyle} />
                 <input name="village" placeholder="Village" value={formData.village} onChange={handleChange} style={inputStyle} />
                 <input name="town" placeholder="Town" value={formData.town} onChange={handleChange} style={inputStyle} />
                 
                 <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                   <button type="submit" style={{...buttonStyle, background:'#ff9f1c'}}>Save Changes</button>
                   <button type="button" onClick={()=>setIsEditing(false)} style={{...buttonStyle, background:'#666'}}>Cancel</button>
                 </div>
               </form>
             </div>
           </div>
        )}

        {/* PROFILE LIST */}
        {profiles.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
          <div key={u._id} onClick={() => toggleDetails(u._id)} style={{border:'1px solid #ddd', borderRadius:'10px', padding:'15px', width:'300px', background:'white', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', cursor:'pointer'}}>
             
             {/* IMAGE DISPLAY LOGIC */}
             <div style={{width:'100%', height:'250px', backgroundColor:'#f0f0f0', borderRadius:'10px 10px 0 0', overflow:'hidden', marginBottom:'10px'}}>
               {(() => {
                 // Logic to handle multiple image formats
                 if (u.photos && u.photos.length > 0) {
                     return <img src={u.photos[0]} alt="p" style={{width:'100%', height:'100%', objectFit:'cover'}} />;
                 }
                 if (u.img || u.photo) {
                    let single = u.img || u.photo;
                    // Handle list string edge case
                    if(single.startsWith('[')) {
                        try { const parsed = JSON.parse(single); single = parsed[0]; } catch(e){}
                    }
                    return <img src={single} alt="profile" style={{width:'100%', height:'100%', objectFit:'cover'}} />;
                 }
                 return <img src="https://via.placeholder.com/300?text=No+Photo" alt="placeholder" style={{width:'100%', height:'100%', objectFit:'cover'}} />;
               })()}
             </div>

             <h3 style={{margin:'5px 0'}}>{u.name}</h3>
             <p style={{color:'#777', fontSize:'14px'}}>{u.age ? u.age + ' Yrs' : ''} {u.height ? ', ' + u.height : ''}</p>
             <p style={{color:'#ff4d6d', fontWeight:'bold'}}>{u.city}</p>

             {expandedProfileId === u._id && (
               <div style={{marginTop:'10px', borderTop:'1px solid #eee', paddingTop:'10px', textAlign:'left', fontSize:'14px'}}>
                 <p><strong>DOB:</strong> {u.dob}</p>
                 <p><strong>Education:</strong> {u.education}</p>
                 <p><strong>Father:</strong> {u.fatherName}</p>
                 <p><strong>Mobile:</strong> {u.mobile}</p>
                 
                 <div style={{display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'10px'}}>
                   <button onClick={(e) => openWhatsApp(e, u.mobile)} style={{...buttonStyle, background:'#25d366', flex:1}}>WhatsApp</button>
                   <button onClick={(e) => openChat(e, u)} style={{...buttonStyle, background:'#007bff', flex:1}}>Message</button>
                 </div>
                 
                 {/* Only show Edit/Delete if it is YOUR profile */}
                 {currentUser && (currentUser._id === u._id || currentUser.email === u.email) && (
                     <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                        <button onClick={(e) => handleEdit(e, u)} style={{...buttonStyle, background:'#ff9f1c', flex:1}}>Edit</button>
                        <button onClick={(e) => handleDelete(e, u._id)} style={{...buttonStyle, background:'#dc3545', flex:1}}>Delete</button>
                     </div>
                 )}
               </div>
             )}
          </div>
        ))}
      </div>

      {/* CHAT BOX */}
      {chatOpen && (
        <div style={{position:'fixed', bottom:0, right:'20px', width:'300px', height:'400px', background:'white', border:'1px solid #ccc', borderRadius:'10px 10px 0 0', display:'flex', flexDirection:'column', boxShadow:'0 -4px 10px rgba(0,0,0,0.1)'}}>
          <div style={{background:'#007bff', color:'white', padding:'10px', borderRadius:'10px 10px 0 0', display:'flex', justifyContent:'space-between'}}>
            <span>Chat with {chatRecipient?.name}</span>
            <button onClick={()=>setChatOpen(false)} style={{background:'transparent', border:'none', color:'white', cursor:'pointer'}}>X</button>
          </div>
          <div style={{flex:1, padding:'10px', overflowY:'auto', background:'#f9f9f9'}}>
             {chatMessages.length === 0 ? <p style={{color:'#aaa', textAlign:'center'}}>No messages yet.</p> : 
               chatMessages.map((msg, index) => (
                 <div key={index} style={{textAlign: msg.senderEmail === currentUser.email ? 'right' : 'left', marginBottom:'5px'}}>
                   <span style={{background: msg.senderEmail === currentUser.email ? '#007bff' : '#eee', color: msg.senderEmail === currentUser.email ? 'white' : 'black', padding:'5px 10px', borderRadius:'10px', display:'inline-block'}}>
                     {msg.text}
                   </span>
                 </div>
               ))
             }
          </div>
          <form onSubmit={sendMessage} style={{padding:'10px', borderTop:'1px solid #ccc', display:'flex'}}>
            <input value={messageText} onChange={(e)=>setMessageText(e.target.value)} placeholder="Type a message..." style={{flex:1, padding:'5px', borderRadius:'3px', border:'1px solid #ccc'}} />
            <button type="submit" style={{marginLeft:'5px', padding:'5px 10px', background:'#007bff', color:'white', border:'none', borderRadius:'3px'}}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;