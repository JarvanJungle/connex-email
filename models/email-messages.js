const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailMessageSchema = new Schema({
    refId: {
        type: String,
        required: true
    },
    to: {type: Array, default: []},
    toName: {type: Array, default: []},
    cc: {type: Array, default: []},
    bcc: {type: Array, default: []},
    subject: {
        type: String
    },
    title: {
        type: String
    },
    message: {
        type: String
    },
    type: {
        type: String
    },
    templateName: {
        type: String
    },
    status: {
        type: String //could Be [ SENT | PENDING_ATTACHMENT | FAILED ]
    },
    attachments: {type: Array, default: []}
}, {timestamps: true});

const emailMessages = mongoose.model('email-messages', emailMessageSchema);
module.exports = emailMessages;