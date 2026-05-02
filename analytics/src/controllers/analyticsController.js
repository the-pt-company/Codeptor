const crypto = require('crypto');
const admin = require('firebase-admin');
const { getDb } = require('../config/db');
const AppError = require('../utils/AppError');

const hashIp = (ip) => crypto.createHash('sha256').update(ip).digest('hex');

const getClientIp = (req) =>
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0';

/**
 * POST /api/analytics/track
 * Body: { page: string }
 */
exports.trackVisit = async (req, res, next) => {
    try {
        const { page } = req.body;
        if (!page) return next(new AppError('Field "page" is required', 400));

        const clientIp = getClientIp(req);
        const hashed = hashIp(clientIp);
        const now = new Date();
        const db = getDb();

        // Always log the visit
        await db.collection('visits').add({
            hashedIp: hashed,
            page,
            userAgent: req.headers['user-agent'] || '',
            referrer: req.headers['referer'] || '',
            visitedAt: now,
        });

        // Check for recent visit from same IP on same page (1-hour window)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentVisits = await db.collection('visits')
            .where('hashedIp', '==', hashed)
            .where('page', '==', page)
            .where('visitedAt', '>=', oneHourAgo)
            .limit(1)
            .get();

        const isNewVisitor = recentVisits.empty;

        const visitorRef = db.collection('visitors').doc(encodeURIComponent(page));
        
        const updateData = {
            page,
            totalViews: admin.firestore.FieldValue.increment(1),
            lastVisitedAt: now
        };
        
        if (isNewVisitor) {
            updateData.uniqueVisitors = admin.firestore.FieldValue.increment(1);
        }

        await visitorRef.set(updateData, { merge: true });

        return res.status(200).json({
            status: 'success',
            message: 'Visit recorded',
            isNewVisitor,
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * GET /api/analytics/stats/:page
 */
exports.getPageStats = async (req, res, next) => {
    try {
        const { page } = req.params;
        const db = getDb();
        const doc = await db.collection('visitors').doc(encodeURIComponent(page)).get();

        if (!doc.exists) {
            return res.status(200).json({
                status: 'success',
                data: { page, uniqueVisitors: 0, totalViews: 0, lastVisitedAt: null },
            });
        }
        
        const stats = doc.data();
        return res.status(200).json({ status: 'success', data: stats });
    } catch (err) {
        return next(err);
    }
};

/**
 * GET /api/analytics/stats
 */
exports.getAllStats = async (req, res, next) => {
    try {
        const db = getDb();
        const snapshot = await db.collection('visitors').get();
        
        const pages = [];
        let totalUniqueVisitors = 0;
        let totalViews = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            pages.push(data);
            totalUniqueVisitors += data.uniqueVisitors || 0;
            totalViews += data.totalViews || 0;
        });
        
        pages.sort((a, b) => b.totalViews - a.totalViews);

        return res.status(200).json({
            status: 'success',
            data: {
                summary: { 
                    totalUniqueVisitors, 
                    totalViews, 
                    pageCount: pages.length 
                },
                pages,
            },
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * GET /api/analytics/health
 */
exports.healthCheck = async (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Analytics service is running',
        database: 'connected',
        uptime: process.uptime().toFixed(0) + 's',
    });
};

// ─── Convenience Endpoints ─────────────────────────────────────────────────────

const trackPageView = async (req, res, next, pagePrefix) => {
    const { id } = req.params;
    if (!id) return next(new AppError('ID parameter is required', 400));
    req.body.page = `${pagePrefix}/${id}`;
    return exports.trackVisit(req, res, next);
};

exports.trackProfileView = (req, res, next) => trackPageView(req, res, next, '/profile');
exports.trackBlogView = (req, res, next) => trackPageView(req, res, next, '/blog');
exports.trackRepoView = (req, res, next) => trackPageView(req, res, next, '/repo');

exports.debugDB = async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return next(new AppError('Debug endpoint disabled in production', 403));
        }

        const db = getDb();
        const visitorsSnap = await db.collection('visitors').get();
        const visitors = [];
        visitorsSnap.forEach(d => visitors.push(d.data()));
        
        const visitsSnap = await db.collection('visits').orderBy('visitedAt', 'desc').limit(20).get();
        const visits = [];
        visitsSnap.forEach(d => visits.push(d.data()));

        return res.status(200).json({
            status: 'success',
            data: {
                visitors: { count: visitors.length, documents: visitors },
                visits: { count: visits.length, documents: visits },
            },
        });
    } catch (err) {
        return next(err);
    }
};
