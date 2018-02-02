module.exports = async function isServerOwner(req, res, next) {

  if (_.isUndefined(req.param('serverId')) && _.isUndefined(req.query.serverId)) {
    return res.badRequest('No server ID given');
  }

  if (_.isUndefined(req.session.userId)) {
    return res.forbidden('Must be logged in')
  }

  try {
    var serverId = req.param('serverId') || req.query.serverId;
    var isOwner = false;
    let server = await SdtdServer.findOne({
      id: serverId
    });
    let user = await User.findOne(req.session.userId);

    if (_.isUndefined(server)) {
      return res.notFound();
    }
    if (_.isUndefined(user)) {
      return res.forbidden();
    }


    if (server.owner === user.id) {
      sails.log.silly(`POLICY - isServerOwner - User ${user.id} is owner of the server, approving request`);
      return next();
    } else {
      sails.log.warn(`POLICY - isServerOwner - User ${user.id} tried to access a server without being owner`);
      return res.forbidden('You are not the server owner.');
    }

  } catch (error) {
    return res.serverError(error);
  }


};
