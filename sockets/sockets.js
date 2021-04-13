const GameModel = require('../models/game.model')
const { playerPositionGenerator, barrierPositionGenerator, leaveLobby, getResponseObject } = require('../utils/utils')

const allClients = []

module.exports = io => {
    io.on('connection', function (socket) {
        socket.emit('connection', {
            message: 'LOGIN OK'
        });

        socket.on('getLobby', () => {
            GameModel.find({}).lean().exec((err, lobby) => {
                if (!err) {
                    socket.emit('getLobby', getResponseObject(lobby, true))
                } else {
                    socket.emit('getLobby', getResponseObject(err, false))
                }
            })
        })

        socket.on('postLobby', (data) => {
            const object = { width, height, gameBarrierCount, playerBarrierCount, name } = data
            object.playersCount = 0
            if (width && height && gameBarrierCount && playerBarrierCount && name) {
                GameModel.create(object)
                    .then(createdObject => {
                        socket.emit('postLobby', getResponseObject(createdObject, true))
                    })
                    .catch(err => {
                        socket.emit('postLobby', getResponseObject(err, false))
                    })
            } else {
                socket.emit('postLobby', getResponseObject("Все поля обязательные", false))
            }
        })

        socket.on('randomLobby', () => {
            GameModel.aggregate([{ '$sample': { size: 1 } }]).exec((err, lobby) => {
                if (!err) {
                    socket.emit('randomLobby', lobby && lobby[0] ? lobby[0] : null, true)
                } else {
                    socket.emit('randomLobby', getResponseObject(err, false))
                }
            })
        })

        socket.on('deleteLobby', (data) => {
            const { id } = data
            GameModel.deleteOne({ _id: id }).exec((err) => {
                if (!err) {
                    socket.emit('deleteLobby', null, true)
                } else {
                    socket.emit('deleteLobby', getResponseObject(err, false))

                }
            })
        })


        let socketLink = { socket, lobbyId: null, clientName: socket.handshake.query.name }
        allClients.push(socketLink);

        const bindLeaveLobby = leaveLobby.bind(null, io, socketLink, GameModel, socket)

        socket.on('joinLobby', ({id: lobbyId}) => {
            if (lobbyId) {
                const lobbyPath = `lobby-${lobbyId}`
                if (socketLink.lobbyId == lobbyId) return
                if (socketLink.lobbyId) {
                    bindLeaveLobby(socketLink.lobbyId, allClients)
                }

                GameModel
                    .findOne({_id: lobbyId})
                    .lean()
                    .exec((err, { playersCount, gameBarrierCount }) => {
                        if (!err && playersCount < 2) {
                            GameModel
                                .findOneAndUpdate(
                                    { _id: lobbyId },
                                    { $set: { playersCount: playersCount + 1 } },
                                    { new: true }
                                )
                                .lean()
                                .exec((err, lobby) => {
                                    socket.join(lobbyPath)
                                    socket.emit('joinLobby', lobby)
                                    io.sockets.emit('updateLobby', lobby)

                                    const { width, height } = lobby
                                    socketLink.lobbyId = lobbyId

                                    const lobbyClients = allClients.filter(client => client.lobbyId == lobbyId)

                                    if (lobbyClients.length === 2) {
                                        const { move1, move2, position1, position2 } = playerPositionGenerator(width, height)
                                        const { barriers } = barrierPositionGenerator(width, height, position1, position1, gameBarrierCount)
                                        const name0 = lobbyClients[0].socket.handshake.query.name || 'Anonymous'
                                        const name1 = lobbyClients[1].socket.handshake.query.name || 'Anonymous'

                                        const name = [name0, name1]
                                        const winPos = [move1 ? (height - 1) : 0, move2 ? (height - 1) : 0]

                                        lobbyClients[0].socket.emit('startGame', {
                                            move: move1,
                                            width: lobby.width,
                                            height: lobby.height,
                                            position: position1,
                                            opponentPosition: position2,
                                            barriers,
                                            playerBarrierCount: lobby.playerBarrierCount,
                                            opponentName: name[1]
                                        })

                                        lobbyClients[1].socket.emit('startGame', {
                                            move: move2,
                                            width: lobby.width,
                                            height: lobby.height,
                                            position: position2,
                                            opponentPosition: position1,
                                            barriers,
                                            playerBarrierCount: lobby.playerBarrierCount,
                                            opponentName: name[0]
                                        })

                                        lobbyClients.forEach((client, index) => {
                                            client.socket.on('step', data => {
                                                client.socket.emit('step', data)
                                                client.socket.to(lobbyPath).emit('step', data)

                                                if (data.position[0] === winPos[index]) {
                                                    lobbyClients.forEach((item, ind) => {
                                                        item.socket.emit('endGame', { winnerName: name[index] })
                                                        item.socket.removeAllListeners('step')
                                                    })
                                                }
                                            })
                                        })
                                    }
                                })
                        }
                    })
            }
        })

        socket.on('leaveLobby', (lobby) => bindLeaveLobby(lobby.lobbyId, allClients))
        socket.on('disconnect', function() {
            const ind = allClients.findIndex(item => item.socket === socket)
            if (ind !== -1) {
                let lobbyId = allClients[ind].lobbyId
                lobbyId ? bindLeaveLobby(lobbyId, allClients) : null
                allClients.splice(ind, 1)
            }
        });
    })
}
