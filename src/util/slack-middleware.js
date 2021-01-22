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

module.exports = {
  addUserContext,
};
