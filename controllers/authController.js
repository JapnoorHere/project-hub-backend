
const User = require('../models/User');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        
        user = new User({
            name,
            email,
            password
        });
        
        await user.save();
        
        
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'projecthub-secret',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicUrl: user.profilePicUrl
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'projecthub-secret',
            { expiresIn: '7d' }
        );
        
        res.json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicUrl: user.profilePicUrl
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        res.json(users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicUrl: user.profilePicUrl
        })));
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
