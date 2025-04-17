
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }
        
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'projecthub-secret');
        
        
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found, access denied' });
        }
        
        
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token, access denied' });
    }
};
