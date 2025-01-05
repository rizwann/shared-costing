export const convertToISO8601 = (utcDate: string, timeZone: string = "Europe/Berlin"): string => {
        const date = new Date(utcDate);
      
        const options: Intl.DateTimeFormatOptions = {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        };
      
        const formatter = new Intl.DateTimeFormat("en-US", options);
        const parts = formatter.formatToParts(date);
      
        const year = parts.find(part => part.type === "year")?.value || "";
        const month = parts.find(part => part.type === "month")?.value || "";
        const day = parts.find(part => part.type === "day")?.value || "";
        const hour = parts.find(part => part.type === "hour")?.value || "";
        const minute = parts.find(part => part.type === "minute")?.value || "";
        const second = parts.find(part => part.type === "second")?.value || "";
      
        // Ensure midnight is handled correctly
        const validHour = hour === "24" ? "00" : hour;
      
        // Calculate timezone offset
        const timezoneDate = new Date(
          date.toLocaleString("en-US", { timeZone })
        );
        const offsetMinutes = timezoneDate.getTimezoneOffset();
        const offsetHours = Math.abs(Math.floor(offsetMinutes / 60)).toString().padStart(2, "0");
        const offsetMins = Math.abs(offsetMinutes % 60).toString().padStart(2, "0");
        const offsetSign = offsetMinutes <= 0 ? "+" : "-";
      
        return `${year}-${month}-${day}T${validHour}:${minute}:${second}${offsetSign}${offsetHours}:${offsetMins}`;
      };
      
      // Example usage
      const utcDate = "2024-12-31T23:05:00.000Z";
      console.log(convertToISO8601(utcDate, "Europe/Berlin"));
      // Output: 2025-01-01T00:05:00+01:00
      

export const monthsOfTheYear = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]