"use strict";
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./auth/auth.routes");
const profilsRoutes = require("./profils/profils.routes");
const offresRoutes = require("./offres/offres.routes");
const candidaturesRoutes = require("./candidatures/candidatures.routes");
const filieresRoutes = require("./filieres/filieres.routes");
const adminRoutes = require("./admin/admin.routes");
const iaRoutes = require("./ia/ia.routes");
const { notFoundMiddleware, errorMiddleware } = require("./middleware/error.middleware");
const { env } = require("./config/env");

const app = express();
exports.app = app;

app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = env.corsAllowedOrigins;
app.use(cors({
    origin: allowedOrigins.length === 0 ? true : allowedOrigins,
}));
app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Trop de tentatives, réessayez plus tard' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'iai-horizon-backend' }));
app.use('/api/auth', authRoutes);
app.use('/api/profils', profilsRoutes);
app.use('/api/offres', offresRoutes);
app.use('/api/candidatures', candidaturesRoutes);
app.use('/api/filieres', filieresRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ia', iaRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
