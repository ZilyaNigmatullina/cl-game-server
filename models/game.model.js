const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GameSchema = new Schema({
    width: { type: Number },
    height: { type: Number },
    gameBarrierCount: { type: Number },
    playerBarrierCount: { type: Number },
    playersCount: { type: Number },
    name: { type: String },
}, {
    versionKey: false,
    collection: 'LobbyCollection'
})

module.exports = mongoose.model('GameModel', GameSchema)