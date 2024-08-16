import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DateArray, EventAttributes, createEvents } from 'ics';
import { JSDOM } from 'jsdom';
import * as https from 'node:https'

const client = new S3Client({});

const stadiumName = 'Gillette';
const triggerWords = ['Patriots', 'Revolution'];

const url = 'https://www.gillettestadium.com/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true';
const dayRegex = /(\d+)/

exports.handler = async () => {
  const today = new Date();
  let currentMonth = today.getMonth(); // Zero indexed
  let year = today.getFullYear();
  let events: EventAttributes[] = [];
  for(let month of [currentMonth, currentMonth + 1]) {
    // Loop at end of year
    if (month == 12) {
      month = 0;
      year++;
    }

    const data = await getRequest(
      `https://www.gillettestadium.com/?method=mec-print&mec-year=${year}&mec-month=${month + 1}`,
      {
        "headers": {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Alt-Used": "www.gillettestadium.com",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Priority": "u=0, i",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
        }
      }
    )

    // For local testing
    // const fs = require('node:fs');
    // const data = fs.readFileSync('test/test_month.html', 'utf8');
    // console.log(data)
    const parsedHtml = new JSDOM(data);

    const document = parsedHtml.window.document;
    const agendaItems = document.querySelectorAll(".mec-events-agenda");

    for(const item of agendaItems) {
      try {
        const dateNode = item.querySelector('.mec-agenda-date');
        const startTimeNode = item.querySelector('.mec-start-time');
        const eventTitleNode = item.querySelector('.mec-agenda-event-title');

        if (!dateNode || !dateNode.textContent) {
          throw new Error('Unable to find date in html')
        }
        if (!startTimeNode || !startTimeNode.textContent) {
          throw new Error('Unable to find start time in html')
        }
        if (!eventTitleNode || !eventTitleNode.textContent) {
          throw new Error('Unable to find event title in html')
        }
        const dayMatches = dayRegex.exec(dateNode.textContent.trim())
        if (!dayMatches) {
          throw new Error(`Unable to parse day out of html: ${dateNode.textContent}`)
        }

        const eventStartDate = new Date(`${year}-${month + 1}-${dayMatches[1]} ${startTimeNode.textContent.trim()}`);
        const eventEndOfDay = new Date(eventStartDate);
        eventEndOfDay.setDate(eventEndOfDay.getDate() + 1);
        const eventTitle = eventTitleNode.textContent.trim()

        const startArray: DateArray = [eventStartDate.getFullYear(), eventStartDate.getMonth() + 1, eventStartDate.getDate()];
        const endArray: DateArray = [eventEndOfDay.getFullYear(), eventEndOfDay.getMonth() + 1, eventEndOfDay.getDate()];

        let triggerFound;
        for (const word of triggerWords) {
          if (eventTitle.toLowerCase().includes(word.toLowerCase()) && eventTitle.toLowerCase().includes('vs.')) {
            triggerFound = word;
          }
        }
        events.push({
          title: `Avoid ${stadiumName}${triggerFound ? ` - ${triggerFound}` : ''}`,
          description: `Event: ${eventTitle}\nStart Time: ${eventStartDate.toLocaleString()}`,
          start: startArray,
          end: endArray,
          alarms: [{ action: 'display', trigger: { hours: 8, before: false } }]
        });
      } catch(err) {
        console.error('Unable to parse event', item, err)
      }
    }
  }

  console.log(`Found ${events.length} events!`);
  // console.log(events)
  const { error, value } = createEvents(events);
  if (error) {
    throw error;
  }

  const uploadCommand = new PutObjectCommand({
    Bucket: 'simple-gillette-calendar',
    Key: 'events.ics',
    Body: value,
    ContentType: 'text/calendar'
  });
  try {
    const response = await client.send(uploadCommand);
    console.log(response);
  } catch (err) {
    console.error(err);
    throw new Error('Unable to upload to S3');
  }
};

function getRequest(url: string, options: any) {
  return new Promise<string>((resolve, reject) => {
    const req = https.get(url, options, res => {
      let rawData = '';

      res.on('data', chunk => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(rawData);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });
  });
}

// exports.handler(); // Local Testing
