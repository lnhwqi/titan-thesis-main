import { keyframes } from "@emotion/css"

export const spin = keyframes`
  100% {
    transform: rotate(360deg);
  }
`

export const gradient = keyframes`
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
`

export const fadeSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px rgba(124, 58, 237, 0.4), 0 0 20px rgba(236, 72, 153, 0.2);
  }
  50% {
    box-shadow: 0 0 18px rgba(124, 58, 237, 0.7), 0 0 36px rgba(236, 72, 153, 0.4);
  }
`

export const floatY = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`

export const borderGlow = keyframes`
  0%, 100% { border-color: rgba(124, 58, 237, 0.4); }
  50% { border-color: rgba(236, 72, 153, 0.8); }
`

export const shimmer = keyframes`
  from { background-position: 200% center; }
  to { background-position: -200% center; }
`
