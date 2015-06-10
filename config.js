module.exports = {
  twitter: {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  },

  database: {
    host: "localhost",
    port: 28015,
    db: "twitter"
  },

  host: "localhost",
  port: 8000
}
