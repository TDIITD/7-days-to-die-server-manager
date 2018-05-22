var sevenDays = require('machinepack-7daystodiewebapi');
const PlaytimeEarner = require('./objects/playtimeEarner');
const DiscordTextEarner = require('./objects/discordTextEarner');
const DiscordMessageHandler = require('./objects/discordMessageHandler');

let playtimeEarnerMap = new Map();
let discordTextEarnerMap = new Map();
let discordMessageEmitter;


module.exports = function economy(sails) {


    return {
        initialize: function (cb) {

            sails.on('hook:discordbot:loaded', async function () {

                discordMessageEmitter = new DiscordMessageHandler()

                let economyEnabledServers = await SdtdConfig.find({
                    economyEnabled: true
                });

                sails.log.info(`HOOK: economy - Initializing ${economyEnabledServers.length} servers`);
                for (let config of economyEnabledServers) {

                    if (config.playtimeEarnerEnabled) {
                        await startPlaytimeEarner(config.server);
                    }

                    if (config.discordTextEarnerEnabled) {
                        await startDiscordTextEarner(config.server);
                    }
                }

                return cb();
            });
        },

        start: async function (serverId, type) {

            switch (type) {
                case 'playtimeEarner':
                    return startPlaytimeEarner(serverId);
                    break;
                case 'discordTextEarner':
                    return startDiscordTextEarner(serverId);
                    break;

                default:
                    throw new Error('Unknown updateObject type')
                    break;
            }
        },

        stop: async function (serverId, type) {
            switch (type) {
                case 'playtimeEarner':
                    return stopPlaytimeEarner(serverId);
                    break;
                case 'discordTextEarner':
                    return stopDiscordTextEarner(serverId);
                    break;
                default:
                    throw new Error('Unknown updateObject type')
                    break;
            }
        },

        getStatus: function (server, type) {
            switch (type) {
                case 'playtimeEarner':
                    return playtimeEarnerMap.has(String(server.id ? server.id : server))
                    break;
                case 'discordTextEarner':
                    return discordTextEarnerMap.has(String(server.id ? server.id : server))
                    break;

                default:
                    throw new Error('Unknown updateObject type')
                    break;
            }
        },

        reload: async function (serverId, type) {
            let config = await SdtdConfig.findOne(serverId);
            switch (type) {
                case 'playtimeEarner':
                    if (config.discordTextEarnerEnabled) {
                        await stopPlaytimeEarner(serverId);
                        return startPlaytimeEarner(serverId);
                    } else {
                        await startPlaytimeEarner(serverId);
                        return stopPlaytimeEarner(serverId);
                    }
                    break;
                case 'discordTextEarner':
                    if (config.discordTextEarnerEnabled) {
                        await stopDiscordTextEarner(serverId);
                        return startDiscordTextEarner(serverId);
                    } else {
                        await startDiscordTextEarner(serverId);
                        return stopDiscordTextEarner(serverId);
                    }
                    break;

                default:
                    throw new Error('Unknown updateObject type')
                    break;
            }
        },

    };
}


async function startPlaytimeEarner(serverId) {
    try {
        await SdtdConfig.update({ server: serverId }, { playtimeEarnerEnabled: true });

        if (getMap(serverId, 'playtimeEarner')) {
            return
        }

        const server = await SdtdServer.findOne(serverId).populate('config');
        const config = server.config[0];
        let loggingObject = await sails.hooks.sdtdlogs.getLoggingObject(server.id);
        let playtimeEarnerObject = new PlaytimeEarner(server, config, loggingObject);
        await playtimeEarnerObject.start();
        setMap(server, playtimeEarnerObject);
        return true
    } catch (error) {
        sails.log.error(`HOOK - economy - Error starting playtimeEarner ${error}`)
        return false
    }
}


async function stopPlaytimeEarner(serverId) {
    try {
        await SdtdConfig.update({ server: serverId }, { playtimeEarnerEnabled: false });

        if (!getMap(serverId, 'playtimeEarner')) {
            return
        }

        let playtimeEarnerObject = await getMap(serverId, 'playtimeEarner');
        playtimeEarnerObject.stop();
        deleteMap(serverId, playtimeEarnerObject);
    } catch (error) {
        sails.log.error(`HOOK - economy - Error stopping playtimeEarner ${error}`)
    }
}

async function startDiscordTextEarner(serverId) {
    try {
        await SdtdConfig.update({ server: serverId }, { discordTextEarnerEnabled: true });

        if (getMap(serverId, 'discordTextEarner')) {
            return
        }

        const server = await SdtdServer.findOne(serverId).populate('config');
        const config = server.config[0];
        const messageEmitter = discordMessageEmitter.getEmitter();

        let discordTextEarnerObject = new DiscordTextEarner(server, config, messageEmitter);
        await discordTextEarnerObject.start();
        setMap(server, discordTextEarnerObject);
        return true
    } catch (error) {
        sails.log.error(`HOOK - economy - Error starting discordTextEarner ${error}`)
        return false
    }
}

async function stopDiscordTextEarner(serverId) {
    try {
        await SdtdConfig.update({ server: serverId }, { discordTextEarnerEnabled: false });

        if (!getMap(serverId, 'discordTextEarner')) {
            return
        }

        let discordTextEarnerObject = await getMap(serverId, 'discordTextEarner');
        discordTextEarnerObject.stop();
        deleteMap(serverId, discordTextEarnerObject);
    } catch (error) {
        sails.log.error(`HOOK - economy - Error stopping discordTextEarner ${error}`)
    }
}


function getMap(server, type) {
    switch (type) {
        case 'playtimeEarner':
            return playtimeEarnerMap.get(String(server.id ? server.id : server))
            break;
        case 'discordTextEarner':
            return discordTextEarnerMap.get(String(server.id ? server.id : server))
            break;

        default:
            throw new Error('Unknown updateObject type')
            break;
    }
}

function setMap(server, updateObject) {
    switch (updateObject.type) {
        case 'playtimeEarner':
            return playtimeEarnerMap.set(String(server.id ? server.id : server), updateObject);
            break;
        case 'discordTextEarner':
            return discordTextEarnerMap.set(String(server.id ? server.id : server), updateObject);
            break;
        default:
            throw new Error('Must set a known type in updateObject')
            break;
    }
}

function deleteMap(server, updateObject) {
    switch (updateObject.type) {
        case 'playtimeEarner':
            return playtimeEarnerMap.delete(String(server.id ? server.id : server), updateObject);
            break;
        case 'discordTextEarner':
            return discordTextEarnerMap.delete(String(server.id ? server.id : server), updateObject);
            break;
        default:
            throw new Error('Must set a known type in updateObject')
            break;
    }
}