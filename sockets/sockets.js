const GameModel = require('../models/game.model')
const { playerPositionGenerator, barrierPositionGenerator, leaveLobby } = require('../utils/utils')

const allClients = []

module.exports = io => {
    io.on('connection', function (socket) {
        socket.emit('connected', 'successful connection');
        let socketLink = { socket, lobbyId: null }
        allClients.push(socketLink);

        const bindLeaveLobby = leaveLobby.bind(null, io, socketLink, GameModel, socket)

        socket.on('joinLobby', ({lobbyId}) => {
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

                                    const { fieldSize } = lobby
                                    socketLink.lobbyId = lobbyId

                                    const lobbyClients = allClients.filter(client => client.lobbyId == lobbyId)

                                    if (lobbyClients.length === 2) {
                                        const { move1, move2, position1, position2 } = playerPositionGenerator(fieldSize)
                                        const { barriers } = barrierPositionGenerator(fieldSize, gameBarrierCount)

                                        lobbyClients[0].socket.emit('startGame', {
                                            move: move1,
                                            startPosition: position1,
                                            opponentStartPosition: position2,
                                            barriers
                                        })

                                        lobbyClients[1].socket.emit('startGame', {
                                            move: move2,
                                            startPosition: position2,
                                            opponentStartPosition: position1,
                                            barriers
                                        })

                                        lobbyClients.forEach((client) => {
                                            client.socket.on('step', data => {
                                                client.socket.emit('step', data)
                                                client.socket.to(lobbyPath).emit('step', data)
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
