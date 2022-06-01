const axios = require('axios');

const config = {
    method: 'get',
    url: 'http://oauth-service/api/private/user-emails/',
};

function privateParseUuid(recipients, cb) {
    if (recipients.length === 0) {
        cb(null, []);
        return;
    }
    let options = {
        method: config.method,
        url: config.url + recipients.join()
    };
    return axios(options)
        .then(function (response) {
            cb(null, response.data.data);
        })
        .catch(function (error) {
            cb(error, null);
        });
}

const parseUuidToEmail = (req) => {
    return new Promise((resolve, reject) => {
        privateParseUuid([].concat(req.to, req.cc, req.bcc), (err, result) => {
            if (err) {
                reject(err)
            } else {
                let uuidMap = result.reduce((map, user) => {
                    map[user.uuid] = user.email;
                    return map;
                }, {});
                let nameMap = result.reduce((map, user) => {
                    map[user.uuid] = user.name;
                    return map;
                }, {});
                let mapper = (uuid) => uuidMap[uuid];
                req.toName = req.to ? req.to.map((uuid) => nameMap[uuid]) : [];
                req.to = req.to ? req.to.map(mapper) : [];
                req.cc = req.cc ? req.cc.map(mapper) : [];
                req.bcc = req.bcc ? req.bcc.map(mapper) : [];
                resolve("Fully resolve Email from UUID");
            }
        })
    })
};

module.exports = parseUuidToEmail;
