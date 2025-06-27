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
  if (!text || typeof text !== 'string') return ''
  
  return text
    // Remove section markers and headers
    .replace(/\[(?:العنوان|Title)\]:/g, '')
    .replace(/\[(?:الفصل|Chapter) ?[١٢٣٤٥\d]+\]:/g, '')
    .replace(/^(العنوان|الفصل|Title|Chapter).*$/gm, '')
    
    // Remove instruction artifacts
    .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gm, '')
    .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gm, '')
    .replace(/^(الفصل\s*(الأول|الثاني|الثالث|الرابع|الخامس))\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gm, '')
    .replace(/^(\d+|[أ-ي]+)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية).*$/gm, '')
    
    // Remove standalone ordinal numbers
    .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/g, '')
    
    // Remove instruction text
    .replace(/(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية)\s*أو\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|البداية)/g, '')
    
    // Remove lines starting with ordinal patterns
    .replace(/^لأول\s*:.*$/gm, '')
    .replace(/^لثاني\s*:.*$/gm, '')
    .replace(/^لثالث\s*:.*$/gm, '')
    .replace(/^لرابع\s*:.*$/gm, '')
    .replace(/^لخامس\s*:.*$/gm, '')
    
    // Remove ordinal numbers at sentence beginnings
    .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gm, '')
    .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gm, '')
    .replace(/([.!?])\s*(الأول|الثاني|الثالث|الرابع|الخامس)\s+/g, '$1 ')
    .replace(/([.!?])\s*(لأول|لثاني|لثالث|لرابع|لخامس)\s+/g, '$1 ')
    
    // Remove ordinal numbers anywhere in text
    .replace(/\s+(الأول|الثاني|الثالث|الرابع|الخامس)\s+/g, ' ')
    .replace(/\s+(لأول|لثاني|لثالث|لرابع|لخامس)\s+/g, ' ')
    
    // Clean up extra whitespace and formatting
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
} 