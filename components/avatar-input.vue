<template lang="pug">
v-avatar.mr-2(v-if='!large', color='grey lighten-2', size='92')
  v-progress-circular(v-if='loading', indeterminate, color='grey')
  v-img(
    :src='src',
    gradient='to top right, rgba(240,21,77,.33), rgba(240,21,77,.7)'
  )
  v-icon.elevation-5(
    large,
    color='white',
    style='position: absolute; top: 0; left: 0; right: 0; bottom: 0'
  ) far fa-image
  input(
    @change='selectImage',
    type='file',
    style='opacity: 0; position: absolute; top: 0; bottom: 0; left: 0; right: 0'
  )
v-card.mr-2(
  v-else,
  color='grey lighten-2',
  flat,
  style='height: 140px; width: 100%'
)
  v-layout(align-center, justify-center, style='height: 100%; width: 100%')
    v-progress-circular(v-if='loading', indeterminate, color='grey')
    v-icon(v-else-if='src.length == 0', large) far fa-image
    img(
      v-else,
      :src='src',
      style='height: 140px; width: 100%; object-fit: contain'
    )
  input(
    @change='selectImage',
    type='file',
    style='opacity: 0; position: absolute; top: 0; bottom: 0; left: 0; right: 0'
  )
</template>

<script>
export default {
  props: {
    large: {
      type: Boolean,
      default: false,
    },
    preview: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      src: '',
      loading: false,
    }
  },
  mounted() {
    if (this.preview.length !== 0) {
      this.src = this.preview
    }
  },
  methods: {
    async selectImage({ target }) {
      this.loading = true
      const data = await this.$store.dispatch(
        'storage/uploadProfilePicture',
        target.files[0]
      )
      this.src = data.location
      this.$emit('update', data.location)
      this.loading = false
    },
  },
}
</script>
