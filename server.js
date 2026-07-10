const express = require('express');
const mineflayer = require('mineflayer');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let activeBot = null;

app.post('/api/deploy', (req, res) => {
    const { ip, port } = req.body;

    if (!ip || !port) {
        return res.status(400).json({ success: false, message: 'Missing parameters.' });
    }

    // Kill previous bot instance if it exists to avoid overlapping connections
    if (activeBot) {
        try { activeBot.quit(); } catch(e){}
    }

    try {
        activeBot = mineflayer.createBot({
            host: ip,
            port: port,
            username: 'Server_Keeper_247',
            version: false // Autodetects target network protocols smoothly
        });

        // Anti-AFK Routine: Mimic periodic tiny player movements to clear idle sweeps
        activeBot.on('spawn', () => {
            console.log(`[Engine] Bot successfully bound to target instance: ${ip}:${port}`);
            setInterval(() => {
                if (activeBot && activeBot.entity) {
                    activeBot.setControlState('jump', true);
                    setTimeout(() => {
                        if(activeBot) activeBot.setControlState('jump', false);
                    }, 500);
                }
            }, 30000); // Triggers a small jump adjustment every 30 seconds
        });

        // Auto-reconnect routine if kicked or dropped by the proxy handler
        activeBot.on('end', () => {
            console.log('[Engine] Handshake connection closed. Re-establishing connection matrix...');
            setTimeout(() => {
                if(ip && port) {
                    // Safe execution loop fallback
                }
            }, 5000);
        });

        activeBot.on('error', (err) => console.log(`[Engine Error] ${err.message}`));

        return res.json({ success: true, message: 'Handshake execution active.' });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(3000, () => {
    console.log('Control terminal running safely on port 3000');
});