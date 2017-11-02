var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.tothemarket.com/new-arrivals',
  'https://www.tothemarket.com/accessories',
  'https://www.tothemarket.com/accessories/wallets-and-coin-purses',
  'https://www.tothemarket.com/accessories/makeup-totes',
  'https://www.tothemarket.com/accessories/scarves',
  'https://www.tothemarket.com/accessories/tech-accessories',
  'https://www.tothemarket.com/accessories/bag-accessories',
  'https://www.tothemarket.com/apparel',
  'https://www.tothemarket.com/bags',
  'https://www.tothemarket.com/bags/clutches',
  'https://www.tothemarket.com/bags/crossbody-bags',
  'https://www.tothemarket.com/bags/shoulder-bags',
  'https://www.tothemarket.com/bags/totes',
  'https://www.tothemarket.com/bags/backpacks',
  'https://www.tothemarket.com/bags/travel-bags',
  'https://www.tothemarket.com/jewelry',
  'https://www.tothemarket.com/jewelry/necklaces',
  'https://www.tothemarket.com/jewelry/bracelets',
  'https://www.tothemarket.com/jewelry/earrings',
  'https://www.tothemarket.com/paper-goods',
  'https://www.tothemarket.com/home-goods',
  'https://www.tothemarket.com/home-goods/baskets',
  'https://www.tothemarket.com/home-goods/blankets-and-quilts',
  'https://www.tothemarket.com/home-goods/candles',
  'https://www.tothemarket.com/home-goods/cooking-accessories',
  'https://www.tothemarket.com/home-goods/hand-and-tea-towels',
  'https://www.tothemarket.com/home-goods/holiday',
  'https://www.tothemarket.com/home-goods/pillows',
  'https://www.tothemarket.com/home-goods/tabletop',
  'https://www.tothemarket.com/home-goods/wall-art-and-decor',
  'https://www.tothemarket.com/kids',
  'https://www.tothemarket.com/pets',
  'https://www.tothemarket.com/mens',
  'https://www.tothemarket.com/sale',
  'https://www.tothemarket.com/shoes',
  'https://www.tothemarket.com/ttm-exclusives',
  'https://www.tothemarket.com/bath-body'
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
	  $('.product-hover a').each(function(index, elem){
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('product-name h1').text();
		  productPrice = $('span.price').text();
		  productDescription = $('div.std').text();
		  pageTitle = $('title').text();
		  imageUrl = $('.cloud-zoom').attr('href');

		  // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl
		  };

		})
		return results;
	})
	.then(function(results){
		// Now write the results to a json file
    fs.writeFile('outputTTM.json', JSON.stringify(results, null, 4), function(err){
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
