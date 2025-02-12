const redis = require('redis');

const client = redis.createClient({
    username: 'default',
    password: 'JrVEckLE3620Fb3kYonue5Crf3AHJXcs',
    socket: {
        host: 'redis-10616.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10616
    }
});

client.on('error', (err) => console.log('❌ Redis Client Error:', err));

client.connect()
    .then(() => console.log('✅ Redis Connected'))
    .catch((err) => console.error('❌ Redis Connection Failed:', err));

module.exports = client;
