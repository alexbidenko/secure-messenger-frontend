import Vue from 'vue'

export default Vue.extend({
  data: () => ({
    channel: '',
  }),

  computed: {
    validation(): boolean {
      return !!this.channel && this.channelRule(this.channel) === true
    },
  },

  methods: {
    joinChannel() {
      if (!this.validation) return
      this.$router.push(`/${this.channel}`)
    },
    channelRule(value: string): boolean | string {
      return /^[A-Za-z]+$/.test(value) || 'Только символы латинского алфавита'
    },
  },
})
