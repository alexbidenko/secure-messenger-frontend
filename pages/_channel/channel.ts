import Vue from 'vue'
import Frame, { Message, MessageTypes } from '~/types/message'
import { clear, record, stop } from '~/types/recorder'
import readAudioFromFrame from '~/scripts/readAudioFromFrame'

type AlertType = {
  id: number
  snackbar: boolean
  text: string
  timeout: number
}

export default Vue.extend({
  name: 'Channel',

  data: () => ({
    message: '',
    ws: null as WebSocket | null,
    frames: [] as Frame[],
    userId: +Math.random().toString().slice(2),
    name: '',
    alerts: [] as AlertType[],
    voice: false,
    // @ts-ignore
    recorder: null as any,
    data: [] as Blob[],
  }),

  computed: {
    users() {
      return this.$store.state.UsersModule.users
    },
    voiceAvailable() {
      return typeof navigator !== 'undefined' && 'mediaDevices' in navigator
    },
  },

  watch: {
    alerts(val: AlertType[]) {
      if (val.some((el) => !el.snackbar))
        this.alerts = this.alerts.filter((el) => el.snackbar)
    },
    frames() {
      if (
        Math.abs(
          document.body.scrollHeight - window.innerHeight - window.scrollY
        ) < 10
      )
        this.$nextTick(() => window.scrollTo(0, document.body.scrollHeight))
    },
    voice(val: boolean) {
      if (val !== undefined) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          clear()
          const [recorder, data] = record(stream)
          this.recorder = recorder
          // @ts-ignore
          this.data = data
        })
      } else {
        this.recorder.current.onstop = () => {
          new Response(this.data[0]).arrayBuffer().then((r) => {
            this.ws?.send(
              new Message({
                content: {
                  // @ts-ignore
                  audio: String.fromCharCode.apply(null, new Uint8Array(r)),
                },
                userId: this.userId,
                type: MessageTypes.Message,
              }).toString()
            )
          })
        }
        stop()
      }
    },
  },

  mounted() {
    this.name = prompt('Введите ваше имя:') || ''
    if (!this.name) this.$router.push('/')

    this.ws = new WebSocket(
      `${process.env.WEBSOCKET_URL}/chat/${this.$route.params.channel}`
    )
    this.ws.onclose = () => {
      this.ws = null
    }
    this.ws.onmessage = (e: MessageEvent) => {
      const frame = Frame.parse(e.data)
      if (frame.type === MessageTypes.Message) {
        if ('content' in frame.body && 'message' in frame.body.content)
          this.frames.push(frame)
        else if ('content' in frame.body && 'audio' in frame.body.content) {
          frame.body.content.audio = readAudioFromFrame(
            frame.body.content.audio as string
          )
          this.frames.push(frame)
        }
      } else {
        if ('users' in frame.body) {
          this.$store.commit('UsersModule/setUser', frame.body.users)
        }
        const user = this.users.slice(-1)[0]
        if (user && user.id !== this.userId) {
          this.alerts.push({
            id: Math.random(),
            snackbar: true,
            text:
              frame.type === MessageTypes.Join
                ? `К каналу присоединился новый пользователь ${user.name}`
                : 'Пользователь покинул канал',
            timeout: 3000,
          })
        }
      }
    }
    this.ws.onopen = () => {
      this.ws!.send(
        new Message({
          content: { name: this.name, id: this.userId },
          userId: this.userId,
          type: MessageTypes.Join,
        }).toString()
      )
    }
  },

  beforeDestroy() {
    this.ws?.close()
  },

  methods: {
    sendMessage() {
      if (!this.message) return
      this.ws?.send(
        new Message({
          content: { message: this.message.trim() },
          userId: this.userId,
          type: MessageTypes.Message,
        }).toString()
      )
      this.message = ''
      const input = this.$refs.input as HTMLTextAreaElement
      input.focus()
    },
  },
})
