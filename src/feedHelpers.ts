export function parseTUMDate(inputStr: string) {
  if (inputStr.includes("-")) {
    // Handling date range
    let [startDateStr, endDateStr] = inputStr.split("-");
    startDateStr = startDateStr.trim() + "," + inputStr.split(",")[1];
    const startDate = new Date(startDateStr);
    return startDate;
  } else {
    // Handling single date
    const dateStr = inputStr.split(",")[0] + "," + inputStr.split(",")[1];
    const date = new Date(dateStr.trim());
    return date;
  }
}
