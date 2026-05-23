const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!uri) {
            console.warn('⚠️ MongoDB URI is not configured. Starting without persistent database access.');
            return false;
        }

        uri = uri.trim();

        console.log('Checking MongoDB URI format...');

        // Robust fix for unencoded special characters in password
        if (uri.startsWith('mongodb+srv://')) {
            try {
                const protocol = 'mongodb+srv://';
                // Find the end of the authority section (start of path or query)
                let authEndIndex = uri.indexOf('/', protocol.length);
                if (authEndIndex === -1) {
                    authEndIndex = uri.indexOf('?', protocol.length);
                }
                if (authEndIndex === -1) {
                    authEndIndex = uri.length;
                }

                const authority = uri.substring(protocol.length, authEndIndex);
                const pathAndQuery = uri.substring(authEndIndex);

                // Check if authority contains multiple @ symbols (indicates unencoded password)
                // Authority structure: user:password@host
                // If password contains @, we will have > 1 @ symbol
                if (authority.split('@').length > 2) {
                    console.log('⚠️  Detected unencoded characters in MongoDB connection string. Fixing...');

                    // The separator between credentials and host is the LAST @ in the authority section
                    const lastAtIndex = authority.lastIndexOf('@');

                    const credentials = authority.substring(0, lastAtIndex);
                    const host = authority.substring(lastAtIndex + 1);

                    // Split credentials into user and password
                    const firstColonIndex = credentials.indexOf(':');

                    if (firstColonIndex !== -1) {
                        const username = credentials.substring(0, firstColonIndex);
                        const rawPassword = credentials.substring(firstColonIndex + 1);

                        // Decode first to ensure we don't double-encode mixed content, then encode fully
                        const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));

                        // Reconstruct URI
                        uri = `${protocol}${username}:${encodedPassword}@${host}${pathAndQuery}`;
                        console.log('✅  Fixed MongoDB URI credentials.');
                    }
                }
            } catch (e) {
                console.error('Failed to parse and fix MongoDB URI:', e.message);
            }
        }

        console.log(`Attempting to connect to MongoDB with URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Mask credentials

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 2500,
        });

        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
        return true;
    } catch (error) {
        console.warn('⚠️ MongoDB is unavailable. Continuing without persistent database access.');
        return false;
    }
};

module.exports = connectDB;
