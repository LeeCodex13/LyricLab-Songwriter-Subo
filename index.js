// Entry point for Smart WaterWorks System
const { startServer } = require('./server/index.js');
const PORT = process.env.PORT || 3000;
startServer(PORT);
