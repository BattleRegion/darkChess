class Piece  {

    constructor(id, side, type, index){
        this.id = id;
        this.name = `${side}_${type}_${index}`;
        this.type = type;
        this.side = side;
        this.index = index;
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

    getCurInfo(){
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
            }
            return basicInfo;
        }
        return null
    }
}

module.exports = Piece;