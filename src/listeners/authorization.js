/* eslint-disable import/no-extraneous-dependencies */
const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const messages = require('../text/messages');
const { installations: Installation } = require('../models');
const { processCommand } = require('./command');

async function onAuthorizationSuccess(installation, installOptions, _request, response) {
  response.end('successful');

  const {
    team: { id: teamId },
    user: { id: userId, token: userToken },
    bot: { token: botToken },
  } = installation;
  const { metadata } = installOptions;

  const client = new WebClient(botToken);
  await client.chat.postMessage({ channel: userId, blocks: messages.authorizationSuccessful });
  const { user } = await client.users.info({ user: userId, include_locale: true });

  const context = {
    user: {
      id: userId,
      token: userToken,
      timezone: user.tz,
      timezoneOffset: user.tz_offset,
    },
  };

  if (metadata && metadata.command && metadata.channelId && metadata.responseUrl) {
    processCommand({
      command: {
        text: metadata.command,
        channel_id: metadata.channelId,
      },
      client,
      context,
      payload: {
        user_id: userId,
        team_id: teamId,
      },
      respond: async (responsePayload) => {
        const payload = { ...responsePayload, replace_original: false };
        const data = await axios.post(metadata.responseUrl, payload);
        return data;
      },
    });
  }
}

async function onAuthorizationFailure(_error, installOptions, _request, response) {
  response.end('failure');
  if (!installOptions) return;

  const { teamId, metadata } = installOptions;
  if (!metadata) return;

  const { command, userId, responseUrl } = metadata;

  if (responseUrl) {
    await axios.post(responseUrl, {
      replace_original: true,
      response_type: 'ephemeral',
      blocks: messages.authorizationFailed,
    });

    if (command) {
      await axios.post(responseUrl, {
        response_type: 'ephemeral',
        blocks: messages.yourLastCommandWas({ command }),
      });
    }
    return;
  }
  const installation = await Installation.findOne({ where: { teamId } });

  if (!installation || !userId) return;

  const client = new WebClient(installation.data.bot.token);
  client.chat.postMessage({ channel: userId, blocks: messages.authorizationFailed });

  if (command) {
    client.chat.postMessage({
      channel: userId,
      blocks: messages.yourLastCommandWas({ command }),
    });
  }
}

module.exports = {
  onAuthorizationSuccess,
  onAuthorizationFailure,
};
