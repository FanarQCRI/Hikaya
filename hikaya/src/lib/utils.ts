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

/**
 * Cleans chapter or title text by removing section markers (Title, Chapter, العنوان, الفصل, etc.), asterisks, dashes, colons, English words, and extra whitespace.
 * Handles both Arabic and English, any capitalization, and special characters.
 */
export function cleanChapterText(text: string): string {
  return text
    // Remove bracketed tags like [العنوان], [الفصل الأول], [Title], [Chapter 1]
    .replace(/\[[^\]]*\]/gi, '')
    // Remove lines starting with section markers (arabic/english, any case)
    .replace(/^(الفصل|العنوان|chapter|title|section)\s*\d*.*$/gim, '')
    // Remove explicit markers in-line (Title, Chapter 1, etc.)
    .replace(/(Title|العنوان|Chapter ?\d*|الفصل ?\d*)/gi, '')
    // Remove separators like --- or ——
    .replace(/[-–—*]+/g, '')
    // Remove all English-only words
    .replace(/\b[a-zA-Z]+\b/g, '')
    // Remove colons and similar after empty tags or sections
    .replace(/^[\s:：\-*]+|[\s:：\-*]+$/gm, '')
    // Collapse multiple blank lines into a single line
    .replace(/\n{2,}/g, '\n')
    // Remove leading/trailing whitespace and newlines
    .trim();
} 