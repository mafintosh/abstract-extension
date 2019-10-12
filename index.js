const codecs = require('codecs')

class Message {
  constructor (pair, name, handlers = {}) {
    this.id = 0
    this.name = name
    this.encoding = codecs(handlers.encoding || 'binary')
    this.handlers = handlers
    this.pair = pair
  }

  encode (message) {
    return this.encoding.encode(message)
  }

  remoteSupports () {
    return !!(this.pair && this.pair.map && this.pair.map[this.id] === this)
  }

  onmessage (buf, context) {
    if (!this.handlers.onmessage) return

    let message
    try {
      message = this.encoding.decode(buf)
    } catch (err) {
      if (this.handlers.onerror) this.handlers.onerror(err, context)
      return
    }

    this.handlers.onmessage(message, context)
  }

  get destroyed () {
    return this.pair === null
  }

  destroy () {
    if (this.pair === null) return
    this.pair._remove(this)
    this.pair = null
  }

  static createMessagePair (handlers = null) {
    return new MessagePair(handlers, this)
  }
}

class Remote {
  constructor (pair) {
    this.pair = pair
    this.remote = null
    this.map = null
    this.changes = 0
  }

  update (remote) {
    this.remote = remote
    this.changes = 0
  }

  onmessage (id, message, context = null) {
    if (this.changes !== this.pair.changes) {
      this.map = this.remote ? match(this.pair.local, this.remote) : null
      this.changes = this.pair.changes
    }
    const m = this.map && this.map[id]
    if (m) m.onmessage(message, context)
  }
}

class MessagePair {
  constructor (handlers = null, M = Message) {
    this.local = []
    this.handlers = handlers
    this.Message = M
    this.changes = 1
  }

  get length () {
    return this.local.length
  }

  [Symbol.iterator] () {
    return this.local[Symbol.iterator]()
  }

  get (name) {
    // technically we can bisect here, but yolo
    for (const m of this.local) {
      if (m.name === name) return m
    }
    return null
  }

  add (name, handlers) {
    const m = new this.Message(this, name, handlers)

    this.changes++
    this.local.push(m)
    this.local.sort(sortMessages)
    for (let i = 0; i < this.local.length; i++) {
      this.local[i].id = i
    }

    if ((m.id > 0 && this.local[m.id - 1].name === m.name) || (m.id < this.local.length - 1 && this.local[m.id + 1].name === m.name)) {
      this._remove(m)
      throw new Error('Cannot add multiple messages with the same name')
    }

    if (this.handlers && this.handlers.onnamesupdate) this.handlers.onnamesupdate()

    return m
  }

  remote () {
    return new Remote(this)
  }

  _remove (m) {
    this.changes++
    this.local.splice(m.id, 1)
    m.id = -1
    if (this.handlers && this.handlers.onnamesupdate) this.handlers.onnamesupdate()
  }

  names () {
    const names = new Array(this.local.length)
    for (let i = 0; i < names.length; i++) {
      names[i] = this.local[i].name
    }
    return names
  }
}

function sortMessages (a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

function match (local, remote) {
  let i = 0
  let j = 0

  const map = new Array(remote.length)

  while (i < local.length && j < remote.length) {
    const l = local[i].name
    const r = remote[j]

    if (l < r) i++
    else if (l > r) j++
    else map[j++] = local[i++]
  }

  return map
}

MessagePair.Message = Message

module.exports = MessagePair
