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
    case "vless":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M14 7l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="6.5" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "vmess":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect
            x="3.5"
            y="5.5"
            width="17"
            height="13"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M7 12h3l1.5-3 2 6L15 12h2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "trojan":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 11V8.5a4 4 0 0 1 8 0V11"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <rect
            x="6"
            y="11"
            width="12"
            height="9"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
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
