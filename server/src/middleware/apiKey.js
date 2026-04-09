export default function apiKey(req, res, next) {
  const headerKey = req.header("x-api-key");
  const queryKey = req.query.api_key;
  const apiKey = headerKey || queryKey;
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: "Invalid API key" });
  }
  next();
}
