import { isNil, isPlainObject } from "lodash";

type AddFn = (key: string, value: string | null) => void;

// Adapted from jQuery.param:
// https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
function buildParams(prefix: string, obj: unknown, addFn: AddFn) {
  if (Array.isArray(obj)) {
    // Serialize array item.
    for (let index = 0; index < obj.length; index++) {
      const value = obj[index] as string;
      if (/\[\]$/.test(prefix)) {
        // Treat each array item as a scalar.
        addFn(prefix, value);
      } else {
        // Item is non-scalar (array or object), encode its numeric index.
        buildParams(`${prefix}[${typeof value === "object" && value !== null ? index : ""}]`, value, addFn);
      }
    }
  } else if (typeof obj === "object" && obj) {
    // Serialize object item.
    for (const key of Object.keys(obj)) {
      const value = obj[key as never] as string;
      buildParams(`${prefix}[${key}]`, value, addFn);
    }
  } else {
    // Serialize scalar item.
    addFn(prefix, obj as string);
  }
}

export function objectToQueryParamString(obj: unknown): string {
  if (!isPlainObject(obj)) {
    return "";
  }

  const o = obj as object;

  const parts: string[] = [];
  const addFn: AddFn = (key, value) => {
    value = isNil(value) ? "" : value;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  };

  for (const key of Object.keys(o)) {
    const value = o[key as never];
    buildParams(key, value, addFn);
  }

  return parts.join("&").replace(/%20/g, "+");
}
