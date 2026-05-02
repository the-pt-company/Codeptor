const admin = require('firebase-admin');

const connectDB = async () => {
    try {
        if (!admin.apps.length) {
            const credsJson = process.env.FIREBASE_CREDENTIALS_JSON;
            const credsPath = process.env.FIREBASE_CREDENTIALS_PATH;

            if (credsJson) {
                const creds = JSON.parse(credsJson);
                admin.initializeApp({
                    credential: admin.credential.cert(creds)
                });
                console.log('Firebase initialized via FIREBASE_CREDENTIALS_JSON');
            } else if (credsPath) {
                admin.initializeApp({
                    credential: admin.credential.cert(credsPath)
                });
                console.log('Firebase initialized via FIREBASE_CREDENTIALS_PATH');
            } else {
                admin.initializeApp();
                console.log('Firebase initialized via default credentials');
            }
        }
        
        const db = admin.firestore();
        // Dummy get to ensure connection
        await db.collection('visitors').limit(1).get();
        console.log('Firestore connected');
        return db;
    } catch (err) {
        console.error(`Firestore connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB, getDb: () => admin.firestore() };
