import Vue from 'vue'
import Frame, { Message, MessageTypes } from '~/types/message'

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
  }),

  computed: {
    users() {
      return this.$store.state.UsersModule.users
    },
  },

  watch: {
    alerts(val: AlertType[]) {
      if (val.some((el) => !el.snackbar))
        this.alerts = this.alerts.filter((el) => el.snackbar)
    },
    frames() {
      if (window.scrollY === document.body.scrollHeight - window.innerHeight)
        this.$nextTick(() => window.scrollTo(0, document.body.scrollHeight))
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
      if (frame.type === MessageTypes.Message) this.frames.push(frame)
      else {
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
    },
  },
})
