const { App, ExpressReceiver } = require('@slack/bolt');
// eslint-disable-next-line import/no-extraneous-dependencies
const { WebClient } = require('@slack/web-api');
const Sugar = require('sugar-date');

try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  require('dotenv').config();
} catch (err) {
  // do nothing
}

const installations = [];
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

async function fetchUserInstallation({ teamId, userId }) {
  return installations.find(
    (installation) => installation.team.id === teamId && installation.user.id === userId,
  );
}

async function fetchInstallation({ teamId, userId }) {
  if (userId) {
    const userInstallation = await fetchUserInstallation({ teamId, userId });
    if (userInstallation) {
      return userInstallation;
    }
  }

  const teamInstallation = installations.find((installation) => installation.team.id === teamId);
  return teamInstallation;
}

async function fetchUserToken({ teamId, userId }) {
  const userInstallation = installations.find(
    (installation) => installation.team.id === teamId && installation.user.id === userId,
  );

  return userInstallation ? userInstallation.user.token : '';
}

async function storeInstallation(installation) {
  installations.push(installation);
}

async function addUserContext({ payload, client, context, next }) {
  const { user } = await client.users.info({
    user: payload.user_id,
    include_locale: true,
  });

  context.user = {
    id: user.id,
    timezone: user.tz,
    timezoneOffset: user.tz_offset,
  };

  await next();
}

function parseDate({ date, type, timezoneOffset }) {
  if (type === 'date') {
    const parsedDate = Sugar.Date.create(date, { setUTC: true });
    const utcSeconds = parsedDate.getTime() / 1000;

    const dateObject = new Date(0);
    dateObject.setUTCSeconds(utcSeconds + timezoneOffset);

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

async function listScheduledMessages({ command, client, context, respond }) {
  const channelId = command.channel_id;
  const { user: { id: userId, token: userToken }, team: { id: teamId } } = context;
  // eslint-disable-next-line max-len
  const { scheduled_messages: scheduledMessages } = await client.chat.scheduledMessages.list({
    channel: channelId,
    token: userToken,
  });

  if (scheduledMessages.length === 0) {
    await respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_*Currently, you have no scheduled messages in this chat.*_',
          },
        },
      ],
    });

    return;
  }

  const messageBlocks = scheduledMessages.flatMap((message) => {
    const postAt = new Date(0);
    postAt.setUTCSeconds(message.post_at);

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*_Message 1_*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Text:*\n${message.text}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Post at:*\n${formatDate({ date: postAt, timezone: context.user.timezone })}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            style: 'danger',
            text: {
              type: 'plain_text',
              text: 'Cancel Message',
              emoji: true,
            },
            value: JSON.stringify({
              messageId: message.id,
              channelId,
              userId,
              teamId,
            }),
            action_id: 'remove-scheduled-message',
          },
        ],
      },
      { type: 'divider' },
    ];
  });

  await respond({
    response_type: 'ephemeral',
    replace_original: true,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_Here are your scheduled messages for this chat:_\n',
        },
      },
      { type: 'divider' },
      ...messageBlocks,
    ],
  });
}

