// A person's round photo, or their initials until a photo is added (public/team/).
export function Avatar({person, className = 'size-12 text-sm'}) {
  // The name is always printed beside the avatar, so the image itself stays silent for screen readers.
  if (person.photo)
    return (
      <img
        src={person.photo}
        alt=""
        width="96"
        height="96"
        className={`shrink-0 rounded-full object-cover object-top ${className}`}
      />
    );
  const initials = person.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-rule font-medium ${className}`}
    >
      {initials}
    </span>
  );
}
