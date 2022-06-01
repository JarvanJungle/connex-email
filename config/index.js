const CONFIG = {
    NODE_ENV: process.env.NODE_ENV || 'local',
    MQ_SERVER: process.env.MQ_SERVER || 'localhost',
    EMAIL_API_PATH: '/api/sendemail',
    QUEUE_NAME: 'queue.email-service.new_email.sent',
    // QUEUE_NAME: 'local.queue.email-service.new_email.sent',
    RABBIT_PROTOCOL: "amqps",
    RABBIT_HOSTNAME: process.env.RABBIT_MQ_HOST ||"b-87a4d3f0-63d4-4a65-b4b3-b26c6f897194.mq.ap-southeast-1.amazonaws.com",
    RABBIT_PORT: process.env.RABBIT_MQ_PORT || 5671,
    VHOST: (process.env.VHOST || 'local').toLocaleLowerCase(),
    RABBIT_USERNAME: process.env.RABBIT_MQ_USER || "doxa-admin",
    RABBIT_PASSWORD: process.env.RABBIT_MQ_PWD || "feHj1ezou3GrsU1tSdfkn",
    MONGODB_HOST: process.env.MONGODB_HOST || 'mongodb://localhost',
    MONGODB_PORT: process.env.MONGODB_PORT || 27017,
    MONGODB_DB: process.env.MONGODB_DB || 'email-service',
    MONGODB_USER: process.env.MONGODB_USER,
    AUTH_SOURCE: process.env.AUTH_SOURCE || 'admin',
    MONGODB_PWD: process.env.MONGODB_PWD,
    MONGODB_OPTIONS: process.env.MONGODB_OPTIONS || '?retryWrites=false',
    PARKING_LOT_QUEUE_NAME: process.env.PARKING_LOT_QUEUE_NAME || 'Connex.parking.lot',
    PENDING_ATTACHMENT_QUEUE_NAME: process.env.PENDING_ATTACHMENT_QUEUE_NAME || 'queue.email-service.pending-attachment',
    PENDING_ATTACHMENT_DLQ_NAME: process.env.PENDING_ATTACHMENT_DLQ_NAME || 'queue.email-service.pending-attachment.dlq',
    EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@doxa-holdings.com'
}

Object.freeze(CONFIG)

module.exports = CONFIG;