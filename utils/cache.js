const client = require('../config/redisClient');

const getCache = async (key) => {
    try {
        return await client.get(key);
    } catch (error) {
        console.error("Redis Get Error:", error);
        return null;
    }
};

// Function to set value in Redis with expiry
const setCache = async (key, value, expiry = 600) => {
    try {
        await client.setEx(key, expiry, value);
    } catch (error) {
        console.error("Redis Set Error:", error);
    }
};

module.exports = { getCache, setCache };
