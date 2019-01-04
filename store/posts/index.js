import list from '~/src/posts';

export const state = () => ({
  list
});

export const getters = {
  hasPostWithSlug(state) {
    return slug => state.list.some(post => post.slug === slug);
  },
  getPostBySlug(state) {
    return slug => state.list.find(post => post.slug === slug);
  }
};
