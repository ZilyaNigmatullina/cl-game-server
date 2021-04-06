const Player = require('./player')

function sendData(response, data, success) {
    response.send({data, success})
}

function getResponseObject(data, success) {
    return { data, success }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

function playerPositionGenerator(width, height) {
    const move1 = !!Math.round(Math.random())
    const move2 = !move1

    const position1 = [move1 ? 0 : (height - 1), randomInt(0, width)]
    const position2 = [!move1 ? 0 : (height - 1), randomInt(0, width)]

    return {
        position1, position2, move1, move2
    }
}

function barrierPositionGenerator(width, height, position, opponentPosition, barrierCount) {
    const player = new Player('')
    let tmpObstacles = []
    player.initialization(height, width,
        position[0], position[1], opponentPosition[0],
        opponentPosition[1], -1, tmpObstacles)
    const barriers = []
    for (let i = 0; i < barrierCount; i++) {
        const obstacles = player.expandObstacles()
        if (obstacles.length > 0) {
            const random = randomInt(0, obstacles.length)
            const obst = obstacles[random]
            barriers.push([
                [obst[0].fromX, obst[0].fromY],
                [obst[0].toX, obst[0].toY],
                [obst[1].fromX, obst[1].fromY],
                [obst[1].toX, obst[1].toY],
            ])
            tmpObstacles = [...tmpObstacles, ...obst]
            player.obstacles = tmpObstacles
        }
    }

    return {
        barriers
    }
}

function leaveLobby(io, socketLink, GameModel, socket, lobbyId, allClients) {
    if (!lobbyId) return
    GameModel
        .findOne({_id: lobbyId})
        .lean()
        .exec((err, {playersCount}) => {
            if (!err && playersCount > 0) {
                GameModel
                    .findOneAndUpdate(
                        { _id: lobbyId },
                        { $set: { playersCount: playersCount - 1 } },
                        { new: true }
                    )
                    .lean()
                    .exec((err, lobby) => {
                        const lobbyPath = `lobby-${lobbyId}`

                        allClients.filter(client => client.lobbyId == lobbyId).forEach((item) => {
                            item.socket.removeAllListeners('step')
                        })

                        socket.leave(lobbyPath)
                        socket.emit('leaveLobby', `lobby: ${lobbyId}`)
                        io.sockets.emit('updateLobby', lobby)
                        socketLink.lobbyId = null
                    })
            }
        })


}

module.exports = {
    sendData,
    randomInt,
    getResponseObject,
    playerPositionGenerator,
    leaveLobby,
    barrierPositionGenerator
}