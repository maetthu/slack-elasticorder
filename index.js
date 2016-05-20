
/* setup slack connection */
var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var token = process.env.SLACK_API_TOKEN || '';
var rtm = new RtmClient(token, {
    logLevel: 'error',
    dataStore: new MemoryDataStore(),
    autoReconnect: true,
    autoMark: false
});
var web = new WebClient(token);

rtm.start();

/* setup elasticsearch connection */
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_HOST,
});

client.ping().then(
    function(){
        console.error("[Elasticsearch] I'm here!");
    },
    function(error){
        console.error('[Elasticsearch] Could not contact server, error was:');
        console.log(error);
        console.error('... exiting');
        process.exit(1);
    }
);

/* slack events */
rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    var channel = rtm.dataStore.getChannelGroupOrDMById(message.channel);
    var user = rtm.dataStore.getUserById(message.user);

    if (!user) {
        user = {};
    }

    // console.log('[Slack] Received message');

    client.create({
        index: 'slack',
        type: 'message',
        body: {
            user: user,
            channel: channel,
            message: message,
        }
    }).then(
        function(body){
            // nothing to do
        },
        function(error){
            console.error('[Elasticsearch] could not record message, error was:');
            console.log(error);
        }
    );
});

/* monitor online presence, setting user to away if this is the only client left */
var presenceMonitor;

function checkPresence(){
    web.users.getPresence().then(
        function(user){
            if(user.presence != 'away'){
                if(user.connection_count == 1){
                    web.users.setPresence('away').then(
                        function(){
                            console.log("[Slack] I'm all alone now. Setting presence to away.");
                            presenceMonitor && clearInterval(presenceMonitor);
                        },
                        function(error){
                            console.log(error);
                        }
                    );
                } else if (!presenceMonitor) {
                    console.log("[Slack] I'm online but not alone, start monitoring");

                    presenceMonitor = setInterval(function(){
                        checkPresence();
                    }, 30000);
                }
            }
        }
    );
}

rtm.on(RTM_EVENTS.PRESENCE_CHANGE, function(presence){
    if(presence.user == rtm.activeUserId){
        if(presence.presence == 'active'){
            checkPresence();
        }
    }
})

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function(){
    var user = rtm.dataStore.getUserById(rtm.activeUserId);
    var team = rtm.dataStore.getTeamById(rtm.activeTeamId);

    console.log('[Slack] Connected to ' + team.name + ' as ' + user.name);
    console.log('[Slack] Ready when you are...');
});

rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, function(){
    console.log('[Slack] Could not reconnect to Slack, exiting');
    process.exit(1);
})

rtm.on(CLIENT_EVENTS.RTM.ATTEMPTING_RECONNECT, function(){
    console.log('[Slack] Connection to Slack lost, reconnecting...');
})
