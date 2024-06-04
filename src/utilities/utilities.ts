import { isBoolean } from "lodash";

export const roundTo = (num: number, precision: number): number => {
  const factor = Math.pow(10, precision)
  return Math.round(num * factor) / factor
}

export const getIsoDate = (dateStr: string): string => {
  const year = dateStr.substring(6, 10);
  const yearValue = parseInt(year);
  const month = dateStr.substring(0, 2);
  const monthIndex = parseInt(month) - 1;
  const day = dateStr.substring(3, 5);
  const dayValue = parseInt(day);
  const date = new Date(yearValue, monthIndex, dayValue);
  return date.toISOString();
}

export function isValidDate(dateString: string): boolean {
  // Check if the string can be parsed into a date
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return false;
  }

  // Additional check to ensure the parsed date matches the input string
  // This prevents cases where invalid dates like "2023-02-30" are parsed as valid dates
  const [month, day, year] = dateString.split('/').map(Number);

  if (year !== date.getFullYear() || month !== (date.getMonth() + 1) || day !== date.getDate()) {
    return false;
  }

  return true;
}

export const isEmptyLine = (lineOfInput: any[]): boolean => {
  const columnValues: any[] = Object.values(lineOfInput);
  for (const columnValue of columnValues) {
    if (!isBoolean(columnValue)) {
      return false;
    }
  }
  return true;
}


