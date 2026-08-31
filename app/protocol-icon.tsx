type ProtocolIconProps = {
  name: string;
};

export default function ProtocolIcon({ name }: ProtocolIconProps) {
  return (
    <span className={`protocol-icon protocol-icon-${name}`} aria-hidden="true">
      {iconFor(name)}
    </span>
  );
}

function iconFor(name: string) {
  switch (name) {
    case "native":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M12 12v8M12 12 4.4 8.2M12 12l7.6-3.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 8.5v7M8.5 12h7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
