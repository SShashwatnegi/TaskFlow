const chrono = require('chrono-node');

const texts = [
  "Meeting tomorrow at 6pm",
  "Pay bills by Friday 5pm",
  "Call Mom in 2 hours",
  "Dinner with John next week on Tuesday at 7:30 PM"
];

console.log("--- NLP Parsing Test ---");
texts.forEach(t => {
  const result = chrono.parse(t);
  const date = result.length > 0 ? result[0].start.date() : "Failed to parse";
  console.log(`Text: "${t}"`);
  console.log(`Parsed Date: ${date}\n`);
});
