var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.fortressofinca.com/women/',
  'https://www.fortressofinca.com/women/?search_query=&page=2&limit=30&sort=featured&category=1&is_category_page=1'
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
	  $('.ProductImage.QuickView').each(function(index, elem){
	    var productUrl = $(elem).children().first().attr("href");
      var imageUrl = $(elem).find('img').attr('src');
      //console.log(imageUrl);
      var productObj = {
        productUrl: productUrl,
        imageUrl: imageUrl
      };
      pageUrls.push(productObj);
	  });
	})
	return pageUrls;
})
.then(function(pageUrls){
  Promise.map(pageUrls, function(urlObj){
    var url = urlObj.productUrl;
    var imgUrl = urlObj.imageUrl;
    var options = {
      uri: url,
      transform: function(body){
        // II: Here we're stuck again because Promises can only return ONE variable. So I'm storing everything in an array again.
        // Notice I added imgUrl to the array too. Before it was just [url, cheerio.load(body)]. This is how we pass the imageUrl along all the way to the end.
        return [url, cheerio.load(body), imgUrl];
      }
    }
		return Promise.delay(20, rp(options));
	}, {concurrency: 5})
	.then(function(responses){
		var results = {};
		// Response Array [url, cheerio body]
		responses.forEach(function(response){
			// Now here is where we have access to each individual product page to get the rest of our information
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName, keywordsLowPriority

      productUrl = response[0];
      $ = response[1];
      // II: Boom, now I've grabbed the imageUrl just as if I was crawling a product page, and we can grab the rest like normal.
      imageUrl = response[2];
      keywordsLowPriority = []
		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.ProductTitle').text();
		  productPrice = $('meta[itemprop=price]').attr("content");
      //$('p.price > span').text();
		  productDescription = $('.ProductDescriptionContainer.prodAccordionContent').text();
      //.children().first().next()
		  pageTitle = $('title').text();
      var key1 = $('.ProductDescriptionContainer.prodAccordionContent').children().first().text();
      var key2 = $('.ProductDescriptionContainer.prodAccordionContent').children().first().next().next().next().next().next().next().next().next().next().text();
      var key3 = $('.ProductDescriptionContainer.prodAccordionContent').children().first().next().next().next().next().next().next().next().next().next().next().text();
      var key4 = $('.ProductDescriptionContainer.prodAccordionContent').children().first().next().next().next().next().next().next().next().next().next().next().next().text();
		  //imageUrl = $('.zm-fast').attr("src");
      keywordsLowPriority.push(key1,key2,key3,key4);
      // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl,
        'keywordsLowPriority': keywordsLowPriority
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
