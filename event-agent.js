var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var url = 'http://assos.utc.fr';

app.get('/', function(req, res){

  var events = [];

  request.get(url, function(error, response, html) {
  	if (!error) {
  		var $ = cheerio.load(html);

  		var events_html = $('#calendrier .carousel-inner .event');

  		events_html.each( function(i, element) {
  			var e = {};
  			e.name = $(this).find('.media-heading a').text();
			e.description = $(this).find('p').first().text();
			e.img = url + $(this).find('img').attr('src');

  			var asso_date = $(this).find('p').last().text().trim().split('\n');
  			e.host = asso_date[0].trim().substring(4);
  			e.date = asso_date[1].trim();

  			events.push(e);
  		});
  		res.json(events);
  	}
  });
});

app.listen('8081')
exports = module.exports = app;