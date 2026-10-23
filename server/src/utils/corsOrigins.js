export const getConfiguredCorsOrigins = () =>
  new Set(
    (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin && origin !== "*"),
  );

export const isTrustedRequestOrigin = (origin, requestOrigin, allowedOrigins) =>
  !origin || origin === requestOrigin || allowedOrigins.has(origin);
