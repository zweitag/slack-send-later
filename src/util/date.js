const Sugar = require('sugar-date');
// eslint-disable-next-line max-len
const DURATION_REGEX = /^((\d+)\s?w(eek(s)?)?)?\s?((\d+)\s?d(ay(s)?)?)?\s?((\d+)\s?h(our(s)?)?)?\s?((\d+)(\s?m(in(ute)?(s)?)?)?)?$/;

function parseDate({ date, type, timezoneOffset }) {
  const dateOption = date.trim();

  if (type === 'date') {
    const parsedDate = Sugar.Date.create(dateOption, { setUTC: true });
    const utcSeconds = parsedDate.getTime() / 1000;

    const dateObject = new Date(0);
    dateObject.setUTCSeconds(utcSeconds - timezoneOffset);

    return dateObject;
  }

  if (type === 'duration') {
    const matches = DURATION_REGEX.exec(dateOption);
    const weeks = matches[2] ? parseInt(matches[2], 10) * 7 * 24 * 60 : 0;
    const days = matches[6] ? parseInt(matches[6], 10) * 24 * 60 : 0;
    const hours = matches[10] ? parseInt(matches[10], 10) * 60 : 0;
    const minutes = matches[14] ? parseInt(matches[14], 10) : 0;

    const durationInMinutes = weeks + days + hours + minutes;
    const parsedDate = Sugar.Date.create(`in ${durationInMinutes} minutes`, { setUTC: true });

    return parsedDate;
  }

  throw new TypeError('The argument `type` must be either \'duration\' or \'date\'');
}

function formatDate({ date, timezone }) {
  const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return dateTimeFormat.format(date);
}

module.exports = {
  parseDate,
  formatDate,
};
