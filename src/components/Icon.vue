<script setup>
defineProps({ name: String })
const paths = {
 sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
 moon: 'M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z',
 mail: 'M3 5h18v14H3V5Zm0 0 9 7 9-7',
 location: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18h4',
 arrow: 'M7 17 17 7M7 7h10v10', close: 'm6 6 12 12M6 18 18 6', chevron: 'm7 10 5 5 5-5',
 code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18',
 design: 'M3 3h18v18H3V3ZM3 9h18M9 9v12',
 chart: 'M4 3v18h17M8 16v-4m5 4V8m5 8V5',
 sparkle: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
 school: 'm2 8 10-5 10 5-10 5L2 8Zm4 3v7l6 3 6-3v-7M22 8v8',
 github: 'M9 21v-4c-4 1-4-2-5-2m11 6v-4c0-1-.3-1.5-1-2 4-.5 6-2 6-6 0-1.4-.5-2.5-1.5-3.5.4-1 .3-2.2 0-3.5-2 0-3 1-3.5 1.5a12 12 0 0 0-6 0C8.5 3 7.5 2 5.5 2c-.3 1.3-.4 2.5 0 3.5C4.5 6.5 4 7.6 4 9c0 4 2 5.5 6 6-.7.5-1 1-1 2',
 book: 'M12 5c-3-2-6-2-10-1v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v16',
 chat: 'M21 11a9 9 0 0 1-9 9H4l-3 2 2-6a9 9 0 1 1 18-5ZM7 10h10M7 14h6',
 copy: 'M9 8h12v13H9V8ZM5 16H3V3h12v2',
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.sparkle" /></svg></template>
