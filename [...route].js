const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'supersecretkey123';

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
// --- URL TRANSLATOR ---
// This removes '/api' so your server sees '/register' instead of '/api/register'
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- DATABASE CONNECTION ---
// UPDATED: Using your NEW password '5QC0YGYV0WsB9G5W'
const mongoURI = 'mongodb+srv://testuser:5QC0YGYV0WsB9G5W@cluster0.ccmlvrd.mongodb.net/marriageApp?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String, gender: String, dob: String, height: String, weight: String, complexion: String,
  education: String, standard: String, occupation: String, mobile: String, 
  photo: String, 
  bio: String,
  religion: String, caste: String, foodType: String, hobbies: String,
  village: String, town: String, district: String, city: String, state: String, country: String,
  fatherName: String, fatherOccupation: String, motherName: String, motherOccupation: String,
  siblings: String, siblingsOccupation: String,
  likes: { type: Number, default: 0 }
});

const MessageSchema = new mongoose.Schema({
  senderEmail: String,
  receiverEmail: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// --- ROUTES ---

app.get('/', (req, res) => {
  res.send(`Server is running. Database Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

app.post('/api/register', upload.single('photo'), async (req, res) => {
  const { email, password, ...profileData } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    let photoBase64 = '';
    if (req.file) {
      photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const newUser = new User({ 
      email, 
      password: hashedPassword, 
      ...profileData,
      photo: photoBase64 
    });

    await newUser.save();
    res.status(201).json({ message: 'User Registered!' });

  } catch (error) {
    console.error("Register Error:", error);
    // Send the real error message to the browser
    res.status(500).json({ error: error.message }); 
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user }); 
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/profiles', async (req, res) => {
  try { const profiles = await User.find(); res.json(profiles); } 
  catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/update/:id', upload.single('photo'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
       updateData.photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/like/:id', async (req, res) => {
  try { await User.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }); res.json({ message: 'Liked' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/delete/:id', async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/chat/send', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.json({ message: 'Sent' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/chat/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { senderEmail: user1, receiverEmail: user2 },
        { senderEmail: user2, receiverEmail: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- VERCEL CONFIGURATION ---
// 1. Export the app so Vercel can run it as a Serverless Function
module.exports = app;

// 2. Keep this local listener for when you run 'node server.js' on your laptop
if (require.main === module) 
  // --- VERCEL CONFIGURATION ---
// Essential: Export the app for Vercel
module.exports = app;

// Optional: Only listen if running locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}