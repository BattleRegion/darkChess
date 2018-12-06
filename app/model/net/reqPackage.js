const PACKAGE_SECRET = 'ead1e30473cd33ad4c2d6e634a2e94eae17460a7e725cb696f9e3b60e59ec66af05c0c893b8f9ac00ad13fd1ddcf58600e8fd5ccdff19da295336bbf684ecbe8';
const CryptoUtil = require('../../../util/cryptoUtil');
const Package = require('./package');
class ReqPackage extends Package {

    constructor(opt){
        try {
            let optObj = JSON.parse(opt);
            super(optObj);
            this.crc = optObj.crc;
            let obj = {
                token: this.token,
                event:this.event,
                handler:this.handler,
                rawData:this.rawData,
            };
            let objStr = Object.keys(obj).filter(k => {
                if(obj[k]){
                    return k;
                }
                return null;
            }).sort().map(key => {
                return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])
            }).join('&');
            let md5Str = `${objStr}_${PACKAGE_SECRET}`;
            let server_crc = CryptoUtil.toMD5(`${objStr}_${PACKAGE_SECRET}`);
            Log.debug(`收到crc:${this.crc}`);
            Log.debug(`服务器crc:${server_crc}`);
            Log.debug(`md5string:${md5Str}`);
            this.legal = (this.crc === server_crc);
        }
        catch (e) {
            super({});
            Log.error(e.toString());
        }
    }
}

module.exports = ReqPackage;