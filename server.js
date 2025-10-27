const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database.js');

// Security middleware
const { helmetConfig, generalLimiter, authLimiter, incrementLimiter } = require('./server/middleware/security');
const sanitizeInput = require('./server/middleware/sanitize');
const { errorHandler, catchAsync } = require('./server/middleware/errorHandler');
const { validate, validateParams, validateQuery } = require('./server/middleware/validate');
const AppError = require('./server/utils/AppError');

// Validators
const { signupSchema, loginSchema } = require('./server/validators/auth.validator');
const {
  createGroupSchema,
  createSupplicationSchema,
  updateSupplicationSchema,
  reorderSupplicationsSchema
} = require('./server/validators/supplication.validator');
const {
  updateSettingsSchema,
  createReminderSchema,
  updateReminderSchema
} = require('./server/validators/settings.validator');
const {
  idSchema,
  groupIdSchema,
  supplicationIdSchema,
  daysQuerySchema,
  limitQuerySchema
} = require('./server/validators/common.validator');

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

// Trust proxy for nginx proxy manager / reverse proxy
app.set('trust proxy', true);

// Security middleware - Applied FIRST
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(sanitizeInput); // Sanitize all inputs to prevent XSS

// Apply general rate limiter to all /api routes
app.use('/api', generalLimiter);

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

// Signup - with validation and rate limiting
app.post('/api/signup', authLimiter, validate(signupSchema), catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(username, hash);
    const user = { id: info.lastInsertRowid, username };

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
        user: { username: user.username },
        token
    });
}));

// Login - with validation and rate limiting
app.post('/api/login', authLimiter, validate(loginSchema), catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    // Get user
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Invalid credentials', 401));
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
        user: { username: user.username },
        token
    });
}));

// Auth Middleware - Updated to use AppError
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(new AppError('No token provided. Please log in.', 401));
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new AppError('Your token has expired. Please log in again.', 401));
            }
            return next(new AppError('Invalid token. Please log in again.', 403));
        }
        req.user = user;
        next();
    });
};

// Check Auth Status
app.get('/api/check-auth', authenticateToken, catchAsync(async (req, res) => {
    res.json({ user: { username: req.user.username } });
}));


// --- DATA ROUTES ---

// Get all user data (groups and supplications)
app.get('/api/data', authenticateToken, catchAsync(async (req, res) => {
    const userId = req.user.id;
    const groupsStmt = db.prepare('SELECT * FROM groups WHERE user_id = ?');
    const supplicationsStmt = db.prepare('SELECT * FROM supplications WHERE group_id = ? ORDER BY position ASC');

    const groups = groupsStmt.all(userId).map(group => {
        const supplications = supplicationsStmt.all(group.id);
        return { ...group, supplications };
    });

    res.json({ groups });
}));

// Add a group - with validation
app.post('/api/groups', authenticateToken, validate(createGroupSchema), catchAsync(async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    const stmt = db.prepare('INSERT INTO groups (name, user_id) VALUES (?, ?)');
    const info = stmt.run(name, userId);

    res.status(201).json({
        id: info.lastInsertRowid,
        name,
        user_id: userId,
        supplications: []
    });
}));

// Delete a group
app.delete('/api/groups/:groupId', authenticateToken, validateParams(groupIdSchema), catchAsync(async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Ensure user owns the group before deleting
    const stmt = db.prepare('DELETE FROM groups WHERE id = ? AND user_id = ?');
    const info = stmt.run(groupId, userId);

    if (info.changes > 0) {
        // Also delete associated supplications (cascade delete handles this)
        res.sendStatus(204);
    } else {
        return next(new AppError('Group not found or not owned by user', 404));
    }
}));


