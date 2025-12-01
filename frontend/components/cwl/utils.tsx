function getCurrentSeasonId(): string {
  const date = new Date();
  const year = date.getFullYear();
  // getMonth() parte da 0 (Gennaio = 0), quindi aggiungiamo 1.
  // padStart(2, '0') assicura che "5" diventi "05"
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
