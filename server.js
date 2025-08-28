const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Configuration ---

const MONGO_URI = 'mongodb+srv://chaitanyajeetsingh:Bi6jaO87XyvHfN8t@cluster0.2yaupex.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// --- User Schema ---
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    history: [{
        text: String,
        results: Array,
        timestamp: { type: Date, default: Date.now }
    }]
});
const User = mongoose.model('User', UserSchema);

// --- Routes ---

// Signup
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ msg: 'User created successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, 'eyJhbGciOiJIUzM4NCJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc1NjAyMDY0OSwiaWF0IjoxNzU2MDIwNjQ5fQ.4P26ehaQVL1SR0U8xvJxBCR8LMTx-HfJg7e930ZVCYiT8XkaEYXGtOA3lEGsWu8N', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get History
app.get('/api/history', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, 'eyJhbGciOiJIUzM4NCJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc1NjAyMDY0OSwiaWF0IjoxNzU2MDIwNjQ5fQ.4P26ehaQVL1SR0U8xvJxBCR8LMTx-HfJg7e930ZVCYiT8XkaEYXGtOA3lEGsWu8N');
        const user = await User.findById(decoded.user.id);
        res.json(user.history);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Save History
app.post('/api/history', async (req, res) => {
    const { text, results } = req.body;
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, 'eyJhbGciOiJIUzM4NCJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc1NjAyMDY0OSwiaWF0IjoxNzU2MDIwNjQ5fQ.4P26ehaQVL1SR0U8xvJxBCR8LMTx-HfJg7e930ZVCYiT8XkaEYXGtOA3lEGsWu8N');
        const user = await User.findById(decoded.user.id);
        user.history.unshift({ text, results });
        await user.save();
        res.json(user.history);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
