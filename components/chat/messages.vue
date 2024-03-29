<template lang="pug">
#messages.px-2(
  ref='chat',
  style='overflow-y: scroll; height: 100%; overflow-x: hidden; padding-bottom: 82px'
)
  v-layout.mt-15(justify-center)
    v-layout.pa-4(
      v-if='messages.length == 0 && chat.type == "group"',
      column,
      align-center
    ) 
      img(src='@/assets/space-astronaut.png', style='height: 200px')
      span.mx-2 Esto está muy vacío por aquí
      .overline Es hora de escribir
  div(v-for='(message, i) in messages', :key='i')
    v-layout.my-1(justify-center)
      v-chip.my-4.font-weight-bold(
        v-if='i == 0 || !hasSameDay(messages[i - 1], message)',
        color='blue-grey lighten-3'
      ) {{ message.created_at | toDate }}
    v-layout(v-if='message.type == "info"', justify-center)
      v-chip.gray--text {{ message.text }}
    v-layout(v-else, align-end, :justify-end='isMe(message.author)')
      div(v-if='!isMe(message.author)', style='min-width: 42px')
        v-avatar(
          v-if='i + 1 >= messages.length || messages[i + 1].author != message.author',
          color='primary',
          size='36px',
          @click='$router.push({ path: "/" + message.profile.username })'
        )
          v-img(:src='message.profile.profile_picture')
      v-card.pa-3.rounded-xl(
        flat,
        :color='isMe(message.author) ? "secondary" : "background"',
        style='min-width: 200px; max-width: 80%'
      ) 
        v-layout(
          v-if='!isMe(message.author) && (i - 1 < 0 || messages[i - 1].author != message.author)',
          justify-space-between,
          align-center
        )
          .font-weight-bold.text-capitalize {{ message.profile.username }}
          //- .font-italic 500m
        img.ma-1.rounded-xl.mb-4.imageMessage(
          v-if='message.type == "image"',
          :src='message.src',
          @click='openImage(message.src)',
          style='width: 100%'
        )
        video.ma-1.rounded-xl.mb-4.imageMessage(
          v-else-if='message.type == "video"',
          preload='metadata',
          controls,
          :src='message.src',
          style='width: 100%'
        )
        post.my-2(
          v-else-if='message.type == "post"',
          grid,
          style='width: 100%',
          :content='{ ...message.post, profile: message.post.profile }'
        )
        audio-player(v-else-if='message.type == "audio"', :src='message.src')
        div(v-else-if='message.type == "event"')
          v-subheader EVENTO
          v-list-item(nuxt, :to='"/events/" + message.event.event_id')
            v-list-item-avatar(color='white')
              span(style='font-size: 2em') {{ message.event.emoji }}
            v-list-item-content
              v-list-item-title {{ message.event.title }}
              v-list-item-subtitle {{ message.event.start_date | toDateShort }}
        div(v-else-if='message.type == "chat"')
          v-subheader GRUPO
          v-list-item(nuxt, :to='"/group/" + message.chat.chat_id')
            v-list-item-avatar
              v-img(:src='message.chat.cover')
            v-list-item-content
              v-list-item-title {{ message.chat.title }}
              v-list-item-subtitle.text-truncate {{ message.chat.description }}
        p.mb-1(
          v-html='message.text',
          :style='isEmoji(message.text) ? "font-size: 3em" : ""'
        )
        v-layout(justify-end, align-end)
          .mx-2.font-weight-bold(style='font-size: 0.8em') {{ message.created_at | toHour }}
  v-badge(
    overlap,
    :value='!isBottom && newMessages != 0',
    :content='newMessages',
    style='position: absolute; bottom: 82px; right: 16px'
  )
    v-fab-transition
      v-btn(
        v-show='!isBottom',
        fab,
        small,
        depressed,
        color='white darken-1',
        @click='scrollToBottom'
      )
        v-icon(small) fas fa-chevron-down
  viewer(v-model='imageOpened', @click:outside='closeImage')
    v-layout(
      style='height: 100%; background-color: #000000c0',
      justify-center,
      align-center
    )
      v-btn(
        @click='closeImage',
        depressed,
        color='white',
        fab,
        style='position: absolute; top: 12px; right: 12px'
      )
        v-icon fas fa-times
      v-img(v-if='imageOpened', :src='imageSrc', style='width: 100%')
