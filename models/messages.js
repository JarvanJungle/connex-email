const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema= new Schema({
    original_queue_name: {
        type: String,
        required: true
    },
    death_reason: {
        type: String,
        required: true
    },
    payload: {
        type: String,
        required: true
    },
    retried_count: {
        type: Number,
        required: true
    },
    requester_name: {
        type: String
    },
    requester_uuid: {
        type: String
    }
}, { timestamps: true});

const Messages = mongoose.model('messages', messageSchema);
module.exports = Messages;