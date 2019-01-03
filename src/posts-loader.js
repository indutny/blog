'use strict';

// TODO(indutny): esm
const posts = require('./posts').default;

module.exports = function() {
  return `export default ${ JSON.stringify(posts) }`;
}
