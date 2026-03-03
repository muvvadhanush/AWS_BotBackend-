const User = require("../models/User");

const basicAuth = async (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, pwd] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (!login || !pwd) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Access"');
        return res.status(401).send('Authentication required.');
    }

    try {
        const user = await User.findOne({ where: { username: login } });
        if (!user) {
            console.log(`❌ Auth failed: User '${login}' not found.`);
            res.set('WWW-Authenticate', 'Basic realm="Admin Access"');
            return res.status(401).send('Authentication failed.');
        }

        const isValid = await user.validPassword(pwd);
        if (!isValid) {
            console.log(`❌ Auth failed: Invalid password for '${login}'.`);
            res.set('WWW-Authenticate', 'Basic realm="Admin Access"');
            return res.status(401).send('Authentication failed.');
        }

        // Attach user to request
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        return next();

    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(500).send("Internal Server Error during Auth.");
    }
};

module.exports = basicAuth;
