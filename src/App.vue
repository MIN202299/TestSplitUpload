<script setup lang="ts">
import { CHUNK_SIZE, MAX_FILE_SIZE, MAX_REQUEST_NUM, calculateHash } from '~/utils'

async function onChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0])
    return
  if (files[0].size > MAX_FILE_SIZE) {
    const chunks = createChunk(files[0])
    // const start = +new Date()
    const hash = await calculateHash(chunks) as string
    // console.log('hash', hash, (+new Date() - start) / 1000)

    const res = await fetch('http://localhost:8421/preUpload', {
      method: 'POST',
      body: JSON.stringify({
        filename: files[0].name,
        hash,
      }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const data = await res.json()

    if (data.data.shouldUpload) {
      await uploadChunk({ chunks, hash, filename: files[0].name, existChunkName: data.data.existChunkName }, (progress: string) => {
        console.log('文件上传进度', progress)
      })
      fetch('http://localhost:8421/merge', {
        method: 'POST',
        body: JSON.stringify({
          filename: files[0].name,
          chunkSize: CHUNK_SIZE,
          hash,
        }),
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => {
        console.log('文件上传完成', res)
      })
    }
  }

  else {
    console.log('文件太小不足以分片')
  }
}

function createChunk(file: File) {
  let start = 0
  const chunks = []
  while (start < file.size) {
    chunks.push(file.slice(start, CHUNK_SIZE + start))
    start += CHUNK_SIZE
  }
  return chunks
}

async function uploadChunk({ chunks, hash, filename, existChunkName }: { hash: string; filename: string; chunks: Blob[]; existChunkName?: string[] }, onProgress = (_: string) => {}) {
  const data = chunks.map((chunk, index) => ({
    hash,
    chunk,
    filename,
    hashName: `${hash}-${index}`,
  }))

  const formDatas = data.filter(
    item => !(existChunkName || []).includes(item.hashName),
  )
    .map((item) => {
      const formData = new FormData()
      formData.append('file', item.chunk)
      formData.append('hash', item.hash)
      formData.append('hashName', item.hashName)
      formData.append('filename', filename)
      return formData
    })

  const taskPool: any[] = []

  let current = 0

  while (current < formDatas.length) {
    const task = fetch('http://localhost:8421/splitUpload', {
      method: 'POST',
      body: formDatas[current],
    })
    task.then(() => {
      taskPool.splice(taskPool.findIndex(item => item === task), 1)
    })
    taskPool.push(task)
    if (taskPool.length === MAX_REQUEST_NUM)
      await Promise.race(taskPool)
    current++
    onProgress((current / formDatas.length).toFixed(2))
  }
  await Promise.all(taskPool)
}
</script>

<template>
  <div grid place-items-center>
    <input type="file" @change="onChange">
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
