<template>
  <svg class="default-avatar" viewBox="0 0 128 128" role="img" aria-label="福农AI创默认头像">
    <defs>
      <linearGradient id="avatar-sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#243633" />
        <stop offset="1" stop-color="#101b1b" />
      </linearGradient>
      <linearGradient id="avatar-field" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6fca75" />
        <stop offset="1" stop-color="#b8ef77" />
      </linearGradient>
      <linearGradient id="avatar-sun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffe49a" />
        <stop offset="1" stop-color="#f3ad5c" />
      </linearGradient>
      <clipPath id="avatar-clip"><circle cx="64" cy="64" r="62" /></clipPath>
    </defs>
    <circle cx="64" cy="64" r="62" fill="url(#avatar-sky)" />
    <g clip-path="url(#avatar-clip)">
      <circle cx="91" cy="30" r="12" fill="url(#avatar-sun)" opacity=".95" />
      <path d="M-12 106 C24 84 50 91 78 81 C101 73 117 75 140 63 L140 140 L-12 140 Z" fill="#1e4a3c" />
      <path d="M-12 116 C20 95 49 105 77 92 C102 80 119 88 140 76" fill="none" stroke="url(#avatar-field)" stroke-linecap="round" stroke-width="7" />
      <path d="M-12 132 C24 111 54 121 83 106 C105 95 121 103 140 92" fill="none" stroke="#4b9b63" stroke-linecap="round" stroke-width="5" opacity=".9" />
      <path d="M-12 145 C25 125 55 135 85 120 C108 109 123 117 140 106" fill="none" stroke="#2b7355" stroke-linecap="round" stroke-width="4" />
      <path d="M64 94 C64 78 64 63 63 47" fill="none" stroke="#d7f59a" stroke-linecap="round" stroke-width="5" />
      <path d="M63 60 C48 60 40 52 40 42 C52 41 62 47 63 60 Z" fill="#9de46c" />
      <path d="M64 51 C67 36 78 29 90 31 C89 44 80 53 64 56 Z" fill="#70c975" />
      <circle cx="64" cy="94" r="5" fill="#d7f59a" />
    </g>
    <circle cx="64" cy="64" r="61" fill="none" stroke="rgba(222,255,220,.75)" stroke-width="2" />
  </svg>
</template>

<style scoped>
.default-avatar { display: block; width: 100%; height: 100%; }
</style>
