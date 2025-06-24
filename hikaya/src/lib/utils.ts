import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// IndexedDB utility for stories
export async function saveStoryToIndexedDB(key: string, story: any) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HikayaStoriesDB', 1)
    request.onupgradeneeded = function (event) {
      const db = request.result
      if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories')
      }
    }
    request.onsuccess = function () {
      const db = request.result
      const tx = db.transaction('stories', 'readwrite')
      const store = tx.objectStore('stories')
      store.put(story, key)
      tx.oncomplete = function () {
        db.close()
        resolve(true)
      }
      tx.onerror = function (e) {
        db.close()
        reject(e)
      }
    }
    request.onerror = function (e) {
      reject(e)
    }
  })
}

export async function getStoryFromIndexedDB(key: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HikayaStoriesDB', 1)
    request.onupgradeneeded = function (event) {
      const db = request.result
      if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories')
      }
    }
    request.onsuccess = function () {
      const db = request.result
      const tx = db.transaction('stories', 'readonly')
      const store = tx.objectStore('stories')
      const getReq = store.get(key)
      getReq.onsuccess = function () {
        resolve(getReq.result || null)
        db.close()
      }
      getReq.onerror = function (e) {
        db.close()
        reject(e)
      }
    }
    request.onerror = function (e) {
      reject(e)
    }
  })
} 