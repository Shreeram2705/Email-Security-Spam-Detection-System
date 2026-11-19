
import mongoose from "mongoose";

const emailAnalysisSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        senderValid: Boolean,
        classification: {
            type: String,
            enum: ["SAFE", "SUSPICIOUS", "SPAM"],
            required: true
        },
        riskScore: {
            type: Number,
            default: 0
        },
        findings: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        },
        fsm: {
            type: mongoose.Schema.Types.Mixed
        },
        explanation: String
    },
    {
        timestamps: true,
        collection: "emailanalyses"
    }
);

const EmailAnalysis = mongoose.model(
    "EmailAnalysis",
    emailAnalysisSchema
);

export default EmailAnalysis;