// Add a supplication
app.post('/api/supplications', authenticateToken, validate(createSupplicationSchema), catchAsync(async (req, res, next) => {
    const { groupId, title, text, target } = req.body;
    const userId = req.user.id;

    // Verify the group belongs to the user
    const groupCheckStmt = db.prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?');
    const group = groupCheckStmt.get(groupId, userId);

    if (!group) {
        return next(new AppError('Group not found or not owned by user', 404));
    }

    // Get the max position for this group
    const maxPosStmt = db.prepare('SELECT MAX(position) as maxPos FROM supplications WHERE group_id = ?');
    const maxPosResult = maxPosStmt.get(groupId);
    const newPosition = (maxPosResult.maxPos !== null ? maxPosResult.maxPos + 1 : 0);

    const stmt = db.prepare('INSERT INTO supplications (group_id, title, text, target, currentCount, position) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(groupId, title, text, target, 0, newPosition);

    res.status(201).json({
        id: info.lastInsertRowid,
        group_id: groupId,
        title,
        text,
        target,
        currentCount: 0,
        position: newPosition
    });
}));

// Update a supplication
app.put('/api/supplications/:supplicationId', authenticateToken, validateParams(supplicationIdSchema), validate(updateSupplicationSchema), catchAsync(async (req, res, next) => {
    const { supplicationId } = req.params;
    const { title, text, target } = req.body;
    const userId = req.user.id;

    // Verify the supplication belongs to the user
    const ownerCheckStmt = db.prepare(`
        SELECT s.* FROM supplications s
        JOIN groups g ON s.group_id = g.id
        WHERE s.id = ? AND g.user_id = ?
    `);
    const supplication = ownerCheckStmt.get(supplicationId, userId);

    if (!supplication) {
        return next(new AppError('Supplication not found or not owned by user', 404));
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];

    if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
    }
    if (text !== undefined) {
        updates.push('text = ?');
        values.push(text);
    }
    if (target !== undefined) {
        updates.push('target = ?');
        values.push(target);
    }

    values.push(supplicationId);

    const stmt = db.prepare(`UPDATE supplications SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const updatedStmt = db.prepare('SELECT * FROM supplications WHERE id = ?');
    const updatedSupplication = updatedStmt.get(supplicationId);

    res.json(updatedSupplication);
}));

// Delete a supplication
app.delete('/api/supplications/:supplicationId', authenticateToken, validateParams(supplicationIdSchema), catchAsync(async (req, res, next) => {
    const { supplicationId } = req.params;
    const userId = req.user.id;

    // Verify the supplication belongs to the user
    const ownerCheckStmt = db.prepare(`
        SELECT s.* FROM supplications s
        JOIN groups g ON s.group_id = g.id
        WHERE s.id = ? AND g.user_id = ?
    `);
    const supplication = ownerCheckStmt.get(supplicationId, userId);

    if (!supplication) {
        return next(new AppError('Supplication not found or not owned by user', 404));
    }

    const stmt = db.prepare('DELETE FROM supplications WHERE id = ?');
    stmt.run(supplicationId);

    res.sendStatus(204);
}));

// Increment supplication count
app.post('/api/supplications/:supplicationId/increment', authenticateToken, validateParams(supplicationIdSchema), incrementLimiter, catchAsync(async (req, res, next) => {
    const { supplicationId } = req.params;
    const userId = req.user.id;

    // Get supplication details for history tracking
    const selectStmt = db.prepare('SELECT * FROM supplications WHERE id = ?');
    const supplication = selectStmt.get(supplicationId);

    if (!supplication) {
        return next(new AppError('Supplication not found', 404));
    }

    // Update count
    const updateStmt = db.prepare('UPDATE supplications SET currentCount = currentCount + 1 WHERE id = ?');
    updateStmt.run(supplicationId);

    // Record history
    const historyStmt = db.prepare(`
        INSERT INTO count_history (user_id, group_id, supplication_id, count, timestamp)
        VALUES (?, ?, ?, 1, ?)
    `);
    historyStmt.run(userId, supplication.group_id, supplicationId, Date.now());

    const updatedSupplication = selectStmt.get(supplicationId);
    res.json(updatedSupplication);
}));

// Reset supplication count
app.post('/api/supplications/:supplicationId/reset', authenticateToken, validateParams(supplicationIdSchema), catchAsync(async (req, res, next) => {
    const { supplicationId } = req.params;
    const userId = req.user.id;

    // Verify supplication belongs to user
    const ownerCheckStmt = db.prepare(`
        SELECT s.* FROM supplications s
        JOIN groups g ON s.group_id = g.id
        WHERE s.id = ? AND g.user_id = ?
    `);
    const supplication = ownerCheckStmt.get(supplicationId, userId);

    if (!supplication) {
        return next(new AppError('Supplication not found or not owned by user', 404));
    }

    // Reset count
    const updateStmt = db.prepare('UPDATE supplications SET currentCount = 0 WHERE id = ?');
    updateStmt.run(supplicationId);

    const selectStmt = db.prepare('SELECT * FROM supplications WHERE id = ?');
    const updatedSupplication = selectStmt.get(supplicationId);

    res.json(updatedSupplication);
}));

// Reset all supplications in a group
app.post('/api/groups/:groupId/reset', authenticateToken, validateParams(groupIdSchema), catchAsync(async (req, res, next) => {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Verify the group belongs to the user
    const groupStmt = db.prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?');
    const group = groupStmt.get(groupId, userId);

    if (!group) {
        return next(new AppError('Group not found or not owned by user', 404));
    }

    // Reset all supplications in the group
    const resetStmt = db.prepare(`
        UPDATE supplications
        SET currentCount = 0
        WHERE group_id = ?
    `);
    resetStmt.run(groupId);

    // Get all updated supplications
    const selectStmt = db.prepare('SELECT * FROM supplications WHERE group_id = ? ORDER BY position ASC');
    const supplications = selectStmt.all(groupId);

    res.json(supplications);
}));

// Reorder supplications in a group
app.post('/api/groups/:groupId/reorder', authenticateToken, validateParams(groupIdSchema), validate(reorderSupplicationsSchema), catchAsync(async (req, res, next) => {
    const { groupId } = req.params;
    const { supplicationIds } = req.body; // Array of supplication IDs in new order
    const userId = req.user.id;

    // Verify group belongs to user
    const groupStmt = db.prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?');
    const group = groupStmt.get(groupId, userId);

    if (!group) {
        return next(new AppError('Group not found or not owned by user', 404));
    }

    // Update positions
    const updateStmt = db.prepare('UPDATE supplications SET position = ? WHERE id = ? AND group_id = ?');
    supplicationIds.forEach((supplicationId, index) => {
        updateStmt.run(index, supplicationId, groupId);
    });

    // Get all updated supplications
    const selectStmt = db.prepare('SELECT * FROM supplications WHERE group_id = ? ORDER BY position ASC');
    const supplications = selectStmt.all(groupId);

    res.json(supplications);
}));

// --- STATISTICS ENDPOINTS ---

// Get statistics summary
app.get('/api/statistics/summary', authenticateToken, catchAsync(async (req, res) => {
    const userId = req.user.id;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Today's count
    const todayStmt = db.prepare(`
        SELECT SUM(count) as total
        FROM count_history
        WHERE user_id = ? AND timestamp >= ?
    `);
    const todayResult = todayStmt.get(userId, oneDayAgo);

    // Week's count
    const weekStmt = db.prepare(`
        SELECT SUM(count) as total
        FROM count_history
        WHERE user_id = ? AND timestamp >= ?
    `);
    const weekResult = weekStmt.get(userId, oneWeekAgo);

    // Month's count
    const monthStmt = db.prepare(`
        SELECT SUM(count) as total
        FROM count_history
        WHERE user_id = ? AND timestamp >= ?
    `);
    const monthResult = monthStmt.get(userId, oneMonthAgo);

    // All-time count
    const allTimeStmt = db.prepare(`
        SELECT SUM(count) as total
        FROM count_history
        WHERE user_id = ?
    `);
    const allTimeResult = allTimeStmt.get(userId);

    // Total supplications
    const totalSupplicationsStmt = db.prepare(`
        SELECT COUNT(*) as total
        FROM supplications s
        JOIN groups g ON s.group_id = g.id
        WHERE g.user_id = ?
    `);
    const totalSupplications = totalSupplicationsStmt.get(userId);

    // Completed supplications
    const completedStmt = db.prepare(`
        SELECT COUNT(*) as total
        FROM supplications s
        JOIN groups g ON s.group_id = g.id
        WHERE g.user_id = ? AND s.currentCount >= s.target
    `);
    const completedSupplications = completedStmt.get(userId);

    res.json({
        today: todayResult?.total || 0,
        week: weekResult?.total || 0,
        month: monthResult?.total || 0,
        allTime: allTimeResult?.total || 0,
        totalSupplications: totalSupplications?.total || 0,
        completedSupplications: completedSupplications?.total || 0
    });
}));

// Get daily counts for charts (last 30 days)
app.get('/api/statistics/daily', authenticateToken, validateQuery(daysQuerySchema), catchAsync(async (req, res) => {
    const userId = req.user.id;
    const days = req.query.days;

    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);

    const stmt = db.prepare(`
        SELECT
            DATE(timestamp / 1000, 'unixepoch') as date,
            SUM(count) as total
        FROM count_history
        WHERE user_id = ? AND timestamp >= ?
        GROUP BY DATE(timestamp / 1000, 'unixepoch')
        ORDER BY date DESC
    `);

    const results = stmt.all(userId, startTime);
    res.json(results);
}));

// Get top supplications by count
app.get('/api/statistics/top', authenticateToken, validateQuery(limitQuerySchema), catchAsync(async (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit;

    const stmt = db.prepare(`
        SELECT
            s.id,
            s.title,
            s.text,
            s.currentCount,
            s.target,
            SUM(ch.count) as totalCounted,
            g.name as groupName
        FROM supplications s
        JOIN groups g ON s.group_id = g.id
        LEFT JOIN count_history ch ON s.id = ch.supplication_id
        WHERE g.user_id = ?
        GROUP BY s.id
        ORDER BY totalCounted DESC
        LIMIT ?
    `);

    const results = stmt.all(userId, limit);
    res.json(results);
}));

// --- LIBRARY ENDPOINT ---

// Get Hisnul Muslim library data
app.get('/api/library', catchAsync(async (req, res, next) => {
    const fs = require('fs');
    const path = require('path');
    const libraryPath = path.join(__dirname, 'data', 'hisnul-muslim.json');

    if (!fs.existsSync(libraryPath)) {
        return next(new AppError('Library not found', 404));
    }

    const libraryData = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    res.json(libraryData);
}));

// --- SETTINGS ENDPOINTS ---

// Get user settings
app.get('/api/settings', authenticateToken, catchAsync(async (req, res) => {
    const userId = req.user.id;

    let stmt = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
    let settings = stmt.get(userId);

    // If no settings exist, create default settings
    if (!settings) {
        const insertStmt = db.prepare(`
            INSERT INTO user_settings (user_id, notifications_enabled, theme, default_font_size, default_font_weight)
            VALUES (?, 0, 'auto', '2xs', 'bold')
        `);
        insertStmt.run(userId);
        settings = {
            user_id: userId,
            notifications_enabled: 0,
            theme: 'auto',
            default_font_size: '2xs',
            default_font_weight: 'bold'
        };
    }

    res.json({
        userId: settings.user_id.toString(),
        notificationsEnabled: Boolean(settings.notifications_enabled),
        theme: settings.theme,
        defaultFontSize: settings.default_font_size,
        defaultFontWeight: settings.default_font_weight
    });
}));

// Update user settings
app.put('/api/settings', authenticateToken, validate(updateSettingsSchema), catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { notificationsEnabled, theme, defaultFontSize, defaultFontWeight } = req.body;

    const stmt = db.prepare(`
        INSERT INTO user_settings (user_id, notifications_enabled, theme, default_font_size, default_font_weight)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            notifications_enabled = excluded.notifications_enabled,
            theme = excluded.theme,
            default_font_size = excluded.default_font_size,
            default_font_weight = excluded.default_font_weight
    `);

    stmt.run(
        userId,
        notificationsEnabled ? 1 : 0,
        theme || 'auto',
        defaultFontSize || '2xs',
        defaultFontWeight || 'bold'
    );

    res.json({
        userId: userId.toString(),
        notificationsEnabled: Boolean(notificationsEnabled),
        theme: theme || 'auto',
        defaultFontSize: defaultFontSize || '2xs',
        defaultFontWeight: defaultFontWeight || 'bold'
    });
}));

// Get reminder times
app.get('/api/settings/reminders', authenticateToken, catchAsync(async (req, res) => {
    const userId = req.user.id;

    const stmt = db.prepare('SELECT * FROM reminder_times WHERE user_id = ? ORDER BY time ASC');
    const reminders = stmt.all(userId);

    res.json(reminders.map(r => ({
        id: r.id.toString(),
        userId: r.user_id.toString(),
        time: r.time,
        message: r.message,
        enabled: Boolean(r.enabled)
    })));
}));

// Add reminder time
app.post('/api/settings/reminders', authenticateToken, validate(createReminderSchema), catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { time, message, enabled } = req.body;

    const stmt = db.prepare('INSERT INTO reminder_times (user_id, time, message, enabled) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, time, message || null, enabled !== false ? 1 : 0);

    res.status(201).json({
        id: info.lastInsertRowid.toString(),
        userId: userId.toString(),
        time,
        message: message || null,
        enabled: enabled !== false
    });
}));

// Update reminder time
app.put('/api/settings/reminders/:id', authenticateToken, validateParams(idSchema), validate(updateReminderSchema), catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { time, message, enabled } = req.body;

    // Verify the reminder belongs to the user
    const checkStmt = db.prepare('SELECT * FROM reminder_times WHERE id = ? AND user_id = ?');
    const reminder = checkStmt.get(id, userId);

    if (!reminder) {
        return next(new AppError('Reminder not found or not owned by user', 404));
    }

    const stmt = db.prepare('UPDATE reminder_times SET time = ?, message = ?, enabled = ? WHERE id = ? AND user_id = ?');
    stmt.run(
        time || reminder.time,
        message !== undefined ? message : reminder.message,
        enabled !== undefined ? (enabled ? 1 : 0) : reminder.enabled,
        id,
        userId
    );

    res.json({
        id: id,
        userId: userId.toString(),
        time: time || reminder.time,
        message: message !== undefined ? message : reminder.message,
        enabled: enabled !== undefined ? Boolean(enabled) : Boolean(reminder.enabled)
    });
}));

// Delete reminder time
app.delete('/api/settings/reminders/:id', authenticateToken, validateParams(idSchema), catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM reminder_times WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, userId);

    if (info.changes === 0) {
        return next(new AppError('Reminder not found or not owned by user', 404));
    }

    res.sendStatus(204);
}));

// --- GLOBAL ERROR HANDLER ---
// Must be defined AFTER all routes

// Handle 404 errors
app.all('*', (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
