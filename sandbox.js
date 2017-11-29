var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');

var urls = ['https://www.tothemarket.com/bags/shopna-mini-messenger-stripes.html']

Promise.map(urls, function(url){
	var options = {
		uri: url,
		transform: function(body){
			return [url, cheerio.load(body)];
		}
	}
	return Promise.delay(20, rp(options));
}, {concurrency: 5})
.then(function(responses){
	var results = {};
	// Response Array [url, cheerio body]
	responses.forEach(function(response){
		// Now here is where we have access to each individual product page to get the rest of our information
	  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName

	  productUrl = response[0];
	  $ = response[1];
    
     var author = $('meta[name=keywords]').attr("content");
	  console.log(author)
	})
})
	