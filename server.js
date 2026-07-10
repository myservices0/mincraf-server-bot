const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const MAIL_API = "https://api.mail.tm"; // Fast public mail domain framework API

// Get available temp domain strings automatically
let availableDomain = "";
axios.get(`${MAIL_API}/domains`).then(res => {
    availableDomain = res.data['hydra:member'][0].domain;
    console.log(`[System Ready] Routing emails via domain: @${availableDomain}`);
});

app.post('/api/create-matrix', async (req, res) => {
    const { prefix, count } = req.body;
    let accountsCreated = [];

    for (let i = 1; i <= count; i++) {
        // Generates cleanly separated variations like bot1, bot2...
        const uniqueUser = `${prefix}${i}_${Math.floor(Math.random() * 8999 + 1000)}`;
        const emailAddress = `${uniqueUser}@${availableDomain}`;
        const rawPassword = "VulcanStaticPass123!";

        try {
            // Register account natively into the disposable email API
            await axios.post(`${MAIL_API}/accounts`, { address: emailAddress, password: rawPassword });
            
            // Authorize and grab the unique network access token
            const authRes = await axios.post(`${MAIL_API}/token`, { address: emailAddress, password: rawPassword });
            
            accountsCreated.push({
                email: emailAddress,
                token: authRes.data.token
            });
        } catch (err) {
            console.log(`Generation skip on item ${i}`);
        }
    }
    res.json({ accounts: accountsCreated });
});

// Real-time message polling proxy
app.get('/api/messages', async (req, res) => {
    const { token } = req.query;
    try {
        const msgRes = await axios.get(`${MAIL_API}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.json({ messages: msgRes.data['hydra:member'] });
    } catch (err) {
        res.status(500).json({ messages: [] });
    }
});

app.listen(3000, () => console.log('Matrix Control Engine running on port 3000'));
