module.exports = {
    debug : msg=> {
        // console.log(`[debug] ${msg}`)
    },

    info : msg => {
        console.log(`[info] ${msg}`)
    },

    error : msg =>{
        console.log(`[error] ${msg}`)
    }
};