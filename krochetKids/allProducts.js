var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.krochetkids.org/products/womens/fair-trade-dresses/',
  'https://www.krochetkids.org/products/womens/womens-headwear/',
  'https://www.krochetkids.org/products/womens/womens-apparel/?orderby=date',
  'https://www.krochetkids.org/products/womens/womens-bags/',
  'https://www.krochetkids.org/products/womens/womens-accessories/',
  'https://www.krochetkids.org/products/mens/mens-headwear/',
  'https://www.krochetkids.org/products/mens/mens-apparel/',
  'https://www.krochetkids.org/products/mens/mens-bags/',
  'https://www.krochetkids.org/products/mens/mens-accessories/',
  'https://www.krochetkids.org/products/childrens/childrens-headwear/',
  'https://www.krochetkids.org/products/childrens/animals/',
  'https://www.krochetkids.org/products/childrens/childrens-accessories/'

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
	  $('.woocommerce-LoopProduct-link').each(function(index, elem){
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName//, keywords

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.product_title.entry-title').text();
      //$('p.price > span').text();
      productDescription = $('.entry-content').text();
      productPrice = $('.price').eq(0).text()
      pageTitle = $('title').text();
		  imageUrl = $('.attachment-shop_thumbnail.size-shop_thumbnail').attr("src");

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
