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

    if (activeBot) {
        try { activeBot.quit(); } catch(e){}
    }

    // Wrap the deployment inside a try/catch box to shield the engine from crashes
    try {
        activeBot = mineflayer.createBot({
            host: ip,
            port: port,
            username: 'Server_Keeper_247',
            version: false,
            skipValidation: true // Skips heavy handshakes to connect faster on weak hosts
        });

        activeBot.on('spawn', () => {
            console.log(`Bot connected to ${ip}:${port}`);
            setInterval(() => {
                if (activeBot && activeBot.entity) {
                    activeBot.setControlState('jump', true);
                    setTimeout(() => { if(activeBot) activeBot.setControlState('jump', false); }, 500);
                }
            }, 30000);
        });

        // SAFETY NET: Catches connection errors instead of crashing the web app
        activeBot.on('error', (err) => {
            console.log(`[Mineflayer Caught Error]: ${err.message}`);
        });

        activeBot.on('end', () => {
            console.log('Bot disconnected from server.');
        });

        // Instantly return true to the front end so the button updates
        return res.json({ success: true, message: 'Handshake running.' });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to initialize bot thread." });
    }
});

// GLOBAL SHIELD: Prevents the entire website from breaking if Mineflayer fails completely
process.on('unhandledRejection', (reason, promise) => {
    console.log('Handled an unhandled network promise rejection.');
});
process.on('uncaughtException', (err) => {
    console.log('Prevented a fatal engine crash.');
});

app.listen(3000, () => {
    console.log('Secure server running.');
});
