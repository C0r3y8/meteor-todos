// JsPerf
/**
 * @function jsperfFilter
 * @param {Function} fn
 */
export function jsperfFilter(fn) {
  const arr = this;
  const len = arr.length;
  const res = [];

  let i;

  for (i = 0; i < len; i++) {
    if (fn(arr[ i ])) {
      res.push(arr[ i ]);
    }
  }
  return res;
}

/**
 * @function jsperfFind
 * @param {Function} fn
 */
export function jsperfFind(fn) {
  const arr = this;
  const len = arr.length;

  let i;

  for (i = 0; i < len; i++) {
    if (fn(arr[ i ], i)) {
      return arr[ i ];
    }
  }
  return null;
}

/**
 * @function jsperfForEach
 * @param {Function} fn
 */
export function jsperfForEach(fn) {
  const arr = this;
  const len = arr.length;

  let i;

  for (i = 0; i < len; i++) {
    fn(arr[ i ], i);
  }
}
