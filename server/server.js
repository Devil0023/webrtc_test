const WS = require('ws')

var index = 0

const wss = new WS.Server({port: 3000})

var list = {}

wss.on('connection', function (ws) {

    var id = index
    list[id] = ws

    index++

    var size = Object.keys(list).length

    ws.send(size)

    ws.on('message', function (message) {
        console.log('received: ', message)

        message.user = list

        for (var key in list){
           list[key].send(message)
        }
    })

    ws.on('close', (code, message) => {
        delete list[id]
    })

})