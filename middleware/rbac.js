const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: User not authenticated" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`⛔ Access Denied: User ${req.user.username} (${req.user.role}) tried to access protected route.`);
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }

        // Audit Log: Grant
        console.log(`✅ Access Granted: ${req.user.username} (${req.user.role}) -> ${req.originalUrl || req.url}`);
        next();
    };
};

module.exports = authorize;
