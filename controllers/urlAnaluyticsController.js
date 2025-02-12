const Analytics = require("../models/urlAnalyticsModel");
const UrlShortner = require('./../models/urlShortnerModel')
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAnalyticsByAlias = catchAsync(async (req, res, next) => {
    const { alias } = req.params;

    const analytics = await Analytics.findOne({ alias });
    if (!analytics) return next(new AppError("No analytics found for this URL", 404));

    res.status(200).json({
        status: "success",
        data: {
            totalClicks: analytics.totalClicks,
            uniqueUsers: analytics.uniqueUsers,
            clicksByDate: analytics.clicksByDate.slice(-7), // Last 7 days
            osType: analytics.osType,
            deviceType: analytics.deviceType,
        }
    });
});

exports.getAnalyticsByTopic = catchAsync(async (req, res, next) => {
    const { topic } = req.params;
    const urls = await UrlShortner.find({ topic });

    if (urls.length === 0) {
        return next(new AppError("No URLs found under this topic", 404));
    }

    let totalClicks = 0;
    let uniqueUsers = new Set();
    let clicksByDateMap = new Map(); // Store clicks per date
    let urlsWithStats = [];

    for (let url of urls) {
        let analytics = await Analytics.findOne({ alias: url.customAlias });

        if (analytics) {
            totalClicks += analytics.totalClicks;
            if (Array.isArray(analytics.uniqueUsers)) {
                analytics.uniqueUsers.forEach(user => uniqueUsers.add(user));
            } else if (analytics.uniqueUsers) {
                uniqueUsers.add(analytics.uniqueUsers);
            }        

            analytics.clicksByDate.forEach(({ date, clickCount }) => {
                clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + clickCount);
            });

            let individualUniqueUsers = new Set();
            if (Array.isArray(analytics.uniqueUsers)) {
                analytics.uniqueUsers.forEach(user => individualUniqueUsers.add(user));
            } else if (analytics.uniqueUsers) {
                individualUniqueUsers.add(analytics.uniqueUsers);
            }

            urlsWithStats.push({
                shortUrl: url.shortUrl,
                totalClicks: analytics.totalClicks,
                uniqueUsers: individualUniqueUsers.size,
            });
        }
    }

    let clicksByDate = Array.from(clicksByDateMap.entries())
        .map(([date, clickCount]) => ({ date, clickCount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
        status: "success",
        data: {
            totalClicks,
            uniqueUsers: uniqueUsers.size,
            clicksByDate,
            urls: urlsWithStats,
        },
    });
});

exports.getOverAllAnalytics = catchAsync(async (req, res, next) => {
    const userId = req.user.userId;

    // Fetch the data from UrlShortner collection based on userId
    const urls = await UrlShortner.find({ userId });

    if (!urls || urls.length === 0) {
        return next(new AppError("No URLs found for this user", 404));
    }

    // Get the associated analytics data for each URL
    const analyticsData = await Analytics.find({ alias: { $in: urls.map(url => url.customAlias) } });

    if (!analyticsData || analyticsData.length === 0) {
        return next(new AppError("No analytics found for these URLs", 404));
    }

    // Aggregate analytics data
    let totalUrls = urls.length;
    let totalClicks = 0;
    let uniqueUsers = new Set();
    let clicksByDate = [];
    let osType = [];
    let deviceType = [];

    analyticsData.forEach((analytics) => {
        totalClicks += analytics.totalClicks;
        
        if (Array.isArray(analytics.uniqueUsers)) {
            analytics.uniqueUsers.forEach(user => uniqueUsers.add(user));
        } else if (analytics.uniqueUsers) {
            uniqueUsers.add(analytics.uniqueUsers);
        }

        // Merge clicksByDate
        analytics.clicksByDate.forEach(click => {
            let existingDate = clicksByDate.find(c => c.date === click.date);
            if (existingDate) {
                existingDate.clickCount += click.clickCount;
            } else {
                clicksByDate.push({ date: click.date, clickCount: click.clickCount });
            }
        });

        // Merge OS data
        analytics.osType.forEach(os => {
            let existingOs = osType.find(o => o.osName === os.osName);
            if (existingOs) {
                existingOs.uniqueClicks += os.uniqueClicks;
                existingOs.uniqueUsers += os.uniqueUsers;
            } else {
                osType.push(os);
            }
        });

        // Merge Device data
        analytics.deviceType.forEach(device => {
            let existingDevice = deviceType.find(d => d.deviceName === device.deviceName);
            if (existingDevice) {
                existingDevice.uniqueClicks += device.uniqueClicks;
                existingDevice.uniqueUsers += device.uniqueUsers;
            } else {
                deviceType.push(device);
            }
        });
    });

    // Sort clicksByDate by date and slice last 7 days
    clicksByDate.sort((a, b) => new Date(a.date) - new Date(b.date));
    clicksByDate = clicksByDate.slice(-7);

    const responseData = {
        totalUrls,
        totalClicks,
        uniqueUsers: uniqueUsers.size,
        clicksByDate,
        osType,
        deviceType,
    };

    res.status(200).json({ status: "success", data: responseData });

});



