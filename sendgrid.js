const sgMail = require('@sendgrid/mail');
const CONFIG = require('./config');
require("dotenv").config();

//Load custom nodemailer
var customNodemailer = require('./custom_nodemailer');

const sgApiKey = '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';
sgMail.setApiKey(sgApiKey);


const sendGrid = (compiledFunction, attachment, req) => {
    try {
        const message = req.body.message
        const msg = {
            //who we want to send the email
            to: req.to,
            cc: req.cc,
            bcc: req.bcc,
            //the same sender verification email in sendgrid
            from: CONFIG.EMAIL_FROM,
            subject: req.subject,
            //can use either text of html but over here using text
            text: req.text,
            html: compiledFunction({
                title: req.title,
                message
            }),
            attachments: attachment
        }

        return new Promise((resolve, reject) => {
            //send method takes in the message and you can pass a callback function as the second parameter
            sgMail.send(msg, function(err, info){
                if(err){
                    console.log("Email Not Sent FROM SendGrid");
                    reject(err)
                }else{
                    resolve("Email Sent Succcess FROM SendGrid")
                }
            } )
        })
    }catch (error) {
        console.error(error)
        return error
    }
}

const sendGridv2 = (compiledFunction, attachments, req) => {
    console.info(req);
    return customNodemailer.sendWithSendGrid(sgApiKey, compiledFunction, attachments, req);
};

module.exports = sendGridv2;
