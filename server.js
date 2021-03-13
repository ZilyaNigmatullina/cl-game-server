//config
const config = require('./config')
//express
const cors = require('cors');
const express = require('express')
const app = express()
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.options('*', cors());
const server = require('http').createServer(app);
//mongodb
const mongoose = require('mongoose');
mongoose.connect(config.mongo.url, config.mongo.options);
//mongo models
const GameModel = require('./models/game.model')
//sockets
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    }
});
//utils
const { sendData } = require('./utils/utils')


app.get('/api/lobby', function (req, res) {
    GameModel.find({}).lean().exec((err, lobby) => {
        if (!err) {
            sendData(res, lobby, true)
        } else {
            sendData(res, err, false)
        }
    })
})

app.post('/api/lobby', function (req, res) {
    const object = { width, height, gameBarrierCount, playerBarrierCount, name } = req.body
    object.playersCount = 0
    if (width && height && gameBarrierCount && playerBarrierCount && name) {
        GameModel.create(object)
            .then(createdObject => {
                sendData(res, createdObject, true)
                io.sockets.emit('createLobby', createdObject)
            })
            .catch(err => {
                sendData(res, err, false)
            })
    } else {
        sendData(res.status(400), "Все поля обязательные", false)
    }
})

app.post('/api/deletelobby', function (req, res) {
    const { id } = req.body
    GameModel.deleteOne({ _id: id }).exec((err) => {
        if (!err) {
            sendData(res, null, true)
            io.sockets.emit('deleteLobby', { _id: id })
        } else {
            sendData(res, err, false)
        }
    })
})


require('./sockets/sockets')(io)

server.listen(config.server.port, config.server.hostname, () => {
    GameModel.updateMany({}, { $set: { playersCount: 0 } }).exec()
    console.log('Сервер запущен')
})