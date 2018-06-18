var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.badgerbalm.com/c-33-organic-aromatherapy-oils-products.aspx',
  'https://www.badgerbalm.com/c-32-organic-baby-kid-and-mom-products.aspx',
  'https://www.badgerbalm.com/c-37-balms-in-tins.aspx',
  'https://www.badgerbalm.com/c-70-badger-bestsellers.aspx',
  'https://www.badgerbalm.com/c-28-natural-organic-body-care.aspx',
  'https://www.badgerbalm.com/c-35-clothing-accessories-art.aspx',
  'https://www.badgerbalm.com/c-80-organic-extra-virgin-olive-oil.aspx',
  'https://www.badgerbalm.com/c-54-organic-face-care-products.aspx',
  'https://www.badgerbalm.com/c-63-gluten-free-skin-care-products.aspx',
  'https://www.badgerbalm.com/c-36-natural-organic-body-care-gifts.aspx',
  'https://www.badgerbalm.com/c-64-natural-organic-gifts-under-10.aspx',
  'https://www.badgerbalm.com/c-42-natural-organic-hair-care.aspx',
  'https://www.badgerbalm.com/c-27-lip-balm-natural-organic.aspx',
  'https://www.badgerbalm.com/c-52-organic-mens-grooming-products.aspx',
  'https://www.badgerbalm.com/c-34-organic-massage-oil-body-oil.aspx',
  'https://www.badgerbalm.com/c-29-muscle-joint-care.aspx',
  'https://www.badgerbalm.com/c-41-damascus-rose-beauty-products.aspx',
  'https://www.badgerbalm.com/c-31-natural-sleep-remedies.aspx',
  'https://www.badgerbalm.com/c-24-natural-sunscreen.aspx',
  'https://www.badgerbalm.com/c-53-unscented-skin-care-products.aspx'
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
    $('.grid-item-image-wrap').each(function(index, elem){
    var productUrl = 'https://www.badgerbalm.com' + $(elem).children().first().attr('href');
      //console.log(productUrl);
	    pageUrls.push(productUrl);

      var category = $(elem).find('div.text-center').text();
      var productObj = {
        productUrl: productUrl,
        category: category
      };
      pageUrls.push(productObj);
	  });
	})
	return pageUrls;
})
.then(function(pageUrls){
	Promise.map(pageUrls, function(urlObj){
    var url = urlObj.productUrl;
    var category = urlObj.category;
    var options = {
      uri: url,
      transform: function(body){
        // II: Here we're stuck again because Promises can only return ONE variable. So I'm storing everything in an array again.
        // Notice I added imgUrl to the array too. Before it was just [url, cheerio.load(body)]. This is how we pass the imageUrl along all the way to the end.
        return [url, cheerio.load(body), category];
			}
		}
		return Promise.delay(20, rp(options));
	}, {concurrency: 5})
	.then(function(responses){
		var results = {};
		// Response Array [url, cheerio body]
		responses.forEach(function(response){
			// Now here is where we have access to each individual product page to get the rest of our information
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName, category//keywords

		  productUrl = response[0];
		  $ = response[1];

		  productName = $('.product-page-header').text();
      productPrice = $('.variant-price').text();
      productDescription = $('#productinfo li').text();
      pageTitle = $('title').text();
		  imageUrl = 'https://www.badgerbalm.com' + $('.hidden-md.hidden-lg').children().first().attr('src');

      //keywords.push(key1, key2, key3);
      // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl,
        'category': category
        //'keywords: color': keywords
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
