/* eslint-disable max-len */

module.exports = {
  authorizationSuccessful: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Successfully authorized! :white_check_mark:',
      },
    },
  ],

  authorizationFailed: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':pensive: Darn. Authorization failed.',
      },
    },
  ],

  yourLastCommandWas: ({ command }) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Your last issued command was:\n\`\`\`/later ${command}\`\`\``,
      },
    },
  ],

  errors: {
    notAuthorized: ({ authorizationUrl }) => [
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

    timeOptionInvalid: ({ command, timeOption }) => [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:open_mouth: Darn. Time option *${timeOption}* is invalid. Please try again.`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Here is the command you sent:\n\`\`\`/later ${command}\`\`\``,
        },
      },
    ],

    noTimeOptionGiven: ({ command }) => [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':open_mouth: Darn. No (valid) time option was given.\nThe expected format is `/later <message> (at|in) <time>`.',
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Here is the command you sent:\n\`\`\`/later ${command}\`\`\``,
        },
      },
    ],

    timeInPast: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':open_mouth: Darn, if only I could time-travel!\nYour time option is in the past.',
        },
      },
    ],

    timeTooFar: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':open_mouth: Darn, that\'s far into the future!\nYour message should be scheduled to be sent within the next 120 days.',
        },
      },
    ],

    messageTooLong: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':open_mouth: Darn, what a long message!\nYour message should not consist of more than 40,000 characters.',
        },
      },
    ],
  },

  showHelp: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Hey there :wave: I'm _Send Later_. I'm here to help you create and schedule messages in Slack.
These are the commands you can use:`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:one: Use the \`/later\` command* to schedule a message.
Type \`/later\` followed by a message which in turn has to be followed by a date.
There are two possibilities when scheduling a message:
\`/later <message text> at <date>\` and
\`/later <message text> in <time duration>\`.
You will be provided with an overview of a scheduled message an you will be given the chance to cancel it directly.
However, you cannot schedule messages to be sent in the past :clock10: and you can only schedule a message if it will be sent in the next 120 days.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:two: You can _list your scheduled messages_ for a channel by using \`/later list\`.*
You will be returned a list of all your scheduled messages for the current channel (including their messages and their scheduled time).
Also, you will be able to cancel any scheduled message in the list.
You can only delete scheduled messages that have not been sent yet or are not scheduled to be sent within the next 60 seconds.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*:three: You can list some examples with `/later examples`* if you are unsure of how to specify a date for a scheduled message.',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `:eyes: View all your scheduled messages for this channel with \`/later list\`
:question: Get help at any time with \`/later help\` (which yields this message)`,
        },
      ],
    },
  ],

  showExamples: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "Hello there! :wave: I've heard you are unsure how to schedule your message with the `/later` command. No worries, I got you covered :wink: Here are some examples:",
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'There are two ways for you to schedule messages:\n:one: Either by providing a date with the keyword `at` or :two: by providing a time (duration) with the keyword `in`.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':one: You can specify any date in a machine-readable format. But you can also try out some human-readable stuff; check this out:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "• `/later Have you read Lord of the Rings yet? :ring: at 9am tomorrow`\n• `/later Don't forget to read Lord of the Rings! at 9am 2 days from now`\n• `/later Dude, I told you to read the book at 16:00 today`\n• `/later You finally read it??! at 3 Aug 9am`\n• `/later Are you ready to rumble? at next week Thursday 9am`\n     (You can also omit the `week` literal)\n• `/later I got pie! at June 3rd, 10:00`\n• Generally, you can try nearly anything (the library) <https://sugarjs.com/dates/|Sugar> understands",
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':two: When it comes to durations, the following examples might help you:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '• `/later Do you have time for a Pair-Programming session? in 1h30`\n• `/later Can you order some pencils, please? in 1w2d1h`\n• `/later I spilled some coffe, can you help me clean up? in 30 minutes`\n• In general, the duration format can look like this:\n    • `12w3d4h30m` stands for 12 weeks, 3 days, 4 hours and 30 minutes\n       (Here, you can omit the `m` which stands for minutes)\n    • `1 week 2 hours 30` is also possible\n       (Notice that you can also use the literals `minutes`, `min` or no literal for minutes;\n       i.e., `/later What are you doing? in 30` results into the message being sent in\n       30 minutes)',
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':eyes: View all your scheduled messages for this channel with `/later list`\n:question: Get help at any time with `/later help`',
        },
      ],
    },
  ],

  listScheduledMessages: {
    noMessages: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_*Currently, you have no scheduled messages in this chat.*_',
        },
      },
    ],

    listIntroduction: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_Here are your scheduled messages for this chat:_\n',
        },
      },
    ],
  },

  showMessage: {
    introduction: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*_Your message has been scheduled successfully:_*',
        },
      },
    ],
  },

  removeScheduledMessage: {
    success: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_Your scheduled message was cancelled successfully!_ :white_check_mark:',
        },
      },
    ],

    error: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':no_entry_sign: You cannot delete a scheduled message, which has already been posted or will be posted within the next 60 seconds.',
        },
      },
    ],
  },

  scheduledMessage: ({ text, date, removeActionPayload }) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Text:*\n${text}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Post at:*\n${date}`,
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
          value: JSON.stringify(removeActionPayload),
          action_id: 'remove-scheduled-message',
        },
      ],
    },
  ],
};
