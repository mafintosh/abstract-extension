const MessagePair = require('./')
const tape = require('tape')

tape('basic', function (t) {
  t.plan(4 * 3)

  const a = new MessagePair({
    onnamesupdate () {
      b.onnames(a.names())
    }
  })

  const b = new MessagePair({
    onnamesupdate () {
      a.onnames(b.names())
    }
  })

  const ma = a.add('b', {
    encoding: 'utf-8',
    onmessage (str) {
      t.same(str, 'to a')
    }
  })

  const mb = b.add('b', {
    encoding: 'utf-8',
    onmessage (str) {
      t.same(str, 'to b')
    }
  })

  t.same(ma.id, 0)
  t.same(mb.id, 0)
  b.onmessage(ma.id, ma.encode('to b'))
  a.onmessage(mb.id, mb.encode('to a'))

  a.add('a')

  t.same(ma.id, 1)
  t.same(mb.id, 0)
  b.onmessage(ma.id, ma.encode('to b'))
  a.onmessage(mb.id, mb.encode('to a'))

  b.add('c')

  t.same(ma.id, 1)
  t.same(mb.id, 0)
  b.onmessage(ma.id, ma.encode('to b'))
  a.onmessage(mb.id, mb.encode('to a'))
})

tape('extendable', function (t) {
  t.plan(3)

  class Extended extends MessagePair.Message {
    extended () {
      t.pass('was extended')
    }
  }

  const a = Extended.createMessagePair()
  const m = a.add('hello')

  t.ok(m instanceof Extended)
  t.ok(m instanceof MessagePair.Message)
  m.extended()
})
