var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://bluemayan.coffee/'
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
	  var url1 = $('.pushed').eq(6).attr('href');
    var url2 = $('.pushed').eq(7).attr('href');
    var url3 = $('.pushed').eq(8).attr('href');
    var url4 = $('.pushed').eq(9).attr('href');
    var url5 = $('.pushed').eq(10).attr('href');
    var url6 = $('.pushed').eq(11).attr('href');
    var url7 = $('.pushed').eq(12).attr('href');
      //var productUrl = url1, url2, url3, url4,url5,url6,url7;
	    pageUrls.push(url1,url2,url3,url4,url5,url6,url7);
      console.log(pageUrls);

	  });
  })
	// return pageUrls;
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.product_title.entry-title').text();
		  productPrice = $('.woocommerce-Price-currencySymbol').text();
		  productDescription = $('.woocommerce-product-details__short-description').text();
		  pageTitle = $('title').text();
		  imageUrl = $('.wp-post-image.async-done').attr('src');

		  // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl
		  };

		  console.log(results[productName])

		})
		return results;
	})
	.then(function(results){
		// Now write the results to a json file
    fs.writeFile('outputFS.json', JSON.stringify(results, null, 4), function(err){
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
