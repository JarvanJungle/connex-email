const sendgrid = require("./sendgrid");
const ses = require("./ses");
const authService = require("./authservice");
const rabbitHandler = require("./rabbit-handler");
const express = require('express')
const cors = require('cors')
var pug = require('pug');
const Config = require('./config/index')
require("dotenv").config();
const mongoose = require('mongoose');

// multer - library for receiving form-data content type
var multer = require('multer');
const CONFIG = require("./config/index");
const { config } = require("dotenv");
var upload = multer({ storage: multer.memoryStorage({}) })

const port = parseInt(process.env.PORT) || 3000
const app = express()

app.use(cors())

// Parse URL-encoded bodies (as sent by HTML forms)
// urlencoded() for x-www-form-urlencoded content type
app.use(express.urlencoded())
// Parse JSON bodies (as sent by API clients)
app.use(express.json())

//defining the html template
const compiledTemplateMap = {
    default: pug.compileFile('./views/notification.pug'),
    notification: pug.compileFile('./views/notification.pug')
};
const compiledFunction = pug.compileFile('./views/notification.pug');

rabbitHandler.initHandlerListeners();

//connect to mongodb 
const URL = `${CONFIG.MONGODB_HOST}:${CONFIG.MONGODB_PORT}/${CONFIG.MONGODB_DB}${CONFIG.MONGODB_OPTIONS}`

console.log("MONGO URL: ", URL);
const connectionOption = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}
if (CONFIG.NODE_ENV != 'local') {
    connectionOption['auth'] = {
        authSource: CONFIG.AUTH_SOURCE
    }
    connectionOption['user'] = CONFIG.MONGODB_USER
    connectionOption['pass'] = CONFIG.MONGODB_PWD
}
mongoose.connect(URL, connectionOption)
    .then((result) => console.log("Connected to mongodb at: " + URL))
    .catch(
        (err) => {
            console.log(err);
            console.error("Cannot connect to db");
        });


/**
 * @api {post} /api/sendemail Send email using REST API
 * @apiGroup Email Service
 * @apiVersion 0.0.1
 *
 * @apiParam {String} to Email address
 * @apiParam {String} cc Email address
 * @apiParam {String} bcc Email address
 * @apiParam {String} subject Email subject
 * @apiParam {Object} attachments Attachment file to be sent
 * @apiParam {String} title Email title
 * @apiParam {String} message Email message content
 *
 * @apiParamExample {form-data} Request-Example:
 *        {
 *		    "to":"test@hotmail.com",
 *		    "cc":"test1@hotmail.com",
 *		    "bcc":"test2@hotmail.com",
 *		    "subject":"Developing",
 *		    "attachments":"Attachment File",
 *		    "title":"Sunny Day",
 *		    "message":"Today is a sunny day"
 *		}
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *       OK
 *
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     Bad Request
 *
 * @apiDescription Sending email through email service. Send multiple 'to'/'attachments' if want to send to multiple users or attach multiple files,
 * maximum 12 attachments
 *
 * @param {Next} next
 */
//the key for attachments need to be 'attachments', maximum 12 attachments
app.post(`${Config.EMAIL_API_PATH}`, upload.array('attachments', 12), (req, res) => {

    let attachments = [];
    if (req.files != undefined) {
        for (let i = 0; i < Object.keys(req.files).length; i++) {
            let attachment = {
                //The Base64 encoded content of the attachment.
                content: req.files[Object.keys(req.files)[i]].buffer.toString('base64'),
                //filename of the attachement.
                filename: req.files[Object.keys(req.files)[i]].originalname,
                //application/pdf, file type
                type: req.files[Object.keys(req.files)[i]].mimetype
            }
            attachments.push(attachment)
        }
    }
    ses(compiledFunction, attachments, req).then(message => {
        console.log(message)
        res.sendStatus(200)
    }).catch(err => {
        console.log(err)
        sendgrid(compiledFunction, attachments, req).then(message => {
            console.log(message)
            res.sendStatus(200)
        }).catch(err => {
            res.sendStatus(400)
        });
    });
})

app.listen(port, () => {
    console.info(`Application started on port ${port} at ${new Date()}`)
})

