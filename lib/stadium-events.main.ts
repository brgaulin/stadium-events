// import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { DateArray, EventAttributes, createEvents } from "ics";
// import * as ical from 'node-ical'

// const client = new S3Client({});

// const stadiumName = 'Gillette';
// const triggerWords = ['Patriots', 'Revolution'];

// const url = 'https://www.gillettestadium.com/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true';

// exports.handler = async () => {
//   // var sourceCalender = await ical.parseFile('test.ics'); // Local Testing
//   var sourceCalender: ical.CalendarResponse;
//   try {
//     sourceCalender = await ical.async.fromURL(url);
//   } catch (error) {
//     console.error(error);
//     throw Error('Failed to download or parse file');
//   }

//   let events: EventAttributes[] = [];
//   for (let k in sourceCalender) {
//     if (sourceCalender.hasOwnProperty(k)) {
//       if (sourceCalender[k].type == 'VEVENT') {
//         const ev = sourceCalender[k] as ical.VEvent;
//         if (ev.start.getTime() < new Date().getTime()) {
//           continue;
//         }
//         const startArray: DateArray = [ev.start.getFullYear(), ev.start.getMonth() + 1, ev.start.getDate()];

//         const end = new Date(ev.start);
//         end.setDate(end.getDate() + 1);

//         const endArray: DateArray = [end.getFullYear(), end.getMonth() + 1, end.getDate()];

//         let triggerFound;
//         for (const word of triggerWords) {
//           if (ev.summary && ev.summary.toLowerCase().includes(word.toLowerCase()) && ev.summary.includes('vs.')) {
//             triggerFound = word;
//           }
//         }

//         events.push({
//           title: `Avoid ${stadiumName}${triggerFound ? ` - ${triggerFound}` : ''}`,
//           description: ev.summary + `@ ${ev.start.toLocaleString()}`,
//           start: startArray,
//           end: endArray,
//           alarms: [{ action: 'display', trigger: { hours: 8, before: false } }]
//         });
//       }
//     }
//   }

//   console.log(`Found ${events.length} events!`);
//   const { error, value } = createEvents(events);
//   if (error) {
//     throw error;
//   }

//   const uploadCommand = new PutObjectCommand({
//     Bucket: 'simple-gillette-calendar',
//     Key: 'events.ics',
//     Body: value,
//     ContentType: 'text/calendar'
//   });
//   try {
//     const response = await client.send(uploadCommand);
//     console.log(response);
//   } catch (err) {
//     console.error(err);
//     throw new Error('Unable to upload to S3');
//   }
// };

// // exports.handler(); // Local Testing
