/**
 * Chuẩn hóa các định dạng URL video YouTube (watch, share youtu.be, shorts, embed)
 * thành đường dẫn iframe nhúng an toàn, bảo vệ quyền riêng tư (youtube-nocookie.com)
 */
export function formatYouTubeEmbedUrl(inputUrl?: string | null): string {
  const fallback = 'https://www.youtube-nocookie.com/embed/n4sM0fK6n8A?autoplay=1';
  if (!inputUrl || !inputUrl.trim()) return fallback;
  const url = inputUrl.trim();

  // Đã là link embed thì chỉ cần bổ sung autoplay=1 nếu chưa có
  if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
    if (!url.includes('autoplay=1')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}autoplay=1`;
    }
    return url;
  }

  // Bắt video ID từ watch?v=..., youtu.be/..., shorts/...
  const watchMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?autoplay=1`;
  }

  // Trường hợp người dùng nhập trực tiếp ID video (11 ký tự)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return `https://www.youtube-nocookie.com/embed/${url}?autoplay=1`;
  }

  return url;
}
