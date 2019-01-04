<template>
  <m-post :post="post"/>
</template>

<script>
import mPost from '~/components/post.vue';

export default {
  components: { mPost },
  middleware: 'force-dir',

  validate({ store, params }) {
    return store.getters['posts/hasPostWithSlug'](params.slug);
  },

  asyncData({ store, params }) {
    const post = store.getters['posts/getPostBySlug'](params.slug);
    return { post };
  },

  head() {
    return { title: this.post.title };
  }
};
</script>

<style>
</style>
