const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require("passport");
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const app = express();

const session = require("express-session");
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const authRoutes = require("./routes/authRoutes");
const urlShortner = require("./routes/urlShortnerRoutes")
const urlAnalytics = require("./routes/urlAnalyticsRoutes")
const middleware = require("./controllers/authController")


app.use(helmet());

const limiter = rateLimit({
    max: 100,
    windows: 60 * 60 * 1000,
    message: 'Too many requests from this Ip, please try in an hour!',
})

app.use('/api', limiter);

// Body Pareser 
app.use(express.json({ limit: '10kb' }));

app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));

// Data sanitization against Nosql
app.use(mongoSanitize());

// Data Sanitization against xss
app.use(xss());

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);


// Url Shortner Routes With middleware auth
app.use("/api", urlShortner)
app.use("/api/analytics", urlAnalytics)


app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler)

module.exports = app;