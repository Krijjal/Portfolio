/**
 * Parses a stat value like "+60%" or "#2" into a countable {prefix, target, suffix}.
 * Returns null for non-numeric labels ("Production grade", "Clear") so those render as static text.
 */
export function parseCountable(value) {
  const match = /^([+#-]?)(\d+(?:\.\d+)?)(%?)$/.exec(String(value).trim());
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  return {
    prefix,
    suffix,
    target: parseFloat(numStr),
    decimals: numStr.includes(".") ? numStr.split(".")[1].length : 0,
  };
}
