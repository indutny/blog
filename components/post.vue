<template>
  <section
    class="m-post">
    <button
      class="votewdgt"
      title="upvote">
      ?
    </button>
    <h1>{{ post.title }}</h1>
    <h4><b-badge variant="info">{{ formatDate(post.date) }}</b-badge></h4>
    <span
      class="m-post-content"
      v-html="post.html"/>
    <template v-if="post.scripts">
      <script
        v-for="(script, i) in post.scripts"
        :key="`post-script-${i}`"
        :src="script"
        async/>
    </template>
  </section>
</template>

<script>
import { formatDate } from '~/src/common';
import 'highlight.js/styles/github.css';
import '~/assets/css/vote-wdgt.css';

export default {
  props: { post: { type: Object, required: true } },
  methods: { formatDate }
};
</script>

<style>
.m-post .m-post-content pre {
  border: 1px solid #ddd;
}

.m-post img {
  max-width: 100%;
  height: auto;
}
</style>
