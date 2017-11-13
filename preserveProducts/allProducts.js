var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.preserveproducts.com/shop/bath/oral-care',
  'https://www.preserveproducts.com/shop/bath/razors',
  'https://www.preserveproducts.com/shop/bath/travel',
  'https://www.preserveproducts.com/shop/kitchen/food-storage',
  'https://www.preserveproducts.com/shop/kitchen/tools',
  'https://www.preserveproducts.com/shop/tabletop/straws',
  'https://www.preserveproducts.com/shop/tabletop/collections',
  'https://www.preserveproducts.com/shop/tabletop/cups',
  'https://www.preserveproducts.com/shop/tabletop/plates',
  'https://www.preserveproducts.com/shop/tabletop/bowls',
  'https://www.preserveproducts.com/shop/tabletop/cutlery',
  'https://www.preserveproducts.com/shop/tabletop/bags-totes',
  'https://www.preserveproducts.com/shop/tabletop/shareware',
  'https://www.preserveproducts.com/shop/featured/dopper',
  'https://www.preserveproducts.com/shop/featured/preserve-compostables',
  'https://www.preserveproducts.com/shop/featured/utec-cutting-boards',
  'https://www.preserveproducts.com/shop/featured/subscriptions',
  'https://www.preserveproducts.com/shop/featured/friends-of-preserve',
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
	  $('.Listing-Thumbnail').each(function(index, elem){
      var http = 'https://www.preserveproducts.com'
	    var productUrl = http + $(elem).attr("href");
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
		  productName = $('.Page-Title').text();
		  productPrice = $('span.Price').text();
		  productDescription = $('.Body').text();
		  pageTitle = $('title').text();
		  imageUrl = $('.Gallery-Image').attr('src');

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
