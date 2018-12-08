class Pieces  {

    constructor(side, type, index){
        this.id = `${side}_${type}_${index}`;
        this.type = type;
        this.side = side;
        this.index = index;
        this.x = 0;
        this.y = 0;
    }

    move(x, y, force){
        if(force){
            this.x = x;
            this.y = y;
        }
    }
}

module.exports = Pieces;