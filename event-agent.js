//Configuration variables
var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
// usage exemple : server.listen(config.server.port);

// Modules
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var icalendar = require('icalendar');


var CronJob = require('cron').CronJob;

// Schedule start function : https://www.npmjs.com/package/cron
var job = new CronJob('11 00 00 * * 1-7', function () {
        /*TODO
         * Scrapping execution to be done here
         */
    }, function () {
        console.log('Scrapping done');
    },
    true, /* Start the job right now */
    'Europe/Paris' /* Time zone of this job. */
);


app.get('/', function (req, res) {

    var events = [];
    parse_asso(events, function (events) {
        // parse_utc(events, function(events) {
        // res.json(events);
        // });
        events.forEach(function (obj) {
            // Parameters for the API
            var name = 'name=' + obj.name;
            var description = 'desc=' + (obj.description || 'no description');
            var start = 'start=' + '0';
            var end = 'end=' + '0';
            var apiUrl = config.server.host + ':' + config.server.port + '/api/events?' + name + '&' + start + '&' + end + '&' + description;
            apiUrl = encodeURI(apiUrl);

            // Print API call for debug purposes
            console.log('API call: ' + apiUrl);

            // Use server API to update database
            request.post(apiUrl).form({key:'value'});
        });

        res.send();
    });

});

app.get('/asso', function (req, res) {

    res.set('Content-Type', 'application/json');

    var asso_list = [];
    var event = [];
    list_asso(asso_list, function (asso_list) {
        parse_asso2(event, asso_list, function (event) {
            /* TODO
             Problème ici, les events ne remonte pas jusqu'ici, la fonction res.json est exécutée plusieurs fois.
             */
            console.log(event[1]);
            res.json(event);
        });

    });
})

app.listen('8081')
exports = module.exports = app;


function parse_asso(events, callback) {
    var url = 'http://assos.utc.fr';

    request.get(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var events_html = $('#calendrier .carousel-inner .event');

            events_html.each(function (i, element) {
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

    request.get(url, function (error, response, data) {
        if (!error) {
            var ical = icalendar.parse_calendar(data);

            ical.events().forEach(function (element, index) {
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

// list all the asso_login
function list_asso(asso_list, callback) {
    var url = 'https://assos.utc.fr/asso/json';

    request.get(url, function (error, response, data) {
        if (!error) {
            var obj = JSON.parse(data);
            for (var i = 0; i < obj.length; ++i) {
                asso_list.push(obj[i].login);
            }
            callback(asso_list);
        }
    });
}

// Get all the asso event
function parse_asso2(event, asso_list, callback) {

    var url = 'https://assos.utc.fr/asso/events/';

    for (var i = 0; i < asso_list.length; i++) {
        var url_asso = url + asso_list[i] + '/json';
        request.get(url_asso, function (error, response, data) {
            if (!error) {
                try {
                    var obj = JSON.parse(data);
                    for (var j = 0; j < obj.length; ++j) {
                        event.push(obj[j]);
                    }
                    callback(event);
                }
                catch (err) {
                    //Not jSON
                }
            }
        });
    }
}