module.exports = {
    debug : msg=> {
        console.debug(`[debug] ${msg}`)
    },

    info : msg => {
        console.info(`[info] ${msg}`)
    },

    error : msg =>{
        console.error(`[error] ${msg}`)
    }
};