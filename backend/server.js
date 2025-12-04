const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'supersecretkey123';

app.use(cors());
app.use(bodyParser.json());

// Replace the old mongoose.connect line with this NEW one:
mongoose.connect('mongodb+srv://admin:oZOgmpEQ27LhPIuC@cluster0.ccm8vrd.mongodb.net/marriageApp?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('✅ MongoDB Connected (Cloud)'))
.catch(err => console.log('❌ MongoDB Error:', err));


// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String, gender: String, dob: String, height: String, weight: String, complexion: String,
  education: String, standard: String, occupation: String, mobile: String, photo: String, bio: String,
  religion: String, caste: String, foodType: String, hobbies: String,
  village: String, town: String, district: String, city: String, state: String, country: String,
  fatherName: String, fatherOccupation: String, motherName: String, motherOccupation: String,
  siblings: String, siblingsOccupation: String,
  likes: { type: Number, default: 0 }
});

// NEW: Message Schema
const MessageSchema = new mongoose.Schema({
  senderEmail: String,
  receiverEmail: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// --- ROUTES ---

// Auth
app.post('/api/register', async (req, res) => {
  const { email, password, ...profileData } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, ...profileData });
    await newUser.save();
    res.status(201).json({ message: 'User Registered!' });
  } catch (error) { res.status(500).json({ error: 'Error registering' }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user }); // Sending full user data back
  } catch (error) { res.status(500).json({ error: 'Login error' }); }
});

// Profiles
app.get('/api/profiles', async (req, res) => {
  try { const profiles = await User.find(); res.json(profiles); } 
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/update/:id', async (req, res) => {
  try { await User.findByIdAndUpdate(req.params.id, req.body); res.json({ message: 'Updated' }); } 
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/like/:id', async (req, res) => {
  try { await User.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }); res.json({ message: 'Liked' }); } 
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/delete/:id', async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } 
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- CHAT ROUTES (NEW) ---

// Send a message
app.post('/api/chat/send', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.json({ message: 'Sent' });
  } catch (error) { res.status(500).json({ error: 'Error sending message' }); }
});

// Get chat history between two people
app.get('/api/chat/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    // Find messages where sender is User1 AND receiver is User2, OR vice versa
    const messages = await Message.find({
      $or: [
        { senderEmail: user1, receiverEmail: user2 },
        { senderEmail: user2, receiverEmail: user1 }
      ]
    }).sort({ timestamp: 1 }); // Oldest first
    res.json(messages);
  } catch (error) { res.status(500).json({ error: 'Error fetching chat' }); }
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });