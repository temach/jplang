
/**
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @return {number}
 */
function volume(width, height, depth) {
  var area = width*height;
  return area*depth;
}

/**
 * @param {number} side1
 * @param {number} side2
 * @param {number} side3
 * @return {number}
 */
function trianglePerimeter(side1, side2, side3) {
  return side1+side2+side3;
}

/**
 * @param {string} text
 * @return {string}
 */
function print(text) {
  return "Text" + text;
}
