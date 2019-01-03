const MONTH = 'Jan:Feb:Mar:Apr:May:Jun:Jul:Aug:Sep:Oct:Nov:Dec'.split(':');

export function formatDate(string) {
  const date = new Date(string);
  return `${date.getDay()} ${MONTH[date.getMonth()]} ${date.getFullYear()}`;
}
