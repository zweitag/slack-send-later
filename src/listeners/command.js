const messages = require('../text/messages');
const { formatDate, parseDate } = require('../util/date');

async function notAuthorizedMessage({ receiver, installationOptions, respond, metadata }) {
  const authorizationUrl = await receiver.installer.generateInstallUrl({
    metadata,
    scopes: installationOptions.scopes,
    userScopes: installationOptions.userScopes,
  });

  await respond({
    response_type: 'ephemeral',
    replace_original: true,
    blocks: messages.errors.notAuthorized({ authorizationUrl }),
  });
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
    return respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: messages.listScheduledMessages.noMessages,
    });
  }

  const messageBlocks = scheduledMessages.sort((m1, m2) => m1.post_at - m2.post_at).flatMap((message, index) => {
    const postAt = new Date(0);
    postAt.setUTCSeconds(message.post_at);

    return [
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*_Message ${index + 1}_*`,
        },
      },
      ...messages.scheduledMessage({
        text: message.text,
        date: formatDate({ date: postAt, timezone: context.user.timezone }),
        removeActionPayload: {
          messageId: message.id,
          channelId,
          userId,
          teamId,
        },
      }),
    ];
  });

  return respond({
    response_type: 'ephemeral',
    replace_original: true,
    blocks: [
      ...messages.listScheduledMessages.listIntroduction,
      ...messageBlocks,
    ],
  });
}

async function processCommand({ command, client, context, payload, respond }) {
  if (command.text === 'list') {
    context.team = { id: payload.team_id };
    return listScheduledMessages({ command, context, client, respond });
  }

  if (command.text === 'help') {
    return respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: messages.showHelp,
    });
  }

  const { token: userToken } = context.user;

  const matches = /(.+)\s(in|at)\s(.+)$/gm.exec(command.text);
  const message = matches[1];
  const time = matches[3];

  if (typeof time === 'undefined') {
    return respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: messages.errors.noTimeOptionGiven({ command: command.text }),
    });
  }

  let date;
  try {
    date = parseDate({
      date: time,
      type: matches[2] === 'in' ? 'duration' : 'date',
      timezoneOffset: context.user.timezoneOffset,
    });
  } catch (error) {
    return respond({
      response_type: 'ephemeral',
      replace_original: true,
      blocks: messages.errors.timeOptionInvalid({ command: command.text, timeOption: time }),
    });
  }

  const { scheduled_message_id: scheduledMessageId } = await client.chat.scheduleMessage({
    channel: command.channel_id,
    text: message,
    post_at: date.getTime() / 1000,
    as_user: true,
    token: userToken,
  });

  return respond({
    response_type: 'ephemeral',
    replace_original: true,
    blocks: [
      ...messages.showMessage.introduction,
      ...messages.scheduledMessage({
        text: message,
        date: formatDate({ date, timezone: context.user.timezone }),
        removeActionPayload: {
          messageId: scheduledMessageId,
          channelId: command.channel_id,
          userId: payload.user_id,
          teamId: payload.team_id,
        },
      }),
    ],
  });
}

module.exports = {
  processCommand,
  notAuthorizedMessage,
};
