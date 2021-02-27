module.exports = {
    sendData: (response, data, success) => {
        response.send({data, success})
    },
    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min
    },
    leaveLobby: (io, socketLink, GameModel, socket, lobbyId, allClients) => {
        if (lobbyId) {
            GameModel
                .findOne({_id: lobbyId})
                .lean()
                .exec((err, { playersCount }) => {
                    if (!err && playersCount > 0) {
                        GameModel
                            .findOneAndUpdate(
                                { _id: lobbyId },
                                { $set: {playersCount: playersCount - 1} },
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
    }
}