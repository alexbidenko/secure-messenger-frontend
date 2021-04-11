import { User } from '~/types/user'

export enum MessageTypes {
  Message,
  Join,
  Disconnect,
}

type ContentType = Record<
  string,
  string | number | Record<string, string | number>[]
>

export class Message {
  content = {} as ContentType
  user = null as User | null
  userId = 0
  id = 0
  type = MessageTypes.Message

  constructor({
    content,
    userId,
    type,
  }: {
    content: ContentType
    userId: number
    type: MessageTypes
  }) {
    this.content = content
    this.userId = userId
    this.type = type
    this.id = Math.random()
  }

  toString() {
    return JSON.stringify({ ...this })
  }
}

export default class Frame {
  type: MessageTypes
  body: Message | { users: User[] }

  constructor({ type, body }: { type: MessageTypes; body: Message }) {
    this.type = type
    this.body = body
  }

  static parse(data: string): Frame {
    const content = JSON.parse(data) as Omit<Frame, 'body'> & { body: string }
    return new Frame({
      type: content.type,
      body: JSON.parse(content.body),
    })
  }
}