async function processCommand({ command, client, context, payload, respond }) {
  if (command.text === 'list') {
    context.team = { id: payload.team_id };
    return listScheduledMessages({ command, context, client, respond });
  }

  const { channel_id: channelId } = command;

  const matches = /(.+)\s(in|at)\s(.+)$/gm.exec(command.text);
  const message = matches[1];
  const time = matches[3];

  if (typeof time === 'undefined') {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          // eslint-disable-next-line max-len
          text: ':open_mouth: Darn. No (valid) time option was given.\nThe expected format is `/later <message> (at|in) <time>`.',
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Here is the command you sent:\n\`\`\`/later ${command.text}\`\`\``,
        },
      },
    ];

    if (respond) return respond({ response_type: 'ephemeral', replace_original: true, blocks });
    return client.chat.postEphemeral({ channel: channelId, blocks });
  }

  let date;
  try {
    date = parseDate({
      date: time,
      type: matches[2] === 'in' ? 'duration' : 'date',
      timezoneOffset: context.user.timezoneOffset,
    });
  } catch (error) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:open_mouth: Darn. Time option *${time}* is invalid. Please try again.`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Here is the command you sent:\n\`\`\`/later ${command.text}\`\`\``,
        },
      },
    ];

    if (respond) return respond({ response_type: 'ephemeral', replace_original: true, blocks });
    return client.chat.postEphemeral({ channel: channelId, blocks });
  }

  const { scheduled_message_id: scheduledMessageId } = await client.chat.scheduleMessage({
    channel: command.channel_id,
    text: message,
    post_at: date.getTime() / 1000,
    as_user: true,
    token: context.user.token,
  });

  const formattedDate = formatDate({ date, timezone: context.user.timezone });
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*_Your message has been scheduled successfully:_*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Text:*\n${message}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Post at:*\n${formattedDate}`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          style: 'danger',
          text: {
            type: 'plain_text',
            text: 'Cancel Message',
            emoji: true,
          },
          value: JSON.stringify({
            messageId: scheduledMessageId,
            channelId: command.channel_id,
            userId: payload.user_id,
            teamId: payload.team_id,
          }),
          action_id: 'remove-scheduled-message',
        },
      ],
    },
  ];

  if (respond) return respond({ response_type: 'ephemeral', replace_original: true, blocks });
  return client.chat.postEphemeral({ channel: channelId, blocks });
}

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
      success: async (installation, installOptions, _request, response) => {
        response.end('successful');

        const {
          team: { id: teamId },
          user: { id: userId, token: userToken },
        } = installation;
        const { metadata } = installOptions;

        const userInstallation = await fetchUserInstallation({ teamId, userId });
        const client = new WebClient(userToken);

        if (!userInstallation) {
          const blocks = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Successfully authorized! :white_check_mark:',
              },
            },
          ];

          if (metadata.channelId) {
            client.chat.postEphemeral({
              channel: metadata.channelId,
              blocks,
            });
          } else {
            client.chat.postMessage({
              channel: userId,
              blocks,
            });
          }
        }

        const { user } = await client.users.info({
          user: userInstallation.user.id,
          include_locale: true,
        });

        const context = {
          user: {
            id: userId,
            token: userToken,
            timezone: user.tz,
            timezoneOffset: user.tz_offset,
          },
        };

        if (metadata && metadata.command && metadata.channelId) {
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
          });
        }
      },
      failure: async (_error, installOptions, _request, response) => {
        response.end('failure');

        const { teamId, metadata: { command, channelId } } = installOptions;
        const installation = await fetchInstallation({ teamId });

        if (!installation || !channelId) {
          return;
        }

        const client = new WebClient(installation.bot.token);
        client.chat.postEphemeral({
          channel: channelId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':pensive: Darn. Authorization failed.',
              },
            },
          ],
        });

        if (command) {
          client.chat.postEphemeral({
            channel: channelId,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Your last issued command was:\n\`\`\`/later ${command}\`\`\``,
                },
              },
            ],
          });
        }
      },
    },
  },
  installationStore: {
    storeInstallation,
    fetchInstallation,
    storeOrgInstallation: storeInstallation,
    fetchOrgInstallation: fetchInstallation,
  },
});

const app = new App({ receiver });

async function notAuthorizedMessage({ respond, metadata }) {
  const authorizationUrl = await receiver.installer.generateInstallUrl({
    metadata,
    scopes: INSTALLATION_OPTIONS.scopes,
    userScopes: INSTALLATION_OPTIONS.userScopes,
  });

  await respond({
    response_type: 'ephemeral',
    replace_original: true,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*_Send Later_ needs to be authorized*
This app needs to be authorized to be able to send messages on your behalf at a later point in time.
Click the button below to authorize _Send Later_.`,
        },
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            style: 'primary',
            url: authorizationUrl,
            text: {
              type: 'plain_text',
              text: 'Authorize',
              emoji: true,
            },
            action_id: 'oauth',
          },
        ],
      },
    ],
  });
}

app.command('/later', addUserContext, async ({ ack, command, client, context, payload, respond }) => {
  await ack();

  const userToken = await fetchUserToken({ teamId: payload.team_id, userId: payload.user_id });

  // if the token is a bot token, the user has not yet authorized the app
  if (!userToken) {
    return notAuthorizedMessage({
      respond,
      metadata: {
        command: command.text,
        channelId: command.channel_id,
      },
    });
  }

  context.user.token = userToken;
  return processCommand({ command, client, context, payload, respond });
});

app.action('remove-scheduled-message', async ({ ack, client, action, respond }) => {
  await ack();

  const { messageId, channelId, userId, teamId } = JSON.parse(action.value);
  const userToken = await fetchUserToken({ teamId, userId });

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
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Your scheduled message was cancelled successfully!_ :white_check_mark:',
          },
        },
      ],
    });
  } catch (error) {
    if (error.code === 'invalid_scheduled_message_id') {
      return respond({
        response_type: 'ephemeral',
        replace_original: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              // eslint-disable-next-line max-len
              text: ':no_entry_sign: You cannot delete a scheduled message, which has already been posted or will be posted within the next 60 seconds.',
            },
          },
        ],
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

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  // eslint-disable-next-line no-console
  console.log('⚡️ Bolt app is running!');
})();
