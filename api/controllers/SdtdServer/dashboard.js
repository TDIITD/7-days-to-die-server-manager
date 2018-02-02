module.exports = {

  friendlyName: 'Dashboard',

  description: 'Show the dashboard of a 7 Days to Die server',

  inputs: {
    serverId: {
      description: 'The ID of the server to look up.',
      type: 'number',
      required: true
    }
  },

  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'sdtdServer/dashboard'
    },
    notFound: {
      description: 'No server with the specified ID was found in the database.',
      responseType: 'notFound'
    }
  },

  /**
   * @memberof SdtdServer
   * @name dashboard
   * @method
   * @description Serves the dashboard for a 7 Days to die server
   */

  fn: async function (inputs, exits) {
    sails.log.debug(`VIEW - SdtdServer:dashboard - Showing dashboard for ${inputs.serverId}`);

    try {
      let sdtdServer = await SdtdServer.findOne(inputs.serverId);
      sdtdServerInfo = await sails.helpers.loadSdtdserverInfo(inputs.serverId)
        .tolerate('unauthorized', (error) => {
        });
      if (!_.isUndefined(sdtdServerInfo)) {
        sdtdServer = sdtdServerInfo;
      }
      let players = await sails.helpers.loadPlayerData(inputs.serverId)
        .tolerate('unauthorized', (error) => {

        });
      return exits.success({
        server: sdtdServer,
        players: players
      });
    } catch (error) {
      sails.log.error(`VIEW - SdtdServer:dashboard - ${error}`);
      throw 'notFound';
    }


  }
};
