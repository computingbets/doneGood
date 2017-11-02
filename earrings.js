//unpromisified function

var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');

var url = 'https://starfishproject.com/product-category/all/earrings/'

request(url, function(err, response, html){
	if (!err){
		var $ = cheerio.load(html);


		var result = {};
		$('.product-small').each(function(index, elem){
			var imageUrl, productUrl, pageTitle, productPrice, productDescription;

			productUrl = $(elem).children().first().attr('href');
			imageUrl = $(elem).find('div.product-image').find('div.front-image > img').attr('src')
			productPrice = $(elem).find('span.price > span').text();

			result[index] = {
				productUrl: productUrl,
				productPrice: productPrice,
				imageUrl: imageUrl
			}


		})

		fs.writeFile('output.json', JSON.stringify(result, null, 4), function(err){
			console.log('done');
		})


	}
})
