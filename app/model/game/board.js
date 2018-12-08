const Block = require('./block');
const Pieces = require('./pieces');
const PTYPE = require('./pType');
const SIDE = require('./side');
const INIT_CONF = {
    width:5,
    height:6,
    count:{
        1 : 5,
        2 : 2,
        3 : 2,
        4 : 2,
        5 : 2,
        6 : 1,
        7 : 1
    }
};

class Board {

    constructor(){

        this.blocks = [];

        this.initBlocks();

    }

    initBlocks(){
        let pool = this.initPiecesPool();
        for(let i = 0;i<INIT_CONF.width;i++){
            for(let j = 0;j<INIT_CONF.height;j++){
                let b = new Block(i ,j);
                let index = Math.floor(Math.random()*pool.length);
                let p = pool[index];
                p.move(i, j, true);
                b.pieces = p;
                this.blocks.push(b);
                pool.splice(index, 1);
                Log.info(`----------设置棋盘格----------`);
                Log.info(`${JSON.stringify(b)}`);
                Log.info(`${JSON.stringify(p)}`);
            }
        }
        Log.info(`创建棋盘格子成功 ${this.blocks.length} :${JSON.stringify(this.blocks)}`)
    }

    initPiecesPool(){
        let pool = [];
        Object.keys(SIDE).forEach(function(side){
            Object.keys(PTYPE).forEach(function(type){
                let count = INIT_CONF.count[PTYPE[type]];
                for(let i = 0;i<count;i++){
                    let index = i + 1;
                    let p = new Pieces(SIDE[side],PTYPE[type],index);
                    // Log.info(`初始化棋子:${side} ${type} ${index}`);
                    pool.push(p);
                }
            });
        });
        return pool;
    }
}

module.exports = Board;