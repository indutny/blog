<template>
  <section class="m-post-list">
    <h2>Recent posts:</h2>
    <ul>
      <li
        v-for="post in posts"
        :key="post.slug">
        <nuxt-link :to="`/${post.slug}/`">{{ post.title }}</nuxt-link>
        /
        {{ formatDate(post.date) }}
      </li>
    </ul>
  </section>
</template>

<script>
import { formatDate } from '~/src/common';

export default {
  computed: {
    posts() {
      return this.$store.state.posts.list;
    }
  },
  methods: { formatDate }
};
</script>
