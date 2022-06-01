const sendgrid = require("./sendgrid");
const ses = require("./ses");
const authService = require("./authservice");
const pug = require('pug');
const amqpm = require('amqp-connection-manager')
const parkingLotQueueService = require('./services/ParkingLotQueueService');
const emailHistoryService = require('./services/email-history-service');
const CONFIG = require("./config/index");
require("dotenv").config();

//defining the html template
const compiledTemplateMap = {
    default: pug.compileFile('./views/notification.pug'),
    notification: pug.compileFile('./views/notification.pug'),
    defaultNoFooter: pug.compileFile('./views/htmlTemplateNoFooter.pug')
};
const compiledFunction = pug.compileFile('./views/notification.pug');

/**
 * @api {amqp} rabbitmq Send email using RabbitMQ queue
 * @apiGroup Email Service
 * @apiVersion 0.0.1
 *
 * @apiParam {List} to List of email address
 * @apiParam {List} cc List of email address
 * @apiParam {List} bcc List of email address
 * @apiParam {String} subject Email subject
 * @apiParam {String} title Email title
 * @apiParam {String} message Email message content
 * @apiParam {List} attachments Details needed in "attachement file" is shown in the example
 *
 * @apiParamExample {json String} Request-Example:
 *       {
 *           "body":{
 *               "to":["email1", "email2"],
 *               "cc":["email3", "email4"],
 *               "bcc":["email5", "email6"],
 *               "subject":"Email subject",
 *               "title":"Email title",
 *               "message":"Email message"
 *           },
 *           "attachments":[
 *               {
 *                   "content":"The Base64 encoded content of the attachment.",
 *                   "filename":"filename of the attachement",
 *                   "type":"application/pdf"
 *               }
 *           ]
 *       }
 *
 * @apiDescription Sending email from work sent from rabbitmq.
 *
 * @param {Next} next
 */
// amqp.connect(`amqp://${Config.MQ_SERVER}`, function(error, connection) {

const connection = amqpm.connect({
    protocol: CONFIG.RABBIT_PROTOCOL,
    hostname: CONFIG.RABBIT_HOSTNAME,
    port: CONFIG.RABBIT_PORT,
    vhost: CONFIG.VHOST,
    username: CONFIG.RABBIT_USERNAME,
    password: CONFIG.RABBIT_PASSWORD
})

const channelWrapper = connection.createChannel({
    json: true,
    setup: function (channel) {
        return Promise.all([
            channel.assertQueue(CONFIG.QUEUE_NAME, {durable: true}),
            channel.prefetch(1),
            channel.consume(CONFIG.QUEUE_NAME, handleEmail)
        ])
    }
})

const channelWrapperParkingLotQueue = connection.createChannel({
    json: true,
    setup: function (channel) {
        return Promise.all([
            channel.assertQueue(CONFIG.PARKING_LOT_QUEUE_NAME, {durable: true}),
            channel.prefetch(1),
            channel.consume(CONFIG.PARKING_LOT_QUEUE_NAME, handleParkingLotQueue)
        ])
    }
})

const pendingAttachmentEmailChannelWrapper = connection.createChannel({
    json: true,
    setup: function (channel) {
        return Promise.all([
            channel.assertQueue(CONFIG.PENDING_ATTACHMENT_QUEUE_NAME, {durable: true}),
            channel.prefetch(1),
            channel.consume(CONFIG.PENDING_ATTACHMENT_QUEUE_NAME, handlePendingAttachmentEmail)
        ])
    }
})


const handleEmail = async (msg) => {
    let req = JSON.parse(msg.content).body
    console.log(" [x] Received: " + req.subject);
    if (req.type && req.type == 'uuid') {
        try {
            await authService(req)
        } catch (err) {
            console.log("Cannot parse Email from UUID")
            console.log("Cancel send Email by UUID!");
            return;
        }
    }
    let compiledTemplate = compiledTemplateMap[req.templateName] || compiledFunction;
    let attachments = JSON.parse(msg.content).attachments
    if (req.pendingAttachment) {
        req.status = 'PENDING_ATTACHMENT';
        emailHistoryService.saveEmail(req, attachments);
    } else {
        ses(compiledTemplate, attachments, req).then(message => {
            console.log(" [x] Sent: " + msg.content)
            req.status = 'SENT';
            emailHistoryService.saveEmail(req, attachments);
        }).catch(err => {
            console.log("SES Error", err)
            sendgrid(compiledTemplate, attachments, req).then(message => {
                console.log(" [x] Sent: " + msg.content)
                req.status = 'SENT';
                emailHistoryService.saveEmail(req, attachments);
            }).catch(error => {
                console.error("Sendgrid Error", error)
                channelWrapperParkingLotQueue.sendToQueue(CONFIG.PARKING_LOT_QUEUE_NAME, msg);
                console.log("Message sent fail, pushed to parking lot")
                req.status = 'FAILED';
                emailHistoryService.saveEmail(req, attachments);
            });
        });
    }
    channelWrapper.ack(msg);
}

