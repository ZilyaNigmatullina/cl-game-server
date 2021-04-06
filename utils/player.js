const Obstacle = require('./obstacle')

class Player {
    constructor(name) {
        this.name = name
        this.version = "version 0.1"
        this.myX = -1
        this.myY = -1
        this.opponentX = -1
        this.opponentY = -1
        this.sizeX = -1
        this.sizeY = -1
        this.obstacles = []
        this.maxObstacles = -1
        this.myGoalRow = -1
        this.myObstacles = 0
    }

    initialization(sizeX, sizeY, myX, myY, opponentX, opponentY, maxObstacles, listOfObstacles) {
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.myX = myX
        this.myY = myY
        this.opponentX = opponentX
        this.opponentY = opponentY
        this.maxObstacles = maxObstacles
        this.obstacles = listOfObstacles
        this.myObstacles = 0

        this.myGoalRow = this.myX === 0 ? sizeY - 1 : 0
    }

    isInBoard(x, y) {
        // TODO: возвращает True, если позиция (x, y) внутри доски
        return x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY
    }

    canPlayerMove(x, y) {
        // TODO: возвращает True, если игрок может сделать ход из (this.myX, this.myY) на клетку (x, y)
        return (this.myX !== x || this.myY !== y) &&
            this.isInBoard(x, y) &&
            ((Math.abs(this.myX - x) === 1 && this.myY === y) || (Math.abs(this.myY - y) === 1 && this.myX === x)) &&
            this.obstacles.every(obstacle => obstacle.canPlayerMove(this.myX, this.myY, x, y)) &&
            (this.opponentX !== x || this.opponentY !== y)
    }

    expandPlayer() {
        /* TODO: Возвращает список из набора координат (x, y), куда игрок может сделать ход из текущей позиции.
             Результат Может быть пустым. */

        const allMoves = [[this.myX + 1, this.myY], [this.myX - 1, this.myY], [this.myX, this.myY + 1], [this.myX, this.myY - 1]]
        return allMoves.filter(move => this.canPlayerMove(move[0], move[1]))
    }

    getEndPlayerSteps(obstacle, goalRow, myX, myY) {
        const positions = [myX, myY]
        const player = new Player('')
        const obst = [...this.obstacles, ...obstacle]
        player.initialization(this.sizeX, this.sizeY, myX, myY, -1, -1, this.maxObstacles, obst)
        let steps = player.expandPlayer()
        while (steps.length !== 0 && !steps.find(step => step[0] === goalRow)) {
            const tmpSteps = []
            const sortSteps = steps.filter(step => !positions.some(position => step[0] === position[0] && step[1] === position[1]))
            sortSteps.forEach(step => {
                player.myX = step[0]
                player.myY = step[1]
                positions.push(step)
                tmpSteps.push(...player.expandPlayer())
            })

            steps = tmpSteps
        }

        return steps
    }

    expandObstacles() {
        /* TODO: Возвращает список из наборов (o1,o2) всех возможных вариантов установки препятствий.
            Результат может быть пустым. */
        let myObstacles = []
        let allObstacles = []
        for (let x = 0; x <= (this.sizeX - 2); x++) {
            for (let y = 0; y <= (this.sizeY - 2); y++) {
                const currObstV = [new Obstacle(x, y, x + 1, y), new Obstacle(x, y + 1, x + 1, y + 1)]
                const currObstG = [new Obstacle(x, y, x, y + 1), new Obstacle(x + 1, y, x + 1, y + 1)]

                if (this.obstacles.every(obstacle => !currObstV[0].isEqual(obstacle) && !currObstV[1].isEqual(obstacle))) {
                    allObstacles.push(currObstV)
                }
                if (this.obstacles.every(obstacle => !currObstG[0].isEqual(obstacle) && !currObstG[1].isEqual(obstacle))) {
                    allObstacles.push(currObstG)
                }
            }
        }

        let oppGoalRow = this.myGoalRow === 0 ? (this.sizeY - 1) : 0
        allObstacles.forEach(obstacle => {
            let oppSteps = this.getEndPlayerSteps(obstacle, oppGoalRow, this.myX, this.myY)
            let mySteps = this.getEndPlayerSteps(obstacle, this.myGoalRow, this.opponentX, this.opponentY)
            if (oppSteps.find(step => step[0] === oppGoalRow) && mySteps.find(step => step[0] === this.myGoalRow)) myObstacles.push(obstacle)
        })

        return myObstacles
    }
}

module.exports = Player