var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.thenaturalbabyco.com/collections/hybrid-cloth-diapers',
  'https://www.thenaturalbabyco.com/collections/all-in-ones',
  'https://www.thenaturalbabyco.com/collections/prefolds-flats',
  'https://www.thenaturalbabyco.com/collections/covers-fitted-cloth',
  "https://www.thenaturalbabyco.com/collections/trainers-swim-diapers",
  "https://www.thenaturalbabyco.com/collections/accessories-laundry",
  "https://www.thenaturalbabyco.com/collections/gear-and-furniture",
  "https://www.thenaturalbabyco.com/collections/clothing-shoes",
  "https://www.thenaturalbabyco.com/collections/montana-made-gifts",
  "https://www.thenaturalbabyco.com/collections/gender-reveal-gifts",
  "https://www.thenaturalbabyco.com/collections/baby-gifts-0-12-months",
  "https://www.thenaturalbabyco.com/collections/toddler-gifts-12-months",
  "https://www.thenaturalbabyco.com/collections/swaddles-blankets",
  "https://www.thenaturalbabyco.com/collections/teething",
  "https://www.thenaturalbabyco.com/collections/supplements-remedies",
  "https://www.thenaturalbabyco.com/collections/accessories-for-mom",
  "https://www.thenaturalbabyco.com/collections/sun-insect-protection",
  "https://www.thenaturalbabyco.com/collections/nap-time",
  "https://www.thenaturalbabyco.com/collections/soft-structured-carriers",
  "https://www.thenaturalbabyco.com/collections/slings",
  "https://www.thenaturalbabyco.com/collections/wraps",
  "https://www.thenaturalbabyco.com/collections/wooden-toys",
  "https://www.thenaturalbabyco.com/collections/baby-toys-play-mats",
  "https://www.thenaturalbabyco.com/collections/bath-time",
  "https://www.thenaturalbabyco.com/collections/ride-on-vehicles",
  "https://www.thenaturalbabyco.com/collections/musical",
  "https://www.thenaturalbabyco.com/collections/dolls-plush-toys",
  "https://www.thenaturalbabyco.com/collections/dolls-plush-toys?page=2",
  "https://www.thenaturalbabyco.com/collections/puzzles-mazes",
  "https://www.thenaturalbabyco.com/collections/toddler-and-pretend-play",
  "https://www.thenaturalbabyco.com/collections/toddler-and-pretend-play?page=2",
  "https://www.thenaturalbabyco.com/collections/books",
  "https://www.thenaturalbabyco.com/collections/books?page=2",
  "https://www.thenaturalbabyco.com/collections/baby-gifts-0-12-months?page=2",
  "https://www.thenaturalbabyco.com/collections/teething?page=2",
  "https://www.thenaturalbabyco.com/collections/wooden-toys?page=2",
  "https://www.thenaturalbabyco.com/collections/baby-toys-play-mats?page=2"
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
  	  $('.four.columns.alpha.thumbnail.even').each(function(index, elem){
	    var productUrl = "https://www.thenaturalbabyco.com" + $(elem).children().first().attr('href');
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
