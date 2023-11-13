import SparkMD5 from 'spark-md5'

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const CHUNK_SIZE = 1024 * 1024
export const MAX_REQUEST_NUM = 6

// 计算hash值
// 第一个切片和最后一个切片计算全部
// 其余切片截取 前两个 中间两个 最后两个字节
export async function calculateHash(fileChunk: Blob[]) {
  return new Promise((resolve) => {
    const targets: Blob[] = []
    fileChunk.forEach((item, idx, self) => {
      if (idx === 0 || idx === self.length) {
        targets.push(item)
      }
      else {
        targets.push(item.slice(0, 2))
        targets.push(item.slice(CHUNK_SIZE / 2, CHUNK_SIZE / 2 + 2))
        targets.push(item.slice(CHUNK_SIZE - 2, CHUNK_SIZE))
      }
    })
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    fileReader.readAsArrayBuffer(new Blob(targets))
    fileReader.onload = function (e) {
      spark.append(e.target!.result as ArrayBuffer)
      // console.log('hash', spark.end())
      resolve(spark.end())
    }
  })
}
