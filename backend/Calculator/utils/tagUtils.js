function standardizeTag(tag) {
  //if tag is null or not a string return empty string
  if (!tag || typeof tag !== "string") {
    return "";
  }

  return tag.replace("#", "");
}

function transformTag(tag) {
  if (tag.startsWith("#")) {
    //removes all "#"
    tag = standardizeTag(tag);
  }

  if (!tag) return "";

  let transformedTag = encodeURIComponent("#" + tag);
  return transformedTag;
}

module.exports = {
  transformTag,
  standardizeTag,
};
