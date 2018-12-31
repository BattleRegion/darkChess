const log4js = require("log4js");
const moment = require("moment");

module.exports = {
    debug : msg=> {
        // console.log(`[debug] ${msg}`)
    },

    info : msg => {
        console.log(`[info] ${msg}`)
    },

    error : msg =>{
        console.log(`[error] ${msg}`)
    },

    roomInfo : (roomId, msg)=>{
        log4js.configure({
            appenders: {
                'roomInfo': {
                    type: "file",
                    filename: `logs/roomInfo/${roomId}.log`,
                    maxLogSize: 500 * 1024 * 1024, // = 10Mb
                },
                out: {
                    type: "stdout"
                }
            },

            categories: {
                default: { appenders: ["out"], level: "debug" },
                'roomInfo':{ appenders: ["roomInfo","out"], level: "debug" }
            }
        });

        let logger = log4js.getLogger("roomInfo");
        logger.info(`${roomId}-${moment(new Date()).format("YYYY/MM/DD hh:mm:ss")} ${msg}`);
    }
};