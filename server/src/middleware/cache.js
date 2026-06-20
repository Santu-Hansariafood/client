const store = new Map();
const MAX_CACHE_SIZE = 500;

function makeKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

export function cache(ttlSeconds = 30) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    const key = makeKey(req);
    const cached = store.get(key);
    const now = Date.now();
    
    if (cached) {
      // Check if expired
      if (cached.expireAt > now) {
        // LRU: move to end (most recently used)
        store.delete(key);
        store.set(key, cached);
        res.set("X-Cache", "HIT");
        return res.json(cached.payload);
      }
      // Remove expired entry
      store.delete(key);
    }
    
    const json = res.json.bind(res);
    res.json = (body) => {
      try {
        if (store.size >= MAX_CACHE_SIZE) {
          // LRU: remove first (least recently used)
          const firstKey = store.keys().next().value;
          store.delete(firstKey);
        }
        store.set(key, { payload: body, expireAt: now + ttlSeconds * 1000 });
      } catch {
        // ignore cache errors
      }
      res.set("X-Cache", "MISS");
      return json(body);
    };
    next();
  };
}

export function invalidate(prefix = "") {
  for (const key of store.keys()) {
    if (!prefix || key.includes(prefix)) {
      store.delete(key);
    }
  }
}
