#!/usr/bin/node

var Twitter = require('twitter');
var express = require("express");
var sockio = require("socket.io");
var r = require("rethinkdb");
var config = require("./config");

var conn;

// Setup the http server and socket.io
var app = express();
app.use(express.static(__dirname + "/public"));
var io = sockio.listen(app.listen(config.port), {log: false});
console.log("Server started on port " + config.port);

function streamTweets(tagName) {
    client.stream('statuses/filter', {track: tagName}, function(stream) {
        stream.on('data', function(tweet) {
	    var aTweet = {};
	    aTweet.text = tweet.text;
	    aTweet.username = tweet.user.name;
	    aTweet.profile = tweet.user.profile_image_url;
	    aTweet.time = new Date().getTime();
	    console.log(aTweet);
            console.log("\n");
	    insertTweet(aTweet);
        });

        stream.on('error', function(error) {
            throw error;
        });
    });
}

function insertTweet(tweet) {
    var conn;
    r.connect(config.database).then(function(c) {
        conn = c;
        return r.table("tweets").insert(tweet).run(conn)
    })
    .error(function(err) { console.log("Failure:", err); })
    .finally(function() {
        if (conn) conn.close();
    });
}

// When connected to client socket send backlog of tweets
io.sockets.on("connection", function(socket) {
    var conn;
    r.connect(config.database).then(function(c) {
        conn = c;
        return r.table("tweets")
        .orderBy({index: r.desc("time")})
        .limit(60).run(conn)
    })
    .then(function(cursor) { return cursor.toArray(); })
    .then(function(result) {
        socket.emit("recent", result);
    })
    .error(function(err) { console.log("Failure:", err); })
    .finally(function() {
    if (conn)
        conn.close();
    });
});



/* --------------------------------------------------------------------*/

// Create a Twitter client
var client = new Twitter({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token_key: config.twitter.access_token_key,
    access_token_secret: config.twitter.access_token_secret
});

r.connect(config.database).then(function(c) {
    conn = c;
    return r.dbCreate(config.database.db).run(conn);
})
.then(function() {
    return r.tableCreate("tweets").run(conn);
})
.then(function() {
    return r.table("tweets").indexCreate("time").run(conn)
})
.error(function(err) {
    if (err.msg.indexOf("already exists") == -1)
        console.log(err);
})
.finally(function() {
    r.table("tweets").changes().run(conn)
    .then(function(cursor) {
        cursor.each(function(err, item) {
            if (item && item.new_val) io.sockets.emit("tweet", item.new_val);
        });
    })
    .error(function(err) {
        console.log("Error:", err);
    });
    streamTweets("javascript");
});

