const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: 'ai-impact-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
};

// --- ROUTES ---

// Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin2026' && password === 'Samantha26') {
        req.session.authenticated = true;
        res.status(200).send('Authenticated');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Admin Panel (Protected)
app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Main Dashboard (Static)
app.use(express.static(path.join(__dirname, '../frontend')));

// --- SHARED LIVE STATE ---
let globalStats = { 
    totalExposed: 31460000, 
    currentDisplaced: 0, 
    newJobsCreated: 0 
};

let countryData = {
    US: { name: "United States", total: 143000000, exposed: 31460000, displaced: 0, created: 0 }
};

let latestEvents = [
    { title: "Dashboard initialized with Zero-Data engine", country: "US", type: "create", theme: "SYSTEM", src: "Status", time: "Just Now", link: "#" }
];

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
    socket.emit('initial_state', { 
        global: globalStats, 
        countries: countryData,
        latestEvents: latestEvents 
    });

    socket.on('admin_update_global', (data) => {
        globalStats = data;
        io.emit('stats_update', globalStats);
        console.log("📢 Global Dashboard override broadcasted");
    });

    socket.on('admin_update_country', (data) => {
        countryData[data.code] = { ...countryData[data.code], ...data };
        io.emit('country_update', { code: data.code, data: countryData[data.code] });
        console.log(`📍 Region ${data.code} recalibrated`);
    });

    socket.on('admin_inject_news', (news) => {
        latestEvents.unshift(news);
        if (latestEvents.length > 30) latestEvents.pop();
        io.emit('new_event', news);
        console.log(`📰 Custom news injected: ${news.title}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Unified Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
});
