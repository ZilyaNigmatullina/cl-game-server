module.exports = {
    mongo: {
        url: "mongodb://localhost:27017/",
        options: {
            dbName: "game",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        }
    },
    server: {
        hostname: 'localhost',
        port: 7777,
    }
};