var websocket

const userId = 'user' + randNum(0, 10000)
var localVideo = document.getElementById('localVideo')
var remoteVideo = document.getElementById('remoteVideo')
var Connection

createSocket()
startPeerConnection()
getLocalVideo()

function createOffer() {
    Connection.createOffer().then(offer => {
        Connection.setLocalDescription(offer)

        websocket.send(JSON.stringify({
            "userId": userId,
            "event": "offer",
            "data": {
                "sdp": offer
            }
        }))
    })
}

function getLocalVideo() {

    navigator.getUserMedia({
            video: true,
            audio: false,
        },
        stream => {
            localVideo.srcObject = stream
            window.stream = stream
            Connection.addStream(stream)
        },
        error => {
            console.log(error)
        },
    )


}

function startPeerConnection() {
    var config = {
        iceServers: [
            {urls: 'stun:global.stun.twilio.com:3478?transport=udp'}
        ]
    }

    Connection = new RTCPeerConnection(config)

    Connection.onicecandidate = function (e) {

        if (e.candidate) {
            websocket.send(JSON.stringify({
                "userId": userId,
                "event": "_ice_candidate",
                "data": {
                    "candidate": e.candidate
                }
            }))
        }

    }

    Connection.onaddstream = function (e) {
        remoteVideo.srcObject = e.stream
    }
}

function createSocket() {
    websocket = new WebSocket('ws://localhost:3000')

    websocket.onopen = function (e) {
        console.log('connect success')
    }

    websocket.onclose = function (e) {
        console.log('close success')
    }

    websocket.onerror = function (e) {
        console.log('ws error', e)
    }

    websocket.onmessage = function (event) {
        if (event.data == 'newUser') {
            location.reload()
        } else {
            var json = JSON.parse(event.data)

            console.log('receive message:', json)

            if (json.userId != userId) {

                if (json.event === '_ice_candidate' && json.data.candidate) {

                    Connection.addIceCandidate(new RTCIceCandidate(json.data.candidate))

                } else if (json.event === 'offer') {

                    Connection.setRemoteDescription(json.data.sdp)

                    Connection.createAnswer().then(answer => {
                        Connection.setLocalDescription(answer)
                        websocket.send(JSON.stringify({
                            "userId": userId,
                            "event": "answer",
                            "data": {
                                "sdp": answer
                            }
                        }))
                    })

                } else if (json.event === 'answer') {

                    Connection.setRemoteDescription(json.data.sdp)

                }
            }


        }
    }
}

function randNum(min, max) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * min + 1, 10)
            break
        case 2:
            return parseInt(Math.random() * (max - min + 1) + min, 10)
            break
        default:
            return 0
            break
    }
}