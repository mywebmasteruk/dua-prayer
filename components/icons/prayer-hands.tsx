import type React from "react"

/** Outline dua hands icon derived from the DuaPrayer brand mark (logo-icon.png). */
export function PrayerHandsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.4 22.81C3.7 22.09 3.2 21.3 3.2 20.19C3.2 19.08 3.7 17.97 4.4 16.86C5.1 15.75 5.7 14.64 6.4 13.53C7 12.42 7.7 11.31 8.4 10.2C9 9.1 9.7 8 10.33 6.9C10.99 5.8 11.65 4.6 12 4.1C12.34 4.6 13 5.8 13.66 6.9C14.32 8 14.98 9.1 15.64 10.2C16.3 11.31 16.96 12.42 17.63 13.53C18.29 14.64 18.95 15.75 19.61 16.86C20.27 17.97 20.84 19.08 20.84 20.19C20.84 21.3 20.27 22.09 19.61 22.81" />
      <path d="M4.4 20.19C4.4 19.08 5 17.97 5.6 16.86C6.3 15.75 6.9 14.64 7.6 13.53C8.3 12.42 8.9 11.31 9.6 10.2C10.24 9.1 10.9 8 11.56 6.9" />
      <path d="M19.61 20.19C19.61 19.08 19.04 17.97 18.38 16.86C17.71 15.75 17.05 14.64 16.39 13.53C15.73 12.42 15.07 11.31 14.41 10.2C13.75 9.1 13.09 8 12.43 6.9" />
    </svg>
  )
}
