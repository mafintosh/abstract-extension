# message-pair

Small module to implement a "message name to id" pairing protocol, useful for implementing stuff like user defined messages
in an RPC system without having to send over the full message name every time.

... you probably don't need this :)

```
npm install message-pair
```

## Usage

``` js
const MessagePair = require('message-pair')

const messages = new MessagePair()

const m = messages.add('message-name', {
  onmessage (message) {
    console.log('received message', message)
  }
})

// local id of this message is 0
console.log('local id of this message is', m.id)

const another = new MessagePair()

// add as many messages as you want
another.add('another-message-name')
const n = another.add('message-name')

// remote id of "message-name" is 1
console.log('remote id of this message is', n.id)

// pair the two by exchanging the message names once
messages.onnames(another.names())

// then pass the id and message
// will trigger m.onmessage
messages.onmessage(n.id, n.encode('hi'))
```

## API

#### `const messages = new MessagePair(handlers)`

Create a new MessagePair instance.

Whenever the messages are updated `handler.onnamesupdate()` will
be called if provided.

#### `const msg = messages.add(name, handlers)`

Add a new message. `name` should be the string name of a message.

* `handlers.encoding` is an optional encoding for the message payload. Can be either `json`, `utf-8`, `binary` or any abstract encoding.
* `handlers.onmessage(message, context)` is called when a message has been received and pairing.
* `handlers.onerror(error, context)` is called when a message fails to decode.

#### `msg.destroy()`

Removes the message from the pairing instance.

#### `msg.id`

The local id of the message. Send this over the wire instead of the message name after exchanging the initial message names.

#### `const buffer = msg.encode(message)`

Encode a message to a buffer based on the message encoding.

#### `messages.onmessage(remoteId, message, [context])`

Call this when you receive a message. Will match the remoteId internally and call the relevant `msg.onmessage` handler
with the decoded message.

#### `const list = messages.names()`

Returns a sorted list of message names. You need to pass this to another pairing instance somehow.

#### `messages.onnames(remoteNames)`

Call this with the remote list of names.

## License

MIT
