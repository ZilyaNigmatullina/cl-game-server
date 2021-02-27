const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GameSchema = new Schema({
    fieldSize: { type: Number },
    gameBarrierCount: { type: Number },
    playerBarrierCount: { type: Number },
    playersCount: { type: Number },
    lobbyName: { type: String },
}, {
    versionKey: false,
    collection: 'LobbyCollection'
})

module.exports = mongoose.model('GameModel', GameSchema)