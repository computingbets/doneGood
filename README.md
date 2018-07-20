# doneGood
This repo is a javascript webscraping project using node.js.
The required modules are:
- [fs](https://nodejs.org/docs/v0.3.1/api/fs.html), a node library used to write the scraped
data to into a file. In this scraper, fs writes to a seperate file.
- [cheerio](https://www.npmjs.com/package/cheerio), a fun little library that functions
like jQuery for webscraping. Has most functionality.
- [bluebird](http://bluebirdjs.com/docs/features.html) used to make synchronous Promises
- [request-promise](https://www.npmjs.com/package/request-promise) works with bluebird.js,
main feature for "rp" are its options and .then features (more on that below).

## Rundown
The `urls` variable gets loaded with the page urls of product listings. Bluebird's
Promise then `maps` the pages and runs `cheerio` to give it jQuery-like selector
functionality. The `forEach` method runs a cheerio selector to find a product page's
`a tag` for each product and essentially allows for cheerio to get into each
single product URL. This is seen on line 43 where the Promise uses `cheerio.load`
to turn the product page into a scrapable data set.
`responses.forEach` is where the product page gets accessed and the particular
product features and variables can get selected, such as `price`, `title`, etc.
`productUrl = response[0]; $ = response[1];` in this section means the variables
from the first cheerio selection are being passed down to the `results` array. $
is the cheerio variable. After tinkering around with getting the right selections
for product features, the vars get loaded into the results array and results gets
`JSON.stringify` to write a new file with JSON data and all the selections!

There are also comments as a walkthrough in the js files.
***
Happy scraping! Do Good!
