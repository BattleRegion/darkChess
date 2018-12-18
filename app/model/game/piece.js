const PTYPE = require('./pType');
class Piece  {

    constructor(id, side, type, index, hp){
        this.id = id;
        this.name = `${side}_${type}_${index}`;
        this.type = type;
        this.side = side;
        this.index = index;
        this.hp = hp;
        this.x = 0;
        this.y = 0;
        this.hasFlip = false;
        this.hasDead = false;
    }

    move(block,board,first){
        if(!first){
            let curBlock = board.getBlock(this.x, this.y);
            curBlock.piece = null;
        }
        this.x = block.x;
        this.y = block.y;
        block.piece = this;
    }


    canMove(x,y,board){
        Log.info(`棋子 ${this.name} 尝试移动 x:${x} y:${y}`);
        if(board.inBoardRange(x,y)){
            let px = this.x;
            let py = this.y;
            let block = board.getBlock(x, y);
            if(this.type !== PTYPE.CANNON){
                let crossPos = board.getCross(px,py,1);
                let moveToStr = `${x}_${y}`;
                Log.info(`当前位置: ${px} ${py},需要移动到 ${x} ${y},可以移动到的十字位置 ${JSON.stringify(crossPos)}`);
                if(crossPos.includes(moveToStr)){
                    if(!block.piece){
                        return 1;//可以移动
                    }
                    else{
                        if (!block.piece.hasFlip){
                            return GameCode.COMMON_CAN_NOT_MOVE_UN_FLIP
                        }
                        else {
                            if(block.piece.side === this.side){
                                return GameCode.CAN_NOT_MOVE_SAME_SIDE
                            }
                            else{
                                return 2;//尝试攻击
                            }
                        }
                    }
                }
                else{
                    return GameCode.MOVE_OUT_RANGE
                }
            }
            else{
                Log.info(`当前行动棋子为cannon 无法移动只能攻击，隔山打牛 当前位置: ${px} ${py},需要移动到 ${x} ${y}`);
                if(!block.piece){
                    return GameCode.CANNON_CAN_NOT_MOVE;
                }
                else{
                    let pieces = this.piecesBetween(block.piece, board);
                    Log.info(`当中隔着的棋子为${pieces.length} ${JSON.stringify(pieces)}`);
                    if(pieces.length === 3){
                        return 2;
                    }
                    else{
                        return GameCode.CANNON_CAN_NOT_MOVE;
                    }
                }
            }
        }
        else{
            return GameCode.MOVE_OUT_RANGE
        }
    }

    piecesBetween(piece, board){
        let pieces = [];
        if(this.x === piece.x){
            let up = this.y < piece.y;
            if(up){
                for(let i = this.y;i<=piece.y;i++){
                    let x = this.x;
                    let y = i;
                    let b = board.getBlock(x ,y);
                    if(b.piece){
                        pieces.push(b.piece);
                    }
                }
            }
            else{
                for(let i = this.y;i>=piece.y;i--){
                    let x = this.x;
                    let y = i;
                    let b = board.getBlock(x ,y);
                    if(b.piece){
                        pieces.push(b.piece);
                    }
                }
            }

        }
        if(this.y === piece.y){
            let right = this.x < piece.x;
            if(right){
                for(let i = this.x;i<=piece.x;i++){
                    let x = i;
                    let y = this.y;
                    let b = board.getBlock(x ,y);
                    if(b.piece){
                        pieces.push(b.piece);
                    }
                }
            }
            else{
                for(let i = this.x;i>=piece.x;i--){
                    let x = i;
                    let y = this.y;
                    let b = board.getBlock(x ,y);
                    if(b.piece){
                        pieces.push(b.piece);
                    }
                }
            }
        }
        return pieces;
    }

    info(){
        return {
            id:this.id,
            name:this.name,
            type:this.type,
            side:this.side,
            index:this.index,
            hp:this.hp,
            x:this.x,
            y:this.y,
            hasFlip:this.hasFlip,
            hasDead:this.hasDead
        }
    }

    clientInfo(){
        let basicInfo = {
            id:this.id,
            x:this.x,
            y:this.y,
            hasFlip:this.hasFlip,
            hasDead:this.hasDead
        };
        if(this.hasFlip){
            basicInfo.type = this.type;
            basicInfo.side = this.side;
            basicInfo.index = this.index;
            basicInfo.hp = this.hp;
        }
        return basicInfo;
    }

    atk(atkBlock, board){
        if(this.type === PTYPE.SOLDIER && atkBlock.piece.type === PTYPE.EMPEROR){
            //吃子
            let atkPiece = atkBlock.piece;
            atkPiece.hasDead = true;
            atkBlock.piece = null;
            this.move(atkBlock, board, false);
            return atkPiece;
        }
        else if(this.type === PTYPE.EMPEROR && atkBlock.piece.type === PTYPE.SOLDIER){
            //自杀
            this.hasDead = true;
            let curBlock = board.getBlock(this.x , this.y);
            curBlock.piece = null;
            return this;
        }
        else{
            if(this.type !== PTYPE.CANNON){
                if(this.type >= atkBlock.piece.type){
                    //吃子
                    let atkPiece = atkBlock.piece;
                    atkPiece.hasDead = true;
                    atkBlock.piece = null;
                    this.move(atkBlock, board, false);
                    return atkPiece;
                }
                else{
                    //自杀
                    this.hasDead = true;
                    let curBlock = board.getBlock(this.x , this.y);
                    curBlock.piece = null;
                    return this;
                }
            }
            else{
                //吃子
                let atkPiece = atkBlock.piece;
                atkPiece.hasDead = true;
                atkBlock.piece = null;
                return atkPiece;
            }
        }
    }
}

module.exports = Piece;