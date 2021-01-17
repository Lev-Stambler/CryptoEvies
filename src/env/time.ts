export function ethTimestampToDate(timestamp: string) {
  return new Date(
    parseInt(timestamp) * 1000
  )
}