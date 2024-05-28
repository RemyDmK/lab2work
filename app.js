const express = require("express");
const crypto = require("crypto");
const simpleGit = require("simple-git");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;
const SECRET = 'your_github_webhook_secret';

app.use(express.json());

function verifySignature(req, res, next) {
    const signature = req.headers['x-hub-signature'];
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha1', SECRET);
    const digest = 'sha1=' + hmac.update(payload).digest('hex');

    if (signature === digest) {
        return next();
    } else {
        return res.status(401).send('Signatures did not match!');
    }
}

app.post("/webhook", verifySignature, (req, res) => {
    const event = req.body;

    if (event.ref === 'refs/heads/your-branch') {
        console.log("Push event to your-branch received.");
        const git = simpleGit();
        git.pull('origin', 'your-branch', (err, update) => {
            if (err) {
                console.error('Error pulling from repository', err);
                return res.status(500).send('Error pulling from repository');
            }

            if (update && update.summary.changes) {
                console.log('Changes detected, building project...');
                exec('your-build-command', (err, stdout, stderr) => {
                    if (err) {
                        console.error('Build error:', stderr);
                        return res.status(500).send('Build error');
                    }

                    console.log('Build output:', stdout);
                    return res.status(200).send('Build completed');
                });
            } else {
                return res.status(200).send('No changes detected');
            }
        });
    } else {
        return res.status(200).send('Event received, but no action taken');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
