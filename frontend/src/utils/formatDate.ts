import moment from "moment";

export function formatDate(date: string | Date, format = "MMM D, YYYY"): string {
  return moment(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return moment(date).format("MMM D, YYYY · h:mm A");
}

export function daysUntil(date: string | Date): number {
  return moment(date).diff(moment(), "days");
}

export function relativeTime(date: string | Date): string {
  return moment(date).fromNow();
}