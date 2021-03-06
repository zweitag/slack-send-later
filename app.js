const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const { Op } = require('sequelize');

// eslint-disable-next-line import/newline-after-import
const db = require('./src/models');
db.sequelize.sync();
const Installation = db.installations;

const messages = require('./src/text/messages');
const { addUserContext } = require('./src/util/slack-middleware');
const { notAuthorizedMessage, processCommand } = require('./src/listeners/command');
const { onAuthorizationSuccess, onAuthorizationFailure } = require('./src/listeners/authorization');

const INSTALLATION_OPTIONS = {
  scopes: [
    'chat:write',
    'commands',
    'users:read',
    'channels:read',
  ],
  userScopes: [
    'chat:write',
    'channels:read',
    'groups:read',
    'im:read',
    'mpim:read',
  ],
};

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.STATE_SECRET,
  scopes: INSTALLATION_OPTIONS.scopes,
  installerOptions: {
    authVersion: 'v2',
    installPath: '/slack/install',
    userScopes: INSTALLATION_OPTIONS.userScopes,
    callbackOptions: {
      success: onAuthorizationSuccess,
      failure: onAuthorizationFailure,
    },
  },
  installationStore: {
    storeInstallation: async (installationData) => {
      await Installation.create({
        teamId: installationData.team.id,
        userId: installationData.user.id,
        data: installationData,
      });

      return installationData;
    },
    fetchInstallation: async ({ teamId, userId }) => {
      if (userId) {
        const userInstallation = await Installation.findOne({ where: { teamId, userId } });
        if (userInstallation) {
          return userInstallation.data;
        }
      }

      const teamInstallation = await Installation.findOne({ where: { teamId } });
      return teamInstallation.data;
    },
  },
});

receiver.app.use(express.static(`${__dirname}/public`));
receiver.app.set('view engine', 'ejs');
receiver.app.set('views', `${__dirname}/src/views`);

receiver.app.get('/authorization/success', (req, res) => {
  const { team_id: teamId, app_id: appId } = req.query;
  const slackUrl = teamId && appId ? `slack://app?team=${teamId}&id=${appId}&tab=home` : 'slack://open';

  res.render('authorization/success', { slackUrl });
});

receiver.app.get('/authorization/failure', (req, res) => {
  res.render('authorization/failure');
});

receiver.app.get('/.well-known/health-check', (req, res) => {
  res.end('ok');
});

const app = new App({ receiver });

app.command('/later', addUserContext, async ({ ack, body, command, client, context, payload, respond }) => {
  await ack();

  const installation = await Installation.findOne({ where: { teamId: payload.team_id, userId: payload.user_id } });
  // if the token is a bot token, the user has not yet authorized the app
  if (!installation) {
    return notAuthorizedMessage({
      receiver,
      installationOptions: INSTALLATION_OPTIONS,
      respond,
      metadata: {
        command: command.text,
        channelId: command.channel_id,
        userId: payload.user_id,
        responseUrl: body.response_url,
      },
    });
  }

  context.user.token = installation.data.user.token;
  return processCommand({ command, client, context, payload, respond });
});

app.action('remove-scheduled-message', async ({ ack, client, action, respond }) => {
  await ack();

  const { messageId, channelId, userId, teamId } = JSON.parse(action.value);
  const { data: { user: { token: userToken } } } = await Installation.findOne({ where: { teamId, userId } });

  try {
    await client.chat.deleteScheduledMessage({
      channel: channelId,
      scheduled_message_id: messageId,
      as_user: true,
      token: userToken,
    });

    return respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: messages.removeScheduledMessage.success,
    });
  } catch (error) {
    if (error.code === 'slack_webapi_platform_error' && error.data.error === 'invalid_scheduled_message_id') {
      return respond({
        response_type: 'ephemeral',
        replace_original: true,
        blocks: messages.removeScheduledMessage.error,
      });
    }

    throw error;
  }
});

app.action('oauth', async ({ ack }) => { await ack(); });

app.error((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});

app.event('app_home_opened', async ({ event, client, body }) => {
  const installation = Installation.findOne({ where: { teamId: body.team_id, userId: event.user } });
  let messageBlocks;
  if (installation) {
    messageBlocks = messages.showHelp;
  } else {
    const authorizationUrl = await receiver.installer.generateInstallUrl({
      scopes: INSTALLATION_OPTIONS.scopes,
      userScopes: INSTALLATION_OPTIONS.userScopes,
    });
    messageBlocks = messages.errors.notAuthorized({ authorizationUrl });
  }

  await client.views.publish({
    user_id: event.user,
    view: {
      type: 'home',
      blocks: messageBlocks,
    },
  });
});

app.event('tokens_revoked', async ({ event, body }) => {
  const teamId = body.team_id;
  const userIds = event.tokens.oauth;
  if (!userIds || userIds.length === 0) return;

  await Installation.destroy({ where: { teamId, userId: { [Op.in]: userIds } } });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  // eslint-disable-next-line no-console
  console.log('⚡️ Bolt app is running!');
})();
