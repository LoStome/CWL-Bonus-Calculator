function standardizeTag(tag) {
  return tag.replace("#", "");
}

function transformTag(tag) {
  if (tag.startsWith("#")) {
    tag = standardizeTag(tag);
  }

  let transformedTag = encodeURIComponent("#" + tag);
  return transformedTag;
}

module.exports = {
  transformTag,
  standardizeTag,
};
