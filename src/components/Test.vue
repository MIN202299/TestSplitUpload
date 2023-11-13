<script lang="ts" setup>
const box$ = ref()

const { style } = useDraggable(box$, {
  initialValue: { x: 0, y: 0 },
})
</script>

<template>
  <div ref="box$" :style="style" fixed grid-center h-40 w-40 cursor-pointer select-none bg-red text-white shadow-lg>
    <div i-material-symbols:emoji-people text="amber 2em" />
    drag me
  </div>
</template>
