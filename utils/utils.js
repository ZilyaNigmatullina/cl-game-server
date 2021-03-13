function sendData(response, data, success) {
    response.send({data, success})
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

function barrierPositionGenerator(width, height, barrierCount) {
    const barriers = []
    for (let i = 0; i < barrierCount; i++) {
        const position = [randomInt(0, height), randomInt(0, width)]
        const dx = Math.round(Math.random()) === 1 ? 1 : -1
        const dy = Math.round(Math.random()) === 1 ? 1 : -1
        const type = Math.round(Math.random())

        barriers.push({
            position: [
                position,
                [position[0] + dx, position[1]],
                [position[0], position[1] + dy],
                [position[0] + dx, position[1] + dy]
            ],
            type
        })
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
    playerPositionGenerator,
    leaveLobby,
    barrierPositionGenerator
}