const handleParkingLotQueue = (msg) => {
    console.log(" [x] Received Parking lot: " + msg.content);
    let msgProperty = JSON.parse(JSON.stringify(msg.properties.headers));
    let msgContent = JSON.parse(msg.content.toString());
    const message = {
        original_queue_name: msgProperty['x-first-death-queue'] || CONFIG.QUEUE_NAME,
        death_reason: msgProperty['x-first-death-reason'] || 'Data format',
        payload: JSON.stringify(msgContent),
        retried_count: msgProperty['x-retries'] || 1,
        requester_name: msgContent.requesterName ? msgContent.requesterName : null,
        requester_uuid: msgContent.requesterUuid ? msgContent.requesterUuid : null
    }
    require('./msTeams').publishMessage(message);
    parkingLotQueueService.saveData(message).then(result => {
        channelWrapperParkingLotQueue.ack(msg);
    }).catch(error => {
        console.error("ParkingLotQueueService Save Data Error", error)
    });

}

const handlePendingAttachmentEmail = async (msg) => {
    let refId = JSON.parse(msg.content).refId;
    console.log(" [x] Received Pending attachment: " + refId);
    let attachments = JSON.parse(msg.content).attachments;

    try {
        let emailHistory = await emailHistoryService.getByRefId(refId);
        if (emailHistory == null) {
            {
                console.log(" [x] Pending Email Not found : " + refId);
                await channelWrapperParkingLotQueue.sendToQueue(CONFIG.PENDING_ATTACHMENT_DLQ_NAME, msg);
            }
        } else {
            console.log(" [x] Found: " + refId);
            emailHistory.attachments = emailHistory.attachments?.map(atch => "<truncated>");
            console.log(" [x] Content: " + emailHistory);
            let compiledTemplate = compiledTemplateMap[emailHistory.templateName] || compiledFunction;
            let mailSent = false;
            let msgStatus = 'FAILED';
            try {
                let result = await ses(compiledTemplate, attachments, emailHistory);
                mailSent = true;
                msgStatus = "SENT";
            } catch (err) {
                console.log("SES Error", err);
            }

            if (!mailSent) {
                try {
                    let result = await sendgrid(compiledTemplate, attachments, emailHistory);
                    msgStatus = "SENT";
                    mailSent = true;
                } catch (err) {
                    console.error("Sendgrid Error", err)
                }
            }

            if (!mailSent) msgStatus = "FAILED";
            await emailHistoryService.updateEmail(refId, msgStatus, attachments);
        }
        pendingAttachmentEmailChannelWrapper.ack(msg);
    } catch (err) {
        console.log(err);
        await channelWrapperParkingLotQueue.sendToQueue(CONFIG.PENDING_ATTACHMENT_DLQ_NAME, msg);
        pendingAttachmentEmailChannelWrapper.ack(msg);
    }
    console.log(" [x] Processed Pending attachment: " + refId);
}

const initHandlerListeners = function () {
    connection.on('connect', function () {
        console.log('Connected! {} ' + CONFIG.QUEUE_NAME);
        console.log('Connected! {} ' + CONFIG.PARKING_LOT_QUEUE_NAME);
    });
    connection.on('disconnect', function (err) {
        console.log('Disconnected.', err);
    });

    channelWrapper.waitForConnect()
        .then(function () {
            console.log("Listening for email messages");
        });
    channelWrapperParkingLotQueue.waitForConnect()
        .then(function () {
            console.log("Listening for parking lot queue messages");
        });
    pendingAttachmentEmailChannelWrapper.waitForConnect()
        .then(function () {
            console.log("Listening for Pending Attachment Email messages");
        });
}

module.exports.initHandlerListeners = initHandlerListeners;