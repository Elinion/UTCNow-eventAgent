var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var icalendar = require('icalendar');

app.get('/', function(req, res) {

    var events = [];
    parse_asso(events, function(events) {
        parse_utc(events, function(events) {
            res.json(events);
        });
    });

});

app.listen('8081')
exports = module.exports = app;


function parse_asso(events, callback) {
    var url = 'http://assos.utc.fr';

    request.get(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var events_html = $('#calendrier .carousel-inner .event');

            events_html.each(function(i, element) {
                var e = {};
                e.name = $(this).find('.media-heading a').text();
                e.description = $(this).find('p').first().text();
                e.img = url + $(this).find('img').attr('src');

                var asso_date = $(this).find('p').last().text().trim().split('\n');
                e.host = asso_date[0].trim().substring(4);
                e.startDate = asso_date[1].trim();

                events.push(e);
            });
            callback(events);
        }
    });
}


function parse_utc(events, callback) {
    var url = 'http://actualites.utc.fr/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true';

    request.get(url, function(error, response, data) {
        if (!error) {
            var ical = icalendar.parse_calendar(data);

            ical.events().forEach(function(element, index) {
                var e = {};
                e.name = element.getPropertyValue('SUMMARY');
                e.description = element.getPropertyValue('DESCRIPTION');
                e.startDate = element.getPropertyValue('DTSTART');
                e.endDate = element.getPropertyValue('DTEND');
                e.location = element.getPropertyValue('LOCATION');
                e.url = element.getPropertyValue('URL');

                console.log(element);
                events.push(e);
            });

            callback(events);
        }
    });
}