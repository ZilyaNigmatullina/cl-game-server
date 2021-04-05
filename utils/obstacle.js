class Obstacle {
    constructor(fromX, fromY, toX, toY) {
        this.fromX = fromX
        this.fromY = fromY
        this.toX = toX
        this.toY = toY
    }

    canPlayerMove(fromX, fromY, toX, toY) {
        return !((this.fromX === fromX && this.fromY === fromY && this.toX === toX && this.toY === toY) ||
            (this.fromX === toX && this.fromY === toY && this.toX === fromX && this.toY === fromY))
    }

    isValidObstacle(sizeX, sizeY) {
        return this.fromX >= 0 && this.fromY < sizeX && this.fromY >= 0 &&
            this.fromY < sizeX && this.toX >= 0 && this.toX < sizeX && this.toY >= 0 && this.toY < sizeY
    }

    isEqual({fromX, fromY, toX, toY}) {
        return (this.fromX === toX && this.fromY === toY && this.toX === fromX && this.toY === fromY)
            || (this.fromX === fromX && this.fromY === fromY && this.toX === toX && this.toY === toY)
    }
}

module.exports = Obstacle