<template lang="pug">
#expanded(
  :style='$vuetify.breakpoint.mdAndUp ? "height: 90vh" : "height: 100%"'
)
  v-sheet(
    color='black',
    style='height: 100%; position: relative',
    @click='likeDoubleTap()'
  )
    image-map(v-if='type == "image"', expanded, :content='content')
    short-map(v-else-if='type == "short"', :content='content', expanded)
    video-map(v-else-if='type == "video"', expanded, :content='content')
    audio-map(v-else-if='type == "audio"', expanded, :content='content')
    transition(name='fadescale')
      v-icon.red--text(
        v-show='heart.rendered',
        size='120',
        style='position: absolute; top: calc(50% - 60px); left: calc(50% - 60px)'
      ) fas fa-heart
    v-btn(
      icon,
      :dark='type != "short"',
      style='position: absolute; top: 18px; right: 18px',
      @click='$emit("back")'
    )
      v-icon fas fa-chevron-down
    div(
      style='position: absolute; bottom: 0px; left: 0; right: 0; z-index: 300000000'
    )
      v-layout(justify-space-between, style='width: 100%', align-end)
        .mb-4.ml-4(:class='{ "white--text": type != "short" }')
          v-card.px-3.py-1.my-2.rounded-lg(
            v-if='getEvent()',
            outlined,
            @click='$router.push({ path: "/events/" + getEvent().event_id })'
          )
            span {{ getEvent().emoji }} {{ getEvent().title }}
          .ml-2
            span.font-weight-bold.mr-2(
              :class='{ "letter-shadow": type != "short" }'
            ) {{ content.username || content.profile.username }}
            span(:class='{ "letter-shadow": type != "short" }') {{ content.created_at | toRelativeDate }}
          p.pa-2.py-2.font-weight-medium(
            v-if='type != "short" && content.text.length != 0',
            :class='{ "letter-shadow": type != "short" }',
            v-html='content.text'
          )
        .mr-2(v-if='!content.info')
          v-btn.mb-4(
            fab,
            color='primary',
            @click='$router.push({ path: `/${content.username || content.profile.username}` })'
          )
            v-avatar(color='white')
              v-img(
                :src='content.profile_picture || content.profile.profile_picture'
              )
          v-card.mb-4(
            color='transparent',
            :dark='type != "short"',
            flat,
            @click='like'
          )
            v-layout(column, align-center)
              v-icon(style='display: block') {{ content.is_liked === true ? "fas" : "far" }} fa-heart
              span {{ content.likes }}
          v-card.mb-4(
            color='transparent',
            flat,
            :dark='type != "short"',
            @click='openShare'
          )
            v-layout(column, align-center)
              v-icon(style='display: block') fas fa-share-alt
              span {{ content.shared }}
          v-card.mb-4(
            color='transparent',
            flat,
            :dark='type != "short"',
            @click='mark'
          )
            v-layout(column, align-center)
              v-icon(style='display: block') {{ content.is_saved === true ? "fas" : "far" }} fa-bookmark
              span {{ content.saved }}
      v-layout.px-2.pb-2(
        v-if='(!authenticated || content.profile_id != user.profile_id) && !content.info',
        align-center,
        justify-space-between
      )
        v-text-field(
          ref='replyTextField',
          v-model='message.text',
          rounded,
          outlined,
          @keydown.enter='replyMessage',
          @focus='$emit("focused")',
          @blur='$emit("blured")',
          :dark='type != "short"',
          placeholder='Contesta este post',
          color='primary',
          hide-details
        )
        v-btn.mx-2(
          icon,
          :disabled='!message.text',
          :dark='type != "short"',
          @click='replyMessage'
        )
          v-icon far fa-paper-plane
      //- v-layout(v-else)
        v-btn.mb-8(rounded, outlined, :dark="type != 'short'")
          span Hacer Permanente
          v-icon.ml-2 far fa-snowflake
    //- v-layout(justify-center)
      v-btn.pb-6.pt-8(color="yellow", @click="closePost", style="border-radius: 0 0 48px 48px;")
        v-icon.black--text.mb-4 fas fa-times
  v-bottom-sheet(v-model='shareDialog', :inset='$vuetify.breakpoint.mdAndUp')
    share(:post='content', @back='shareDialog = false')
