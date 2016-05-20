# slack-elasticorder

Simple node.js daemon dumping Slack messages to Elasticsearch, aka
"slack message archive for poor people".

To not appear as online all the time (without waiting for the auto-away idle
timeout of 30 minutes), the daemon manually sets the user to "away" when no other
client is connected for this same user. 

# Usage

```
SLACK_API_TOKEN="YOUR-TOKEN" ELASTICSEARCH_HOST="HOST:PORT" npm start
```

Check docker directory for using it with docker-compose to setup the complete
stack, there's also a ready built public docker image
[maetthu/slack-elasticorder](https://hub.docker.com/r/maetthu/slack-elasticorder/)
for the node part.

Also check the [ansible](https://www.ansible.com/) [playbook](ansible/slack-elasticorder.yml)
for a way to deploy with ansible. The API token can be supplied as

```
ansible-playbook -e SLACK_API_TOKEN=YOUR-TOKEN slack-elasticorder.yml
```

# Limitations

The messages are dumped into Elasticsearch as returned from the Slack API and
do not contain file attachments, just URL references to the files on Slack.
Attachments are not (yet) archived locally.

# License

This project is licensed under [The Unlicense](http://unlicense.org).
