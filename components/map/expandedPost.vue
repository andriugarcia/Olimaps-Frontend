<template lang="pug">
#expanded(
  :style='$vuetify.breakpoint.mdAndUp ? "height: 90vh" : "height: 100%"'
)
  v-card.rounded-lg(color='black', style='height: 100%')
    image-map(v-if='type == "image"', expanded, :content='content')
    short-map(v-else-if='type == "short"', :content='content', expanded)
    video-map(v-else-if='type == "video"', expanded, :content='content')
    audio-map(v-else-if='type == "audio"', expanded, :content='content')
    .pb-4(
      style='position: absolute; bottom: 0px; left: 0; right: 0; z-index: 300000000'
    )
      v-layout(justify-space-between, style='width: 100%', align-end)
        .mb-4.ml-4(:class='{ "white--text": type != "short" }')
          .ml-2
            span.font-weight-bold.mr-2 {{ content.username || content.profile.username }}
            span {{ content.created_at | toRelativeDate }}
          p.pa-2.py-2(
            v-if='type != "short" && content.text.length != 0',
            v-html='content.text'
          )
        .mr-2
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
              v-icon(style='display: block') {{ content.is_liked ? "fas" : "far" }} fa-heart
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
      v-layout.px-2(
        v-if='!authenticated || content.profile_id != user.profile_id',
        align-center,
        justify-space-between
      )
        v-text-field(
          ref='replyTextField',
          v-model='message.text',
          rounded,
          outlined,
          @keydown.enter='replyMessage',
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
import imageMap from './image.vue'
import shortMap from './short.vue'
import videoMap from './video.vue'
import audioMap from './audio.vue'
import groupMap from './group.vue'

export default {
  mixins: [dateMixin, numberMixin],
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
      shareDialog: false,
      message: {
        userId: '',
        src: null,
        post_ref: '',
        text: '',
        type: 'post',
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
  watch: {
    $route(route) {
      if (route.hash === '#' + this.content.post_id) {
        this.shareDialog = false
      }
    },
  },
  methods: {
    async replyMessage() {
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
    openShare() {
      this.shareDialog = true
      this.$router.push({ hash: 'share' })
    },
    closePost() {
      this.$emit('back')
    },
  },
}
</script>