var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'http://www.patagonia.com/shop/mens-jackets-vests'
  //'http://www.patagonia.com/shop/mens-jackets-vests-insulated-all?start=0&sz=24#tile-27',
  //'http://www.patagonia.com/shop/mens-waterproof-rain-jackets-vests?start=0&sz=24#tile-9',
  //'http://www.patagonia.com/shop/mens-hard-shell-jackets-vests?start=0&sz=24#tile-12',
  //'http://www.patagonia.com/shop/mens-soft-shell-jackets-vests?start=0&sz=24#tile-3',
  //'http://www.patagonia.com/shop/mens-climbing-jackets-vests?start=0&sz=36#tile-12',
  //'http://www.patagonia.com/shop/mens-ski-snowboard-jackets-vests?start=0&sz=24#tile-3',
  //'http://www.patagonia.com/shop/mens-3-in-1-jackets-vests?start=0&sz=24#tile-3',
  //'http://www.patagonia.com/shop/mens-casual-jackets-vests?start=0&sz=60#tile-45',
  //'http://www.patagonia.com/shop/mens-fleece?start=0&sz=24#tile-5',
  //'http://www.patagonia.com/shop/mens-jackets-vests-windbreaker?start=0&sz=24#tile-3'
  //'',
  //'',
]

Promise.map(urls, function(url){
	var options = {
		uri: url,
		transform: function(body){
			return cheerio.load(body);
		}
	}
	return Promise.delay(50, rp(options));
}, {concurrency: 1})
.then(function(pages){
	pageUrls = [];
	// Here is the access to the product page listings
	pages.forEach(function($){
		// This code here grabs the url from each listing, and then pushes that url into the pageUrls array
    $('.thumb-link').each(function(index, elem){
      var productUrl = $(elem).attr("href");
	    pageUrls.push(productUrl);
	  });
	})
	return pageUrls;
})
.then(function(pageUrls){
	Promise.map(pageUrls, function(url){
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName, keywords

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.product-name').text();
		  productPrice = $('.price-sales').first().text();
		  productDescription = $('.ch-lm-section-header').children().text();
		  pageTitle = $('title').text();
		  imageUrl = $('.primary-image').attr('src');
      keywords = $('meta[name=keywords]').attr("content");
      //keywords = $('em').text();
      //var keywordsArr = keywords.split("•").pop();
		  // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl,
        'keywords': keywords

// colorData : [
// colorname1 : {
// name: string,
// url : string,
// imageURL : string},
// colorname2 : {
// name: string,
// url : string,
// imageURL : string},
// ...
//
// }
// ]
		  };

		})
		return results;
	})
  .then(function(results){
		// Now write the results to a json file
    // var metaResults = fileResults[0];
    // var dataResults = fileResults[1];
    fs.writeFile('output.json', JSON.stringify(results, null, 4), function(err){
      console.log('done');
    })
	})
	.catch(function(err){
		console.log(err);
	})
})
.catch(function(err){
	console.log(err);
})
