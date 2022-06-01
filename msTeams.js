const { IncomingWebhook } = require('ms-teams-webhook');

// Read a url from the environment variables
const url = process.env.MS_TEAMS_WEBHOOK_URL || 'https://doxahi.webhook.office.com/webhookb2/8e4d5b35-bbce-4626-ab93-54a2f6a18f5a@7e62cb42-2f83-4a2c-b061-b40fcf5e97b0/IncomingWebhook/7e7304cd0dfe49159e8c83d89260b697/42a98973-eea5-4345-9355-014be2e083e7';

// Initialize
const webhook = new IncomingWebhook(url);


const publishMessage = async (message) => {
    await webhook.send(JSON.stringify({
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        "summary": "A message is fail to process, retry count = " + message?.retried_count,
        "themeColor": "0078D7",
        "title": `Messageq queue: "${message?.original_queue_name}"`,
        "sections": [
            {
                "activityTitle": `Requester Name: "${message?.requesterName || "Unknown"}"`,
                "activitySubtitle": new Date(),
            },
            {
                "activityTitle": `Request Payload`,
                "activitySubtitle": `Retried Count: ${message.retried_count}`,
                "text": message.payload
            }
        ]
    }))
}

module.exports = {
    publishMessage
}