</template>

<script>
import audioPlayer from '@/components/chat/audioPlayer'
import camera from '@/components/editor/camera'
import post from '@/components/chat/post'
import date from '@/mixins/date'

export default {
  props: {
    nearby: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    audioPlayer,
    camera,
    post,
  },
  mixins: [date],
  data() {
    return {
      loadingMessages: false,
      imageOpened: '',
      imageSrc: '',
      isBottom: true,
    }
  },
  computed: {
    messages() {
      if (this.nearby) return this.$store.state.chat.nearbyMessages

      return this.$store.state.chat.messages
    },
    chat() {
      if (this.nearby) return { type: 'nearby' }
      return this.$store.state.chat.chat
    },
    allMessagesLoaded() {
      if (this.nearby) return false
      return this.$store.state.chat.allMessagesLoaded
    },
    newMessages: {
      get() {
        return this.$store.state.chat.newMessages
      },
      set(value) {
        this.$store.state.chat.newMessages = value
      },
    },
  },
  watch: {
    imageOpened(value) {
      if (!value) {
        this.$router.replace({ hash: '' })
      }
    },
    $route(route) {
      if (route.hash === '') {
        this.imageOpened = false
        this.imageSrc = ''
      }
    },
    isBottom(value) {
      if (value) this.newMessages = 0
    },
  },
  mounted() {
    const self = this
    // setTimeout(() => {
    //   self.$refs.chat.scrollTop = self.$refs.chat.scrollHeight
    //   self.$refs.chat.addEventListener('scroll', this.handleScroll)
    // }, 0)
    self.$refs.chat.scrollTop = self.$refs.chat.scrollHeight
    self.$refs.chat.addEventListener('scroll', this.handleScroll)
  },
  beforeDestroy() {
    this.$refs.chat.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    isEmoji(text) {
      return (
        typeof text === 'string' &&
        (text.length === 1 || text.length === 2) &&
        /\p{Extended_Pictographic}/u.test(text)
      )
    },
    isMe(userId) {
      return this.$store.state.auth.user.profile_id === userId
    },
    hasSameDay(first, second) {
      const secondsToDaysDivisor = 86400000
      const firstDate = new Date(first.created_at)
      const secondDate = new Date(second.created_at)
      return (
        Math.floor(firstDate.getTime() / secondsToDaysDivisor) ===
        Math.floor(secondDate.getTime() / secondsToDaysDivisor)
      )
    },
    scrollToBottom() {
      this.$refs.chat.scrollTop = this.$refs.chat.scrollHeight
    },
    async handleScroll() {
      this.isBottom =
        this.$refs.chat.scrollTop > this.$refs.chat.scrollHeight - 1000
      if (
        !this.allMessagesLoaded &&
        this.$refs.chat.scrollTop < 100 &&
        !this.loadingMessages
      ) {
        this.loadingMessages = true
        const bottomScroll =
          this.$refs.chat.scrollHeight - this.$refs.chat.scrollTop
        await this.$store.dispatch('chat/getMessages', {
          chatId: this.chat.chat_id,
        })
        setTimeout(() => {
          this.$refs.chat.scrollTop =
            this.$refs.chat.scrollHeight - bottomScroll
        }, 0)
        this.loadingMessages = false
      }
    },
    openImage(src) {
      this.imageOpened = true
      this.imageSrc = src
      this.$router.push({ hash: 'image' })
    },
    closeImage() {
      this.imageOpened = false
      this.$router.replace({ hash: '' })
    },
  },
}
</script>

