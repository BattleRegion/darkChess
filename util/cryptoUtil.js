/**
 * Created by 1 on 2016/10/6.
 */
const crypto = require("crypto");
const secrectKey = "37c47d55eb8f9af81c4f193a060dfc6d";//vrdabaishu20161006!@#$%^^&*() md5 出来的
const cryptoUtil = module.exports;

/**
 * 加密
 * @param str
 */
cryptoUtil.toSecret = function(str,key)
{
    const sKey = key?key:secrectKey;
    const cipher = crypto.createCipher('blowfish',sKey);
    let crypted =cipher.update(str + '','utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
};

/**
 * 解密
 * @param secret
 */
cryptoUtil.toBasic = function(secret,key)
{
    let sKey = key?key:secrectKey;
    const decipher = crypto.createDecipher('blowfish',sKey);
    let deciphered = decipher.update(secret,'hex','utf8');
    deciphered += decipher.final('utf8');
    return deciphered;
};

/**
 * haxi
 * @param str
 */
cryptoUtil.toHash = function(str)
{
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    return sha1.digest('hex');
};

cryptoUtil.toHash256 = function(str)
{
    const sha1 = crypto.createHash('sha256');
    sha1.update(str);
    return sha1.digest('hex');
};

/**
 * md5
 * @param str
 */
cryptoUtil.toMD5 = function(str)
{
    const md5 = crypto.createHash('md5');
    md5.update(str);
    return md5.digest('hex');
};

cryptoUtil.toHmacMD5 = function(str,key)
{
    const md5 = crypto.createHmac('md5',key);
    md5.update(str);
    return md5.digest('hex');
};

cryptoUtil.rnd = function(start, end){
    return Math.floor(Math.random() * (end - start) + start);
};

/**
 * haxi
 * @param str
 */
cryptoUtil.toHmac256 = function(str,key)
{
    const sha1 = crypto.createHmac('SHA256',key);
    sha1.update(str);
    return sha1.digest('hex');
};