const getBrokerageSummaryFilename = (partyName, type, extension) => {
  const fallbackName = type === "buyer" ? "All_Buyers" : "All_Sellers";
  const sanitizedPartyName = Array.from(partyName || fallbackName, (character) =>
    /[<>:"/\\|?*]/.test(character) || character.charCodeAt(0) < 32
      ? "_"
      : character,
  )
    .join("")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[. ]+$/g, "");
  const safePartyName = sanitizedPartyName || fallbackName;
  const reportType = type === "buyer" ? "Buyer" : "Seller";
  const date = new Date().toISOString().split("T")[0];

  return `${safePartyName}_${reportType}_Brokerage_Summary_${date}.${extension}`;
};

export default getBrokerageSummaryFilename;
