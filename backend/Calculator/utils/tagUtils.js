function transformTag(tag) {
  let transformedTag = encodeURIComponent("#" + tag);
  return transformedTag;
}

module.exports = {
  transformTag,
};
