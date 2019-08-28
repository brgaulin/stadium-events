const AWS = require('aws-sdk'); // Local Testing
const s3 = new AWS.S3(); // Local Testing
const ics = require('ics')
const ical = require('ical');

const stadiumName = 'Gillette';
const triggerWords = ['Patriots', 'Revolution'];

const url = 'https://www.gillettestadium.com/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true';

exports.handler =  function(event, context, callback) {
    // var data = ical.parseFile(path); // Local Testing 
    ical.fromURL(url, { rejectUnauthorized: false }, function (error, data) {
        if(error) {
            return callback(Error(error));
        }
        let events = [];
        for (let k in data) {
            if (data.hasOwnProperty(k)) {
                var ev = data[k];
                if (data[k].type == 'VEVENT') {
                    if(ev.start.getTime() < new Date().getTime()) {
                        continue;
                    }
                    const startArray = [ev.start.getFullYear(), ev.start.getMonth() + 1, ev.start.getDate()];

                    const end = ev.start;
                    end.setDate(end.getDate() + 1);

                    const endArray = [end.getFullYear(), end.getMonth() + 1, end.getDate()];

                    let triggerFound;
                    for(const word of triggerWords) {
                        if(ev.summary.toLowerCase().includes(word.toLowerCase()) && ev.summary.includes('vs.')) {
                            triggerFound = word;
                        }
                    }

                    events.push({
                        title: `Avoid ${stadiumName}${triggerFound ? ` - ${triggerFound}` : ''}`,
                        description: ev.summary,
                        start: startArray,
                        end: endArray,
                        alarms: [{ action: 'display', trigger: { hours:8, after: true } }]
                    });
                }
            }
        }
        console.log(`Found ${events.length} events!`);
        ics.createEvents(events, (error, value) => {
            if (error) {
                return callback(Error(error));
            }

            s3.putObject({
                Bucket: 'simple-gillette-calendar',
                Key: 'events.ics',
                Body: value,
                ContentType: 'text/calendar'
            }, function(error) {
                if (error) {
                    return callback(Error(error));
                }
                callback();
            });
            // console.log(value) // Local Testing
        });
    }); // Local Testing
};

// exports.handler(null, null, console.log); // Local Testing