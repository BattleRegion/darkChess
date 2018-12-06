const PACKAGE_SECRET = 'ead1e30473cd33ad4c2d6e634a2e94eae17460a7e725cb696f9e3b60e59ec66af05c0c893b8f9ac00ad13fd1ddcf58600e8fd5ccdff19da295336bbf684ecbe8';
const CryptoUtil = require('../../../util/cryptoUtil');
const Package = require('./package');
class ReqPackage extends Package {

    constructor(opt){
        super(opt);
        this.crc = opt.crc;
        let objStr = JSON.stringify({
            token: this.token,
            event:this.event,
            rawData:this.rawData,
        });
        this.legal = (this.crc === CryptoUtil.toMD5(`${objStr}_${PACKAGE_SECRET}`));
    }
}

module.exports = ReqPackage;