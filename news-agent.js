var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var icalendar = require('icalendar');

app.get('/', function(req, res) {
	var news = [];
	console.log('hello world!');
	parse_utc(news, function (argument) {
		 res.json(argument);
	});
});

app.listen('8081')
exports = module.exports = app;



function parse_utc (news, callback) {
	var url = 'http://actualites.utc.fr/feed/';

	request.get(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html, { xmlMode: true});

            var news_xml = $('item');

            news_xml.each(function(i, element) {
                var n = {};
                n.title = $(this).find('title').text();
                n.url = $(this).find('link').text();
                n.description = $(this).find('description').text();
                n.pubDate = $(this).find('pubDate').text();

                news.push(n);
            });
            callback(news);
        }
    });
}