const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-should-be-in-an-env-file';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Warn if using default secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-super-secret-key-that-should-be-in-an-env-file') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production! Please set JWT_SECRET environment variable.');
}

// CORS configuration
const corsOptions = {
    origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Trust proxy for nginx proxy manager / reverse proxy
app.set('trust proxy', true);

// --- HEALTH CHECK ---

// Health check endpoint for Docker and load balancers
app.get('/api/health', (req, res) => {
    try {
        // Check database connection
        const result = db.prepare('SELECT 1 as ok').get();
        if (result && result.ok === 1) {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected'
            });
        } else {
            throw new Error('Database check failed');
        }
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// --- AUTHENTICATION ---

// Signup
app.post('/api/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({ message: 'Error hashing password' });
        }
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        try {
            const info = stmt.run(username, hash);
            const user = { id: info.lastInsertRowid, username };
            
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
            res.status(201).json({ user: { username: user.username }, token });
        } catch (dbError) {
            if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ message: 'User already exists' });
            }
            res.status(500).json({ message: 'Error creating user' });
        }
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ user: { username: user.username }, token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Check Auth Status
app.get('/api/check-auth', authenticateToken, (req, res) => {
    res.json({ user: { username: req.user.username } });
});


// --- DATA ROUTES ---

// Get all user data (groups and supplications)
app.get('/api/data', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const groupsStmt = db.prepare('SELECT * FROM groups WHERE user_id = ?');
    const supplicationsStmt = db.prepare('SELECT * FROM supplications WHERE group_id = ?');
    
    try {
        const groups = groupsStmt.all(userId).map(group => {
            const supplications = supplicationsStmt.all(group.id);
            return { ...group, supplications };
        });
        res.json({ groups });
    } catch(e) {
        res.status(500).json({ message: 'Failed to fetch data' });
    }
});

// Add a group
app.post('/api/groups', authenticateToken, (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    const stmt = db.prepare('INSERT INTO groups (name, user_id) VALUES (?, ?)');
    try {
        const info = stmt.run(name, userId);
        res.status(201).json({ id: info.lastInsertRowid, name, user_id: userId, supplications: [] });
    } catch (e) {
        res.status(500).json({ message: 'Failed to create group' });
    }
});

// Delete a group
app.delete('/api/groups/:groupId', authenticateToken, (req, res) => {
    const { groupId } = req.params;
    const userId = req.user.id;
    // Ensure user owns the group before deleting
    const stmt = db.prepare('DELETE FROM groups WHERE id = ? AND user_id = ?');
    try {
        const info = stmt.run(groupId, userId);
        if (info.changes > 0) {
            // Also delete associated supplications (cascade delete handles this)
            res.sendStatus(204);
        } else {
            res.status(404).json({ message: 'Group not found or not owned by user' });
        }
    } catch(e) {
        res.status(500).json({ message: 'Failed to delete group' });
    }
});


// Add a supplication
app.post('/api/supplications', authenticateToken, (req, res) => {
    const { groupId, title, text, target } = req.body;
    const stmt = db.prepare('INSERT INTO supplications (group_id, title, text, target, currentCount) VALUES (?, ?, ?, ?, ?)');
    try {
        // TODO: Add a check to ensure the group belongs to the user
        const info = stmt.run(groupId, title, text, target, 0);
        res.status(201).json({ id: info.lastInsertRowid, group_id: groupId, title, text, target, currentCount: 0 });
    } catch(e) {
        res.status(500).json({ message: 'Failed to add supplication' });
    }
});

// Update a supplication
app.put('/api/supplications/:supplicationId', authenticateToken, (req, res) => {
    const { supplicationId } = req.params;
    const { title, text, target } = req.body;
    // TODO: Add a check to ensure the supplication belongs to the user
    const stmt = db.prepare('UPDATE supplications SET title = ?, text = ?, target = ? WHERE id = ?');
    try {
        stmt.run(title, text, target, supplicationId);
        const updatedStmt = db.prepare('SELECT * FROM supplications WHERE id = ?');
        const updatedSupplication = updatedStmt.get(supplicationId);
        res.json(updatedSupplication);
    } catch (e) {
        res.status(500).json({ message: 'Failed to update supplication' });
    }
});

// Delete a supplication
app.delete('/api/supplications/:supplicationId', authenticateToken, (req, res) => {
    const { supplicationId } = req.params;
     // TODO: Add a check to ensure the supplication belongs to the user
    const stmt = db.prepare('DELETE FROM supplications WHERE id = ?');
    try {
        stmt.run(supplicationId);
        res.sendStatus(204);
    } catch (e) {
        res.status(500).json({ message: 'Failed to delete supplication' });
    }
});

// Increment/Reset Count
const updateCount = (req, res, isReset = false) => {
    const { supplicationId } = req.params;
    // TODO: Add a check to ensure the supplication belongs to the user
    const updateStmt = isReset
        ? db.prepare('UPDATE supplications SET currentCount = 0 WHERE id = ?')
        : db.prepare('UPDATE supplications SET currentCount = currentCount + 1 WHERE id = ?');
    
    try {
        updateStmt.run(supplicationId);
        const selectStmt = db.prepare('SELECT * FROM supplications WHERE id = ?');
        const updatedSupplication = selectStmt.get(supplicationId);
        res.json(updatedSupplication);
    } catch (e) {
        res.status(500).json({ message: 'Failed to update count' });
    }
};

app.post('/api/supplications/:supplicationId/increment', authenticateToken, (req, res) => updateCount(req, res, false));
app.post('/api/supplications/:supplicationId/reset', authenticateToken, (req, res) => updateCount(req, res, true));


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
