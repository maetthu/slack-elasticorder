
/* setup slack connection */
var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var token = process.env.SLACK_API_TOKEN || '';
var rtm = new RtmClient(token, {
    logLevel: 'error',
    dataStore: new MemoryDataStore(),
    autoReconnect: true,
    autoMark: false
});

rtm.start();

/* setup elasticsearch connection */
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env.ELASTICSEARCH_HOST,
});

rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    var channel = rtm.dataStore.getChannelGroupOrDMById(message.channel);
    var user = rtm.dataStore.getUserById(message.user);

    if (!user) {
        user = {}
    }

    client.create({
        index: 'slack',
        type: 'message',
        body: {
            user: user,
            channel: channel,
            message: message,
        }
    });

});
