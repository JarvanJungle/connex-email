const EmailMessages = require('../models/email-messages.js');
const crypto = require('crypto')
const saveEmail = (msg, attachments) => {
    const emailMessage = new EmailMessages({
        refId: msg.refId ? msg.refId : crypto.randomUUID(),
        to: msg.to,
        cc: msg.cc,
        bcc: msg.bcc,
        toName: msg.toName,
        subject: msg.subject,
        title: msg.title,
        message: msg.message,
        type: msg.type,
        templateName: msg.templateName,
        status: msg.status,
        attachments: attachments
    });
    return new Promise((resolve, reject) => {
        emailMessage.save()
            .then((result) => {
                resolve("Save new message successfully");
            })
            .catch((err) => {
                reject(err);
            })
    })
}

const getByRefId = (refId) => {
    return new Promise(((resolve, reject) => {
        EmailMessages.findOne({refId: refId}).then((result) => {
            resolve(result);
        }).catch((err) => {
            console.log(err);
            reject(err);
        })
    }))
}

const updateEmail = (refId, status, attachments) => {
    return new Promise(((resolve, reject) => {
        EmailMessages.findOneAndUpdate({refId: refId}, {
            $set: {attachments: attachments},
            status: status
        }).then((result) => {
            resolve(result);
        }).catch((err) => {
            console.log(err);
            reject(err);
        })
    }))
}

module.exports = {
    saveEmail, getByRefId, updateEmail
};