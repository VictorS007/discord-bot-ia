export function toTicketChannelName(username: string): string {
  const slug = username
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return `ticket-${slug || 'user'}-${Date.now().toString(36)}`.slice(0, 100);
}
