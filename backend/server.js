
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { analyzeEmail } from "./src/analyzer.js";
import { connectDB } from "./src/db.js";
import EmailAnalysis from "./src/models/EmailAnalysis.js";
import SecurityAlert from "./src/models/SecurityAlert.js";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 4000;

const origins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...(process.env.CLIENT_ORIGIN || "")
        .split(",")
        .map(x => x.trim())
        .filter(Boolean)
]);

app.use(helmet());

app.use(cors({
    origin(origin, callback) {
        if (!origin || origins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
    }
}));

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (_req, res) => {
    res.json({
        name: "Email Security API",
        status: "ok",
        health: "/api/health"
    });
});

app.get("/api/health", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        status: connected ? "ok" : "error",
        database: connected ? "connected" : "disconnected",
        time: new Date().toISOString()
    });
});

// Analyze and save email
app.post("/api/emails/analyze", async (req, res) => {
    try {
        const {
            sender = "",
            subject = "",
            message = ""
        } = req.body || {};

        if (
            ![sender, subject, message].every(x => typeof x === "string") ||
            !sender.trim() ||
            !subject.trim() ||
            !message.trim()
        ) {
            return res.status(400).json({
                error: "Please provide sender, subject, and message as non-empty text."
            });
        }

        if (
            sender.length > 254 ||
            subject.length > 300 ||
            message.length > 10000
        ) {
            return res.status(413).json({
                error: "Input is too long."
            });
        }

        const analysis = analyzeEmail({
            sender: sender.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        const savedEmail = await EmailAnalysis.create({
            ...analysis,
            sender: sender.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        // Save an alert for non-safe emails
        if (savedEmail.classification !== "SAFE") {
            await SecurityAlert.create({
                analysisId: savedEmail._id,
                classification: savedEmail.classification,
                sender: savedEmail.sender,
                subject: savedEmail.subject,
                riskScore: savedEmail.riskScore
            });
        }

        const result = {
            ...analysis,
            id: savedEmail._id.toString(),
            createdAt: savedEmail.createdAt.toISOString()
        };

        return res.json(result);

    } catch (error) {
        console.error("Email analysis error:", error);
        return res.status(500).json({
            error: "Unable to analyze and save the email."
        });
    }
});

// Get email history
app.get("/api/emails", async (_req, res) => {
    try {
        const emails = await EmailAnalysis.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const items = emails.map(email => ({
            ...email,
            id: email._id.toString(),
            createdAt: email.createdAt.toISOString()
        }));

        res.json({ items });

    } catch (error) {
        console.error("Email history error:", error);
        res.status(500).json({
            error: "Unable to fetch email history."
        });
    }
});

// Dashboard statistics
app.get("/api/dashboard", async (_req, res) => {
    try {
        const [
            totalAnalyzed,
            safe,
            suspicious,
            spam,
            alerts
        ] = await Promise.all([
            EmailAnalysis.countDocuments(),
            EmailAnalysis.countDocuments({ classification: "SAFE" }),
            EmailAnalysis.countDocuments({ classification: "SUSPICIOUS" }),
            EmailAnalysis.countDocuments({ classification: "SPAM" }),
            SecurityAlert.countDocuments()
        ]);

        res.json({
            totalAnalyzed,
            safe,
            suspicious,
            spam,
            alerts
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            error: "Unable to fetch dashboard statistics."
        });
    }
});

// Get security alerts
app.get("/api/alerts", async (_req, res) => {
    try {
        const alerts = await SecurityAlert.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const items = alerts.map(alert => ({
            ...alert,
            id: alert._id.toString(),
            createdAt: alert.createdAt.toISOString()
        }));

        res.json({ items });

    } catch (error) {
        console.error("Alerts error:", error);
        res.status(500).json({
            error: "Unable to fetch security alerts."
        });
    }
});

// Error handler
app.use((error, _req, res, _next) => {
    console.error(error);

    const isCorsError = error.message.includes("CORS");

    res.status(isCorsError ? 403 : 500).json({
        error: isCorsError
            ? "Frontend origin is not allowed. Check CLIENT_ORIGIN."
            : "Internal server error."
    });
});

// Connect database before starting server
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Email Security API running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
