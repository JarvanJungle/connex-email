const Messages = require('../models/messages');

const saveData = (msg) => {
    const message = new Messages(msg);

    return new Promise((resolve, reject) => {
        message.save()
            .then((result) => {
                resolve("Save parking lot queue message successfully");
            })
            .catch((err) => {
                reject(err);
            })
    })
}

module.exports = {
    saveData
};