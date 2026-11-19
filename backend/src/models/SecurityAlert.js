
import mongoose from "mongoose";

const securityAlertSchema = new mongoose.Schema(
    {
        analysisId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true
        },
        classification: {
            type: String,
            enum: ["SUSPICIOUS", "SPAM"],
            required: true
        },
        sender: String,
        subject: String,
        riskScore: Number
    },
    {
        timestamps: true,
        collection: "securityalerts"
    }
);

const SecurityAlert = mongoose.model(
    "SecurityAlert",
    securityAlertSchema
);

export default SecurityAlert;
