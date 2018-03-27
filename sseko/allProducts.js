var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://ssekodesigns.com/apparel.html',
  'https://ssekodesigns.com/apparel.html?p=2',
  'https://ssekodesigns.com/footwear/sandals/ribbon-sandals.html',
  'https://ssekodesigns.com/footwear/sandals/ribbon-sandals.html?p=2',
  "https://ssekodesigns.com/footwear/sandals/ribbon-sandals.html?p=3",
  "https://ssekodesigns.com/footwear/sandals/slide-sandals.html",
  "https://ssekodesigns.com/footwear/sandals/rue-sandals.html",
  "https://ssekodesigns.com/footwear/sandals/platform-sandals.html",
  "https://ssekodesigns.com/footwear/sandals/wrap-sandals.html",
  "https://ssekodesigns.com/footwear/sandals/leather-flip-flops.html",
  "https://ssekodesigns.com/footwear/sandals/t-strap-sandals.html",
  "https://ssekodesigns.com/footwear/sandals/sandal-accents.html",
  "https://ssekodesigns.com/footwear/sandals/sandal-straps.html",
  "https://ssekodesigns.com/footwear/sandals/sandal-straps.html?p=2",
  "https://ssekodesigns.com/footwear/sandals/sandal-straps.html?p=3",
  "https://ssekodesigns.com/footwear/sandals/sandal-straps.html?p=4",
  "https://ssekodesigns.com/leather-bags/travel-collection.html",
  "https://ssekodesigns.com/leather-bags/shoulder-bags.html",
  "https://ssekodesigns.com/leather-bags/leather-totes.html",
  "https://ssekodesigns.com/leather-bags/crossbody-bags.html",
  "https://ssekodesigns.com/leather-bags/backpacks.html",
  "https://ssekodesigns.com/leather-bags/small-leather-goods.html",
  "https://ssekodesigns.com/leather-bags/small-leather-goods.html?p=2",
  "https://ssekodesigns.com/leather-bags/small-leather-goods.html?p=3",
  "https://ssekodesigns.com/accessories/jewelry/necklaces.html",
  "https://ssekodesigns.com/accessories/jewelry/earrings.html",
  "https://ssekodesigns.com/accessories/jewelry/bangles-bracelets.html",
  "https://ssekodesigns.com/accessories/jewelry/bangles-bracelets.html?p=2",
  "https://ssekodesigns.com/accessories/jewelry/brave-jewelry.html",
  "https://ssekodesigns.com/accessories/jewelry/brave-jewelry.html?p=2",
  "https://ssekodesigns.com/accessories/jewelry/brave-jewelry.html?p=3",
  "https://ssekodesigns.com/accessories/jewelry/brave-jewelry.html?p=4",
  "https://ssekodesigns.com/accessories/jewelry/brave-jewelry.html?p=5",
  "https://ssekodesigns.com/accessories/jewelry/paradox-collection.html",
  "https://ssekodesigns.com/accessories/jewelry/paradox-collection.html?p=2",
  "https://ssekodesigns.com/accessories/scarves.html",
  "https://ssekodesigns.com/accessories/prints.html"
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
  	  $('.product-image-wrapper').each(function(index, elem){
	    var productUrl = $(elem).children().first().attr('href');
      console.log(productUrl);
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName//, keywords

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.product-name').text();
      //$('p.price > span').text();
      productDescription = $('.std > p').text();
      productPrice = $('.price').text();
      pageTitle = $('title').text();
		  imageUrl = $('#image-0').attr('src');

      //keywords.push(key1,key2,key3,key4,key5);
      // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl
        //'keywords': keywords
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
