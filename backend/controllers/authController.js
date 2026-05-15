// @desc    Get current authenticated user from Clerk
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // Clerk provides user info via req.auth
        if (!req.auth?.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Return the Clerk user info
        res.status(200).json({
            userId: req.auth.userId,
            sessionId: req.auth.sessionId,
            // Add more fields as needed from your app
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getMe };
