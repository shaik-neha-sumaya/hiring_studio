const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icon = (paths) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {paths}
      </svg>
    );
  };

export const IconDashboard = icon(
  <>
    <rect x="3" y="3" width="7" height="8" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="11" width="7" height="10" rx="1.5" />
  </>,
);

export const IconSpark = icon(
  <>
    <path d="M12 3l1.7 4.6L18.5 9l-4.8 1.4L12 15l-1.7-4.6L5.5 9l4.8-1.4z" />
    <path d="M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" />
  </>,
);

export const IconUsers = icon(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
    <path d="M16 5.2a3 3 0 010 5.6M17.5 20c0-2.2-.8-3.9-2-5" />
  </>,
);

export const IconScale = icon(
  <>
    <path d="M12 4v16M7 8h10" />
    <path d="M4 14l3-6 3 6a3 3 0 01-6 0zM14 14l3-6 3 6a3 3 0 01-6 0z" />
  </>,
);

export const IconBook = icon(
  <>
    <path d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5z" />
    <path d="M20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5A1.5 1.5 0 0020 18.5z" />
  </>,
);

export const IconPlus = icon(<path d="M12 5v14M5 12h14" />);
export const IconCheck = icon(<path d="M4.5 12.5l5 5 10-11" />);
export const IconArrowRight = icon(<path d="M4 12h15m-6-6l6 6-6 6" />);
export const IconArrowLeft = icon(<path d="M20 12H5m6 6l-6-6 6-6" />);
export const IconTrash = icon(
  <>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </>,
);
export const IconUpload = icon(
  <>
    <path d="M12 16V4m-5 5l5-5 5 5" />
    <path d="M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" />
  </>,
);
export const IconDoc = icon(
  <>
    <path d="M6 3h7l5 5v13H6z" />
    <path d="M13 3v5h5M9 13h6M9 17h6" />
  </>,
);
export const IconAlert = icon(
  <>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17h.01" />
  </>,
);
export const IconInfo = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);
export const IconLogout = icon(
  <>
    <path d="M14 4h4.5A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5H14" />
    <path d="M10 8l-4 4 4 4M6 12h8" />
  </>,
);
export const IconTarget = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </>,
);
export const IconLink = icon(
  <>
    <path d="M10.5 13.5a3.5 3.5 0 005 0l3-3a3.5 3.5 0 10-5-5l-1 1" />
    <path d="M13.5 10.5a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 105 5l1-1" />
  </>,
);
