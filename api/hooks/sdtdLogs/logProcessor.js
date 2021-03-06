const {promisify} = require("util");
const handleLogLine = require("./handleLogLine");

module.exports = async function(job) {
  const resultLogs = [];
  // Get latest log line from Redis
  let lastLogLine = parseInt(
    await sails.helpers.redis.get(
      `sdtdserver:${job.data.server.id}:sdtdLogs:lastLogLine`
    )
  );

  // If latest log line is not found, get it from the server
  if (!lastLogLine) {
    const webUIUpdate = await sails.helpers.sdtdApi.getWebUIUpdates(SdtdServer.getAPIConfig(job.data.server));
    lastLogLine = parseInt(webUIUpdate.newlogs) + 1;
  }

  // Get new logs from the server
  const newLogs = await sails.helpers.sdtdApi.getLog(SdtdServer.getAPIConfig(job.data.server), lastLogLine, sails.config.custom.logCount);

  // Adjust latest log line based on new logs we got
  lastLogLine = lastLogLine + newLogs.entries.length;

  // Set latest log line in Redis
  await sails.helpers.redis.set(
    `sdtdserver:${job.data.server.id}:sdtdLogs:lastLogLine`,
    lastLogLine
  );

  // Parse these logs into usable data
  let index = -1;
  for (const line of newLogs.entries) {
    index++;
    if (newLogs.entries[index + 1]) {
      if (newLogs.entries[index + 1].msg.includes("handled by mod")) {
        //Message is being handled by a mod, skip to the next line with possibly mod-controlled data
        continue;
      }
    }

    let parsedLogLine = handleLogLine(line);
    if (parsedLogLine) {
      parsedLogLine.server = job.data.server;
      resultLogs.push(parsedLogLine);
    }
  }

  // Set last success date in Redis
  await sails.helpers.redis.set(
    `sdtdserver:${job.data.server.id}:sdtdLogs:lastSuccess`,
    Date.now()
  );

  return Promise.resolve({
    serverId: job.data.server.id,
    lastLogLine,
    logs: resultLogs
  });
};
