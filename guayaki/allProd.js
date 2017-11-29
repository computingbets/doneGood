var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


urls = [
  'http://guayaki.com/category/11/Yerba-Mate-Tea-Bags.html',
  'http://guayaki.com/category/12/Loose-Leaf-Mate.html',
  'http://guayaki.com/category/13/Gourds-Bombillas.html',
  'http://guayaki.com/category/7/Bottled-Yerba-Mate.html',
  'http://guayaki.com/category/151/Cans.html',
  'http://guayaki.com/category/131/Organic-Energy-Shots.html',
  'http://guayaki.com/category/26/Mate-Accessories.html'
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
	  $('.product_small_link').each(function(index, elem){
	    var productUrl = $(elem).attr("href");
      //console.log(productUrl);
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName
      //var keywordsArr = [];
		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('h1').text();
		  productPrice = $('.ecomm_product_price_right').text();
		  productDescription = $('.short_desc').text();
		  pageTitle = $('title').text();
      var http = 'http://guayaki.com/';
		  imageUrl = http + $('.product_img a').children().first().attr("src");
      // var keywords = $('.Apple-style-span').text();
      //keywordsArr.push(keywords.split("•"));

		  // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl,
        //'keywordsArr': keywordsArr
		  };

		})
		return results;
	})
	.then(function(results){
		// Now write the results to a json file
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
