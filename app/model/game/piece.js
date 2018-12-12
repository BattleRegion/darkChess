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

    move(x, y, force){
        if(force){
            this.x = x;
            this.y = y;
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
        if(!this.hasDead){
            let basicInfo = {
                id:this.id,
                x:this.x,
                y:this.y,
                hasFlip:this.hasFlip,
            };
            if(this.hasFlip){
                basicInfo.type = this.type;
                basicInfo.side = this.side;
                basicInfo.index = this.index;
                basicInfo.hp = this.hp;
            }
            return basicInfo;
        }
        return null
    }
}

module.exports = Piece;