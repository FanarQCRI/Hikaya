// Generate audio from Arabic text using Fanar TTS
export async function generateAudioFromText(text: string): Promise<string> {
    try {
        console.log('Requesting TTS for text:', text.substring(0, 50) + '...')
        
        const response = await fetch('/api/story-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ story: text }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(`TTS generation failed: ${response.status} - ${errorData.error || 'Unknown error'}`)
        }

        const audioBlob = await response.blob()
        
        if (audioBlob.size === 0) {
            throw new Error('Generated audio is empty')
        }
        
        console.log('TTS generated successfully, blob size:', audioBlob.size, 'bytes')
        const audioUrl = URL.createObjectURL(audioBlob)
        return audioUrl
    } catch (error) {
        console.error('Error generating audio:', error)
        throw error
    }
}

// Play audio with proper cleanup
export function playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl) // Clean up the blob URL
            resolve()
        }
        
        audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl) // Clean up the blob URL
            console.error('Audio playback error:', error)
            reject(new Error('Failed to play audio'))
        }
        
        audio.onloadstart = () => {
            console.log('Audio loading started')
        }
        
        audio.oncanplay = () => {
            console.log('Audio ready to play')
        }
        
        audio.play().catch((error) => {
            URL.revokeObjectURL(audioUrl) // Clean up the blob URL
            console.error('Audio play failed:', error)
            reject(error)
        })
    })
}

// Stop currently playing audio
export function stopAudio(audioElement?: HTMLAudioElement): void {
    if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
    }
}