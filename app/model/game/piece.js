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
                Log.info(`当前行动棋子为cannon 无法移动只能攻击，隔山打牛`);
                let crossPos = board.getCross(px,py,2);
                let moveToStr = `${x}_${y}`;
                Log.info(`当前位置: ${px} ${py},需要移动到 ${x} ${y},可以移动到的隔山打牛位置 ${JSON.stringify(crossPos)}`);
                if(crossPos.includes(moveToStr)){
                    if(!block.piece){
                        return GameCode.CANNON_CAN_NOT_MOVE;
                    }
                    else{
                        return 2;
                    }
                }
                else{
                    return GameCode.MOVE_OUT_RANGE
                }
            }
        }
        else{
            return GameCode.MOVE_OUT_RANGE
        }
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

module.exports = Piece;