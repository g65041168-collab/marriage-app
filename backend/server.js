const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'supersecretkey123';

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- DATABASE CONNECTION (Manual Link with Security Bypass) ---
// We added 'tlsAllowInvalidCertificates=true' to fix the handshake error.

const mongoURI = 'mongodb://admin:a7OgmpFQ27hPTuC@cluster0-shard-00-00.ccmlvrd.mongodb.net:27017,cluster0-shard-00-01.ccmlvrd.mongodb.net:27017,cluster0-shard-00-02.ccmlvrd.mongodb.net:27017/marriageApp?ssl=true&authSource=admin&tlsAllowInvalidCertificates=true';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected (Manual + SSL Bypass Success!)'))
  .catch(err => console.log('❌ MongoDB Error:', err));

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
    res.status(500).json({ error: 'Error registering user' });
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
    res.status(500).json({ error: 'Login error' }); 
  }
});

app.get('/api/profiles', async (req, res) => {
  try { const profiles = await User.find(); res.json(profiles); } 
  catch (error) { res.status(500).json({ error: 'Error' }); }
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
    console.error(error);
    res.status(500).json({ error: 'Error' });
  }
});

app.put('/api/like/:id', async (req, res) => {
  try { await User.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }); res.json({ message: 'Liked' }); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/delete/:id', async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/chat/send', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.json({ message: 'Sent' });
  } catch (error) { res.status(500).json({ error: 'Error sending message' }); }
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
  } catch (error) { res.status(500).json({ error: 'Error fetching chat' }); }
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });