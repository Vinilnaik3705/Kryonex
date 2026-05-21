// @desc    Get current authenticated user from Supabase
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // authMiddleware provides user info via req.auth
        if (!req.auth?.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Return the Supabase user info
        res.status(200).json({
            userId: req.auth.userId,
            email: req.auth.email
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getMe };
