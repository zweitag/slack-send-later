const Sugar = require('sugar-date');

function parseDate({ date, type, timezoneOffset }) {
  if (type === 'date') {
    const parsedDate = Sugar.Date.create(date, { setUTC: true });
    const utcSeconds = parsedDate.getTime() / 1000;

    const dateObject = new Date(0);
    dateObject.setUTCSeconds(utcSeconds - timezoneOffset);

    return dateObject;
  }

  if (type === 'duration') {
    const matches = /^((\d+)w)?((\d+)d)?((\d+)h)?((\d+)m?)?$/.exec(date);
    const weeks = matches[2] ? parseInt(matches[2], 10) * 7 * 24 * 60 : 0;
    const days = matches[4] ? parseInt(matches[4], 10) * 24 * 60 : 0;
    const hours = matches[6] ? parseInt(matches[6], 10) * 60 : 0;
    const minutes = matches[8] ? parseInt(matches[8], 10) : 0;

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
