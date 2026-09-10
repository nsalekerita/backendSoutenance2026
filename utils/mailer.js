"use strict";
exports.envoyerEmail = envoyerEmail;
const nodemailer = require("nodemailer");
const { env } = require("../config/env");

let transporter;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpPort === 465,
            auth: { user: env.smtpUser, pass: env.smtpPass },
        });
    }
    return transporter;
}

async function envoyerEmail({ to, subject, html }) {
    await getTransporter().sendMail({ from: env.smtpFrom, to, subject, html });
}
