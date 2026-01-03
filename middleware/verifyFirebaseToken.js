const admin = require("firebase-admin");

// Firebase initialization
const decoded = Buffer.from(
  process.env.FIREBASE_SERVICE_KEY,
  "base64"
).toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.authorization)
    return res.status(401).send({ message: "Unauthorized Access" });

  const token = req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).send({ message: "No token found" });

  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
  } catch (err) {
    return res.status(401).send({ message: "Token verification failed" });
  }

  next();
};

module.exports = verifyFirebaseToken;
