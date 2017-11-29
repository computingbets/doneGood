var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


urls = [
  'https://thekozm.com/shop/'
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
  // Here is where you'll have access to the product page listings
  pages.forEach(function($){
    // This code here grabs the url from each listing, and then pushes that url into the pageUrls array
    $('.product-index__single').each(function(index, elem){
      var productUrl = $(elem).attr("href");
      // II: So here I'm grabbing the imageUrl as well. But, now the challenge is I have to pass two pieces of data into an Array,
      // this is because Promises can only return ONE variable (which is the pageUrls array). To do this, I made a new object called productObj where I stored
      // both the productUrl and the imageUrl and pushed the object into the pageUrls array.
      var imageUrl = $(elem).find('div.product-index__image img').attr('src');
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
  // II: Now I'm iterating through an array of objects. So I need to pull out my data and store them into separate variables before continuing.
  // This isn't ENTIRELY necessary, but it helps make the code more readable.
  // Because there's already some code referencing the "url" variable, I'll just keep calling that url and the new one i'll call imgUrl
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
      var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName, //keywords
      //var keywordsArr = [];
      productUrl = response[0];
      $ = response[1];
      // II: Boom, now I've grabbed the imageUrl just as if I was crawling a product page, and we can grab the rest like normal.
      imageUrl = response[2];

      // II: Your query was fine, but it contained some raw HTML line breaks, which looks ugly. So I found a different location to grab cleaner text.
      productName = $('.product-responsive-title > h1').text();
      productPrice = $('.woocommerce-Price-amount.amount').first().text();
          //$('p.price > span').text();
      productDescription = $('.product-details').children().first().next().text();
      pageTitle = $('title').text();
      //keywords = $('.active').children().first().next().text().slice(70, 145);
      //keywordsArr.push(keywords);
      //imageUrl = $('a[TabIndex*="0"]').attr("href");
      // Store all the info we found into the results object
      // II: changing the results[productName] to results[productUrl] as I think productUrl is more likely to be a unique identifier.
      results[productUrl] = {
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
