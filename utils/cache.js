const client = require('../config/redisClient');

//  Get cached data from Redis
const getCachedData = async (key) => {
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`❌ Redis Get Error:`, error);
        return null;
    }
};

// Set data in Redis cache
const setCachedData = async (key, data, expiration = 600) => {
    try {
        await client.setEx(key, expiration, JSON.stringify(data));
        console.log(`✅ Cached: ${key}`);
    } catch (error) {
        console.error(`❌ Redis Set Error:`, error);
    }
};


// Invalidate cache
const invalidateCache = async (key) => {
    try {
        await client.del(key);
        console.log(`🗑️ Cache invalidated: ${key}`);
    } catch (error) {
        console.error(`❌ Redis Delete Error:`, error);
    }
};


module.exports = { getCachedData, setCachedData, invalidateCache };
