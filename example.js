const MessagePair = require('./')

const local = new MessagePair({
  onupdate () {
    remote.onnames(local.names())
  }
})

const remote = new MessagePair({
})

const l = local.add('hi', {
  encoding: 'json',
  onmessage (message) {
    console.log('l got message', message)
  }
})

local.add('a') // dummy message

const r = remote.add('hi', {
  encoding: 'json',
  onmessage (message) {
    console.log('r got message', message)
  }
})

remote.add('z') // dummy message

remote.onmessage(l.id, l.send({ hi: 'world' }))
local.onmessage(r.id, r.send({ hi: 'world' }))
