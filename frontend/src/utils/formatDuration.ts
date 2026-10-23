/**
 * Formats video duration in seconds to an exact, human-readable string.
 * Examples:
 *   45 -> "45s"
 *   84 -> "1m 24s"
 *   600 -> "10 mins"
 *   3665 -> "1h 1m 5s"
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) {
    return '0s';
  }
  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m ` : ''}${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} mins`;
  }
  return `${secs}s`;
}
