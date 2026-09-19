"use strict";

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/** Mirrors `$random[min;max]` (inclusive integers). */
function randomInt(min, max) {
  const lo = Math.ceil(Number(min));
  const hi = Math.floor(Number(max));
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

const TOPICS = [
  "Did you go out today?",
  "What did you eat today?",
  "What are you currently worried about?",
  "What game have you spent the most hours playing?",
  "What game have you spent the most hours playing?",
  "What movie can you watch over and over without ever getting tired of?",
  "What are you interested in that most people aren't?",
  "How do you judge a person?",
  "What do you think you are much better at than you actually are?",
  "Do you enjoy spicy food?",
  "Do you usually get bored most of the time?",
  "What do you think about technology?",
  "What do you think about AI?",
];

const EIGHT_BALL_ANSWERS = [
  "Yes",
  "No",
  "Yes definitely",
  "You may rely on it",
  "Without a doubt",
  "It is decidedly so",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
  "Most likely",
  "As I see it, yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Don’t count on it",
];

function randomTopic() {
  return pick(TOPICS);
}

function eightBallAnswer() {
  return pick(EIGHT_BALL_ANSWERS);
}

module.exports = { pick, randomInt, randomTopic, eightBallAnswer, TOPICS, EIGHT_BALL_ANSWERS };
