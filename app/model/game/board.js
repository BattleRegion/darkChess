const Block = require('./block');
const Piece = require('./piece');
const PTYPE = require('./pType');
const SIDE = require('./side');
const INIT_CONF = {
    width:5,
    height:6,
    piecesConf:{
        1:{
            count:4, //兵
            hp:2,
        },
        2:{
            count:2, //炮
            hp:5,
        },
        3:{
            count:2, //马
            hp:5,
        },
        4:{
            count:2, //车
            hp:5,
        },
        5:{
            count:2,//象
            hp:5,
        },
        6:{
            count:2,//士
            hp:10,
        },
        7:{
            count:1,//将
            hp:30,
        }
    }
};

class Board {

    constructor(delaySet){

        this.width = INIT_CONF['width'];

        this.height = INIT_CONF['height'];

        this.blocks = [];

        if(!delaySet){
            this.initBlocks();
        }
    }

    setDBInfo(info){
        let blocks = info.blocks;
        for(let i = 0;i<blocks.length;i++){
            let b = blocks[i];
            let block = new Block(b.x,b.y);
            if(b.piece){
                let p = new Piece(b.piece.id,b.piece.side,b.piece.type,b.piece.index,b.piece.hp);
                p.x = b.piece.x;
                p.y = b.piece.y;
                p.hasFlip = b.piece.hasFlip;
                p.hasDead = b.piece.hasDead;
                block.piece = p;
            }
            this.blocks.push(block);
        }
    }

    boardInfo(client){
        return{
            blocks:this.blocks.map((data)=>{
                let piece = null;
                if(data.piece){
                    piece = client?data.piece.clientInfo():data.piece.info()
                }
                return {
                    x:data.x,
                    y:data.y,
                    piece:piece
                }
            })
        }
    }

    initBlocks(){
        let pool = this.initPiecesPool();
        for(let i = 0;i<INIT_CONF.width;i++){
            for(let j = 0;j<INIT_CONF.height;j++){
                let b = new Block(i ,j);
                let index = Math.floor(Math.random()*pool.length);
                let p = pool[index];
                p.move(i, j, true);
                b.piece = p;
                this.blocks.push(b);
                pool.splice(index, 1);
            }
        }
        Log.info(`创建棋盘格子成功 ${this.blocks.length}`)
    }

    initPiecesPool(){
        let pool = [];
        let ii = 1;
        for(let side = 1;side<3;side++){
            Object.keys(PTYPE).forEach(function(type){
                let pConf = INIT_CONF.piecesConf[PTYPE[type]];
                let count = pConf['count'];
                let hp = pConf['hp'];
                for(let i = 0;i<count;i++){
                    let index = i + 1;
                    let p = new Piece(ii,side,PTYPE[type],index, hp);
                    pool.push(p);
                    ii ++;
                }
            });
        }
        return pool;
    }

    findPiece(pId){
        for(let i = 0;i<this.blocks.length;i++){
            let b = this.blocks[i];
            if(b.piece&&b.piece.id === pId&&b.piece.hasDead === false){
                return b.piece
            }
        }
        return null;
    }

    inBoardRange(x,y){
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getCross(x,y){
        let left = `${x-1}_${y}`;
        let right = `${x+1}_${y}`;
        let up = `${x}_${y+1}`;
        let down = `${x}_${y-1}`;
        return [left,right,up,down];
    }

    getBlock(x,y){
        for(let i = 0;i<this.blocks.length;i++){
            let b = this.blocks[i];
            if(b.x === x && b.y === y){
                return b;
            }
        }
    }
}

module.exports = Board;