const GameModel = require('../models/game.model')
const { randomInt, leaveLobby } = require('../utils/utils')

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
                    .exec((err, { playersCount }) => {
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

                                    const { _id, fieldSize } = lobby
                                    socketLink.lobbyId = _id

                                    const lobbyClients = allClients.filter(client => client.lobbyId == lobbyId)

                                    if (lobbyClients.length === 2) {
                                        let random = Math.round(Math.random())
                                        let first = !!random

                                        let position1 = randomInt(0, fieldSize)
                                        let position2 = randomInt(0, fieldSize)

                                        lobbyClients[0].socket.emit('startGame', {
                                            first: first,
                                            startPosition: position1,
                                            opponentStartPosition: position2,
                                        })
                                        lobbyClients[1].socket.emit('startGame', {
                                            first: !first,
                                            startPosition: position2,
                                            opponentStartPosition: position1,
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
