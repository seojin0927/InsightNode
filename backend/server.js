const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory database for shared dashboards
// In production, use PostgreSQL, MongoDB, or Redis
const sharedDashboards = new Map();

// ======================
// API Routes
// ======================

// 1. Save dashboard configuration (for viral sharing)
app.post('/api/share', (req, res) => {
    try {
        const { columns, chartType, filters, sortConfig, groupConfig, title } = req.body;
        
        // Generate unique share ID
        const shareId = uuidv4().substring(0, 8);
        
        // Store dashboard configuration
        const dashboardData = {
            id: shareId,
            title: title || 'Untitled Dashboard',
            columns: columns || [],
            chartType: chartType || 'bar',
            filters: filters || [],
            sortConfig: sortConfig || {},
            groupConfig: groupConfig || {},
            createdAt: new Date().toISOString(),
            views: 0
        };
        
        sharedDashboards.set(shareId, dashboardData);
        
        res.json({ 
            success: true, 
            shareId: shareId,
            shareUrl: `/shared/${shareId}`
        });
    } catch (error) {
        console.error('Error saving dashboard:', error);
        res.status(500).json({ error: 'Failed to save dashboard' });
    }
});

// 2. Get shared dashboard configuration
app.get('/api/share/:id', (req, res) => {
    try {
        const { id } = req.params;
        const dashboard = sharedDashboards.get(id);
        
        if (!dashboard) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        
        // Increment view count
        dashboard.views += 1;
        sharedDashboards.set(id, dashboard);
        
        res.json(dashboard);
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// 3. Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        sharedDashboards: sharedDashboards.size
    });
});

// 4. List all shared dashboards (for admin)
app.get('/api/admin/dashboards', (req, res) => {
    const dashboards = Array.from(sharedDashboards.values()).map(d => ({
        id: d.id,
        title: d.title,
        createdAt: d.createdAt,
        views: d.views
    }));
    res.json(dashboards);
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
    console.log(`🚀 InsightNode Backend running on port ${PORT}`);
    console.log(`📊 API Endpoints:`);
    console.log(`   POST /api/share - Save dashboard configuration`);
    console.log(`   GET  /api/share/:id - Get shared dashboard`);
    console.log(`   GET  /api/health - Health check`);
});