</template>

<script>
import dateMixin from '@/mixins/date'
import numberMixin from '@/mixins/number'
import loginMixin from '@/mixins/login'
import imageMap from './image.vue'
import shortMap from './short.vue'
import videoMap from './video.vue'
import audioMap from './audio.vue'
import groupMap from './group.vue'

export default {
  mixins: [dateMixin, numberMixin, loginMixin],
  components: {
    imageMap,
    shortMap,
    videoMap,
    audioMap,
    groupMap,
    share: () => import('./share.vue'),
  },
  props: {
    type: {
      type: String,
      default: 'none',
    },
    content: {
      type: Object,
      default: () => ({}),
    },
    grid: Boolean,
  },
  data() {
    return {
      taps: 0,
      shareDialog: false,
      message: {
        userId: '',
        src: null,
        post_ref: '',
        text: '',
        type: 'post',
      },
      heart: {
        rendered: false,
        active: false,
      },
    }
  },
  mounted() {
    this.$store.dispatch('post/openPost', this.content.post_id)
  },
  computed: {
    user() {
      return this.$store.state.auth.user
    },
    authenticated() {
      return this.$store.getters['auth/authenticated']
    },
  },
  methods: {
    mark() {
      if (this.openLoginIfNotAuthenticated()) return
      if (this.content.is_saved) {
        this.$store.dispatch('post/unsave', this.content.post_id)
        this.content.saved -= 1
        this.content.is_saved = false
      } else {
        this.$store.dispatch('post/save', this.content.post_id)
        this.content.saved += 1
        this.content.is_saved = true
      }
    },
    likeDoubleTap() {
      this.taps++
      if (this.taps === 1) {
        this.timer = setTimeout(() => {
          this.taps = 0
        }, 400)
      } else {
        if (this.openLoginIfNotAuthenticated()) return
        clearTimeout(this.timer)
        this.enableHeartAnimation()
        if (!this.content.is_liked) {
          this.$store.dispatch('post/like', this.content.post_id)
          this.content.likes += 1
          this.content.is_liked = true
        }
        this.taps = 0
      }
    },
    enableHeartAnimation() {
      this.heart.rendered = true
      setTimeout(() => {
        this.heart.rendered = false
      }, 500)
    },
    async replyMessage(text) {
      if (typeof text === 'string') {
        this.message.text = text
      }
      if (this.openLoginIfNotAuthenticated()) return
      this.message.userId = this.content.profile_id
      this.message.post_ref = this.content.post_id
      await this.$store.dispatch('chat/createMessage', this.message)
      this.$store.commit('setPostCreated', true)
      this.message.userId = ''
      this.message.post_ref = ''
      this.message.text = ''

      this.$refs.replyTextField.blur()
    },
    like() {
      if (this.openLoginIfNotAuthenticated()) return
      if (this.content.is_liked) {
        this.$store.dispatch('post/dislike', this.content.post_id)
        this.content.likes -= 1
        this.content.is_liked = false
      } else {
        this.$store.dispatch('post/like', this.content.post_id)
        this.content.likes += 1
        this.content.is_liked = true
      }
    },
    getEvent() {
      if (this.content.event_id) {
        return {
          event_id: this.content.event_id,
          emoji: this.content.emoji,
          title: this.content.title,
        }
      } else if (typeof this.content.event_eventTopost_event !== 'undefined') {
        return this.content.event_eventTopost_event
      } else {
        return null
      }
    },
    openShare() {
      this.shareDialog = true
    },
    closePost() {
      this.$emit('back')
    },
  },
}
</script>

<style lang="scss" scoped>
.letter-shadow {
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
}

.fadescale-enter {
  transition: all 0.05s ease-in;
  opacity: 0;
  transform: scale(0.9);
}
.fadescale-enter-to {
  opacity: 100;
  transform: scale(1);
}

.fadescale-leave {
  opacity: 100;
  transform: scale(1);
}
.fadescale-leave-to {
  opacity: 0;
}
</style>
