export const extractUploadUrl = (payload) => {
  if (!payload) return null;

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed ? trimmed : null;
  }

  const candidates = [];

  const collect = (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) candidates.push(trimmed);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    if (value && typeof value === "object") {
      [
        "url",
        "fileUrl",
        "cloudUrl",
        "link",
        "downloadUrl",
        "publicUrl",
        "secure_url",
        "href",
        "src",
        "path",
      ].forEach((key) => collect(value[key]));

      [value.data, value.result, value.response, value.payload].forEach(
        collect,
      );
    }
  };

  collect(payload);

  const directUrl = candidates.find((candidate) =>
    /^https?:\/\//i.test(candidate),
  );
  if (directUrl) return directUrl;

  const extractedUrl = candidates
    .map((candidate) => {
      const match = candidate.match(/https?:\/\/[^")\]\s']+/i);
      return match ? match[0] : null;
    })
    .find(Boolean);

  if (extractedUrl) return extractedUrl;

  const stringified = JSON.stringify(payload || "");
  const jsonMatch = stringified.match(/https?:\/\/[^")\]\s']+/i);
  if (jsonMatch) return jsonMatch[0];

  return candidates[0] || null;
};
