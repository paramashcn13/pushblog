import { useState } from 'react';
import { getImageUrl } from '../api/client';

export default function UserAvatar({ user, alt = '' }) {
  const username = user?.username || '';
  const imageUrl = getImageUrl(user?.avatar_url);
  const [failedImageUrl, setFailedImageUrl] = useState('');

  if (imageUrl && failedImageUrl !== imageUrl) {
    return (
      <img
        className="user-avatar-image"
        src={imageUrl}
        alt={alt}
        onError={() => setFailedImageUrl(imageUrl)}
      />
    );
  }

  return (
    <span className="user-avatar-fallback" aria-hidden="true">
      {username.charAt(0).toUpperCase() || '?'}
    </span>
  );
}
