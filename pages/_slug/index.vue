<template>
  <m-post :post="post"/>
</template>

<script>
import mPost from '~/components/post.vue';
import posts from '~/src/posts';

export default {
  components: { mPost },
  middleware: 'force-dir',

  validate({ params }) {
    return posts.some(post => post.slug === params.slug);
  },

  asyncData({ params }) {
    let match;
    const found = posts.some(post => {
      if (post.slug === params.slug) {
        match = post;
        return true;
      }
      return false;
    });
    if (!found) {
      throw new Error('Post not found');
    }

    return { post: match };
  },

  head: () => {
    return {
      script: [{ src: 'https://vote.wdgt.io/cdn/snippet-v2.js', defer: '' }]
    };
  }
};
</script>

<style>
</style>
