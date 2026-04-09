const store = new Map();

function makeKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

export function cache(ttlSeconds = 30) {
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    const key = makeKey(req);
    const cached = store.get(key);
    const now = Date.now();
    if (cached && cached.expireAt > now) {
      res.set("X-Cache", "HIT");
      return res.json(cached.payload);
    }
    const json = res.json.bind(res);
    res.json = (body) => {
      try {
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
