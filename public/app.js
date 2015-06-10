$(document).ready(function() {
    var template = Handlebars.compile($("#tweet-template").html());

    function addTweet(tweet) {
	var html = template(tweet).trim();
	$("#twitter-content").prepend(html);
    }

    var socket = io.connect();  
    socket.on("tweet", addTweet); 
    socket.on("recent", function(data) {
        data.reverse().forEach(addTweet);
    });
});
