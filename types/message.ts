export enum MessageTypes {
  Message,
  Join,
  Disconnect,
}

export class Message {
  content = ''
  userId = 0
  id = 0

  constructor({ content, userId }: { content: string; userId: number }) {
    this.content = content
    this.userId = userId
    this.id = Math.random()
  }

  toString() {
    return JSON.stringify({ ...this })
  }
}

export default class Frame {
  type: MessageTypes
  body: Message | null

  constructor({ type, body }: { type: MessageTypes; body: Message }) {
    this.type = type
    this.body = body
  }

  static parse(data: string): Frame {
    const content = JSON.parse(data) as Omit<Frame, 'body'> & { body: string }
    return new Frame({
      type: content.type,
      body:
        content.type === MessageTypes.Message ? JSON.parse(content.body) : null,
    })
  }
}
