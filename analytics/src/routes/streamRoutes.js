const router = require('express').Router();
const { getDb } = require('../config/db');

// ─── Connected SSE Clients ─────────────────────────────────────────────────────

const clients = new Set();

router.get('/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });

    // Send initial heartbeat
    res.write(': connected\n\n');

    clients.add(res);

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(res);
    });
});


// ─── Broadcast Helper ──────────────────────────────────────────────────────────

function broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
        client.write(payload);
    }
}


// ─── Change Stream Watcher ─────────────────────────────────────────────────────

function startChangeStream() {
    const db = getDb();
    const query = db.collection('visitors');
    
    const observer = query.onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data();
                broadcast('analytics:view', { page: data.page, totalViews: data.totalViews });
            }
        });
    }, err => {
        console.error('Analytics change stream error:', err.message);
    });

    console.log('Analytics Firestore watcher started');
}

module.exports = { router, startChangeStream, broadcast };
