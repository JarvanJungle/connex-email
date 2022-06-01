//Load Nodemailer
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid');
const CONFIG = require('./config');

const doSendMail = (compiledFunction, attachments, req, transporter) => {
    let sendResult = [];
    //Send mail to each recipients individually
    req.to.forEach((to, index) => {
        let msg = {
            from: CONFIG.EMAIL_FROM,
            to: to,
            cc: req.cc,
            bcc: req.bcc,
            subject: req.subject,
            text: req.text,
            html: compiledFunction({
                title: req.title,
                message: req.message,
                name: req.toName ? req.toName[index] : null,
            }), // html version
            attachments: attachments ? attachments.map((atch) => {
                return {
                    filename: atch.filename,
                    content: atch.content,
                    encoding: 'base64'
                }
            }) : []
        };
        sendResult.push(transporter.sendMail(msg));
    });
    return new Promise((resolve, reject) => {
        Promise.all(sendResult).then(() => resolve("Email Sent Succcess")).catch((err) => {
            reject(err);
        })
    })
};

const sendWithSendGrid = (apiKey, compiledFunction, attachments, req) => {
    let transporter = nodemailer.createTransport(
        sgTransport({
            apiKey: apiKey
        })
    );
    console.log('Send email with SendGrid Nodemailer');
    return doSendMail(compiledFunction, attachments, req, transporter);
};

const sendWithSES = (ses, compiledFunction, attachments, req) => {
    let transporter = nodemailer.createTransport({
        SES: ses
    });
    console.log('Send email with SES NodeMailer');
    return doSendMail(compiledFunction, attachments, req, transporter);
};

module.exports = {
    sendWithSES: sendWithSES,
    sendWithSendGrid: sendWithSendGrid
};