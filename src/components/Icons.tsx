import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 18,
  height: 18,
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props} fill="currentColor" stroke="none">
      <path d="M8 5.4v13.2a.9.9 0 0 0 1.37.77l10.1-6.6a.9.9 0 0 0 0-1.54l-10.1-6.6A.9.9 0 0 0 8 5.4Z" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props} fill="currentColor" stroke="none">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
    </svg>
  )
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.6v5.6M12 7.6v.1" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9v.09a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 .91Z" />
    </svg>
  )
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="6" height="15" rx="1.6" />
      <rect x="11.5" y="4.5" width="4.4" height="15" rx="1.4" />
      <path d="m18.2 5.6 2.2 13.2a1.4 1.4 0 0 1-1.15 1.6l-.7.1" />
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.2 10.6 12 4l7.8 6.6" />
      <path d="M6.2 9.4V20h11.6V9.4" />
      <path d="M9.8 20v-5.2h4.4V20" />
    </svg>
  )
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.4" y="4" width="6.6" height="6.6" rx="1.4" />
      <rect x="4" y="13.4" width="6.6" height="6.6" rx="1.4" />
      <rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.4" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

export function ChevronLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  )
}

export function ChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function Back10Icon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 10.5A8 8 0 1 1 12 20" />
      <path d="M4.5 5.5v5h5" />
      <text x="9" y="15" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">
        10
      </text>
    </svg>
  )
}

export function Forward10Icon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19.5 10.5A8 8 0 1 0 12 20" />
      <path d="M19.5 5.5v5h-5" />
      <text x="8" y="15" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">
        10
      </text>
    </svg>
  )
}

export function SkipNextIcon(props: IconProps) {
  return (
    <svg {...base} {...props} fill="currentColor" stroke="none">
      <path d="M6 5.7v12.6a.9.9 0 0 0 1.37.77L17 13.1V19a1 1 0 1 0 2 0V5a1 1 0 1 0-2 0v5.9L7.37 4.93A.9.9 0 0 0 6 5.7Z" />
    </svg>
  )
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 0 0-14-5.3L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14 5.3L20 16" />
      <path d="M20 20v-4h-4" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function VolumeHighIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5v5h3.2L12 18V6L7.2 9.5H4Z" />
      <path d="M15.4 9.2a4 4 0 0 1 0 5.6" />
      <path d="M17.9 6.7a7.4 7.4 0 0 1 0 10.6" />
    </svg>
  )
}

export function VolumeMuteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5v5h3.2L12 18V6L7.2 9.5H4Z" />
      <path d="m16 10 4 4M20 10l-4 4" />
    </svg>
  )
}

export function SpeedIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="13" r="7.4" />
      <path d="M12 13l3.6-3.8" />
      <path d="M5.4 13h1.6M17 13h1.6M12 5.6V7" />
    </svg>
  )
}

export function HdIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.2" />
      <text x="12" y="15.2" fontSize="7.4" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="800">
        HD
      </text>
    </svg>
  )
}

export function RotateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8.2" y="3.4" width="7.6" height="12.2" rx="1.8" />
      <path d="M5.2 16.2a8 8 0 0 0 13.6 0" />
      <path d="M18.8 14.4v3.6h-3.6" />
    </svg>
  )
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props} fill="currentColor" stroke="none">
      <path d="M12 2.5c.4 3.9 2.6 6.1 6.5 6.5-3.9.4-6.1 2.6-6.5 6.5-.4-3.9-2.6-6.1-6.5-6.5 3.9-.4 6.1-2.6 6.5-6.5ZM18 15c.25 2.1 1.4 3.25 3.5 3.5-2.1.25-3.25 1.4-3.5 3.5-.25-2.1-1.4-3.25-3.5-3.5 2.1-.25 3.25-1.4 3.5-3.5Z" />
    </svg>
  )
}
