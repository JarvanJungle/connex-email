require("dotenv").config();
const CONFIG = require("./config");

//Load custom nodemailer
var customNodemailer = require('./custom_nodemailer');

//mimemessage module helps us in creating the email with less hassle
var mimemessage = require('mimemessage');

// Load the AWS SDK for Node.js
var aws = require('aws-sdk');
// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + '/aws/config.json');

const awsSES = (compiledFunction, attachments, req) => {
    console.info(req);
    // Instantiate SES.
    var ses = new aws.SES();

    // Build the top-level multipart MIME message.
    var mailContent = mimemessage.factory({contentType: 'multipart/mixed',body: []});

    //Setting the content
    mailContent.header('From', CONFIG.EMAIL_FROM);

    mailContent.header('To',req.to);
    mailContent.header('Cc',req.cc);
    mailContent.header('Bcc',req.bcc);
    mailContent.header('Subject', req.subject);

    var alternateEntity = mimemessage.factory({
        contentType: 'multipart/alternate',
        body: []
    });

    const message = req.message
    // Build the HTML MIME entity.
    var htmlEntity = mimemessage.factory({
        contentType: 'text/html;charset=utf-8',
        body: compiledFunction({
            title: req.title,
            message
        })
    });

    // Build the plain text MIME entity.
    var plainEntity = mimemessage.factory({
        body: req.text
    });
    
    alternateEntity.body.push(htmlEntity);
    alternateEntity.body.push(plainEntity);    

    mailContent.body.push(alternateEntity);

    for (let i = 0; i < attachments.length; i++){
        //For attachments
        var attachmentEntity = mimemessage.factory({
            contentType: attachments[i].type,
            contentTransferEncoding: 'base64',
            body: attachments[i].content
        });
        // attachmentEntity.header('Content-Disposition', `attachment ;filename=${attachments[i].filename}`);    
        attachmentEntity.header('Content-Disposition', 'attachment ;filename=' + '"'+attachments[i].filename+'"');
        mailContent.body.push(attachmentEntity);
    }
    return new Promise((resolve, reject) => {
        ses.sendRawEmail({
            RawMessage: { Data: mailContent.toString() }
        }, (err, data) => {
            if(err) {
                console.log("Email Not Sent FROM SES");
                reject(err)
            } 
            else {
                resolve("Email Sent Succcess FROM SES")
            } 
        });
    })
}

const awsSESv2 = (compiledFunction, attachments, req) => {
    console.info(req);
    // Instantiate SES.
    let ses = new aws.SES();
    return customNodemailer.sendWithSES(ses, compiledFunction, attachments, req);

};

module.exports = awsSESv2;
