const { getCache, setCache } = require('../utils/cache');
const UrlShortner = require('./../models/urlShortnerModel')
const Analytics = require("../models/urlAnalyticsModel");
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');    
const crypto = require("crypto");

const generateAlias = async () => {
    let alias;
    let exists = true;
    while(exists){
        alias = crypto.randomBytes(3).toString("hex");
        exists = await UrlShortner.findOne({ shortUrl: alias });
    }
    return alias;
}

exports.createShortUrl = catchAsync(async (req, res, next) => {
    const {longUrl, customAlias, topic} = req.body;
    const userId = req.user.userId;
    let shortUrl;

    if(!longUrl){
        return next(new AppError("LongUrl is required", 400));
    }

    if(customAlias){
        const existingAlias = await UrlShortner.findOne({ shortUrl: customAlias });
        if(existingAlias){
            return next(new AppError("Alias already exists type another Alias", 400));
        };
        shortUrl = customAlias;
    }else{
        shortUrl = generateAlias();
    }

    // Rate Limiting
    lastMinuteShortrls = await UrlShortner.countDocuments({
        userId,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000 )},
    });
    if(lastMinuteShortrls >= 5){
        return next(new AppError("Rate Limit Exceeded. Try after Sometime", 429));
    }

    // Save to data base
    const newShortUrl = await UrlShortner.create({
        longUrl,
        shortUrl,
        customAlias: customAlias || null,
        topic,
        userId
    });

    res.status(201).json({
        status: "success",
        shortUrl: `${process.env.BASE_URL}/${newShortUrl.shortUrl}`,
        createdAt: newShortUrl.createdAt
    })

});


exports.redirectShortUrl = catchAsync(async (req, res, next) => {
    const { alias } = req.params;

    const cachedUrl = await getCache(alias);
    if (cachedUrl) {
        await trackClick(req);
        return res.redirect(301, cachedUrl);
    }

    const urlEntry = await UrlShortner.findOne({ shortUrl: alias });

    if (!urlEntry) {
        return next(new AppError("Short URL not found for this alias", 404));
    }

    await setCache(alias, urlEntry.longUrl, 600);

    await trackClick(req);
    res.redirect(301, urlEntry.longUrl);
});


const trackClick = catchAsync(async (req) => {
    const { alias } = req.params;  // Fix: Extract alias from req.params
    const userAgent = req.headers["user-agent"];

    // Find the URL Entry
    const urlData = await UrlShortner.findOne({ shortUrl: alias });
    if (!urlData) throw new AppError("Short URL not found", 404);

    // Extract OS & Device Info
    let osName = "Unknown", deviceName = "Unknown";
    if (/windows/i.test(userAgent)) osName = "Windows";
    if (/macintosh|mac os x/i.test(userAgent)) osName = "macOS";
    if (/linux/i.test(userAgent)) osName = "Linux";
    if (/android/i.test(userAgent)) osName = "Android";
    if (/iphone|ipad|ipod/i.test(userAgent)) osName = "iOS";
    
    if (/mobile/i.test(userAgent)) deviceName = "Mobile";
    if (/tablet/i.test(userAgent)) deviceName = "Tablet";
    if (!/mobile|tablet/i.test(userAgent)) deviceName = "Desktop";

    // Update Analytics
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    
    let analytics = await Analytics.findOne({ alias });

    if (!analytics) {
        analytics = new Analytics({
            alias,
            userAgent,
            totalClicks: 1,
            uniqueUsers: 1,
            clicksByDate: [{ date: today, clickCount: 1 }],
            osType: [{ osName, uniqueClicks: 1, uniqueUsers: 1 }],
            deviceType: [{ deviceName, uniqueClicks: 1, uniqueUsers: 1 }],
        });
    } else {
        analytics.totalClicks += 1;

        // Update clicksByDate (keep only last 7 days)
        let dateIndex = analytics.clicksByDate.findIndex(item => item.date === today);
        if (dateIndex >= 0) analytics.clicksByDate[dateIndex].clickCount += 1;
        else analytics.clicksByDate.push({ date: today, clickCount: 1 });

        // Update OS Data
        let osIndex = analytics.osType.findIndex(item => item.osName === osName);
        if (osIndex >= 0) analytics.osType[osIndex].uniqueClicks += 1;
        else analytics.osType.push({ osName, uniqueClicks: 1, uniqueUsers: 1 });

        // Update Device Data
        let deviceIndex = analytics.deviceType.findIndex(item => item.deviceName === deviceName);
        if (deviceIndex >= 0) analytics.deviceType[deviceIndex].uniqueClicks += 1;
        else analytics.deviceType.push({ deviceName, uniqueClicks: 1, uniqueUsers: 1 });
    }

    await analytics.save();
});


  