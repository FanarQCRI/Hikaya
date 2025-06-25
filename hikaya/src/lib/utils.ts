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
    // Remove instruction headers like "الأول: مقدمة القصة والشخصيات" (at start of lines)
    .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
    // Remove instruction headers with typos like "لأول: البداية" (missing hamza)
    .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
    // Remove instruction headers like "الفصل الأول: مقدمة القصة والشخصيات" (at start of lines)
    .replace(/^(الفصل\s*(الأول|الثاني|الثالث|الرابع|الخامس))\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية).*$/gim, '')
    // Remove any line that starts with ordinal numbers followed by instruction text (at start of lines)
    .replace(/^(\d+|[أ-ي]+)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*$/gim, '')
    // Remove ordinal numbers and instruction text anywhere in the text (not just at start)
    .replace(/(الأول|الثاني|الثالث|الرابع|الخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*?(?=\n|$)/gim, '')
    // Remove ordinal numbers with typos and instruction text anywhere in the text
    .replace(/(لأول|لثاني|لثالث|لرابع|لخامس)\s*:\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|أو|البداية).*?(?=\n|$)/gim, '')
    // Remove standalone ordinal numbers that might appear in text (including typos)
    .replace(/\b(الأول|الثاني|الثالث|الرابع|الخامس|لأول|لثاني|لثالث|لرابع|لخامس)\b/gim, '')
    // Remove instruction text that might appear anywhere
    .replace(/(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية)\s*أو\s*(مقدمة|المشكلة|محاولة|الحل|النهاية|القصة|الشخصيات|التحدي|الحل|البداية)/gim, '')
    // Remove any line that starts with "لأول:" or similar patterns
    .replace(/^لأول\s*:.*$/gim, '')
    .replace(/^لثاني\s*:.*$/gim, '')
    .replace(/^لثالث\s*:.*$/gim, '')
    .replace(/^لرابع\s*:.*$/gim, '')
    .replace(/^لخامس\s*:.*$/gim, '')
    // Remove ordinal numbers at the beginning of sentences or paragraphs (with or without spaces)
    .replace(/^(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '')
    .replace(/^(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '')
    // Remove ordinal numbers that appear at the start of any sentence (after periods, exclamation, question marks)
    .replace(/([.!?])\s*(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, '$1 ')
    .replace(/([.!?])\s*(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, '$1 ')
    // Remove ordinal numbers that appear anywhere in the text (more aggressive)
    .replace(/\s+(الأول|الثاني|الثالث|الرابع|الخامس)\s+/gim, ' ')
    .replace(/\s+(لأول|لثاني|لثالث|لرابع|لخامس)\s+/gim, ' ')
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