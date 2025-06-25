import React, { useRef, useState } from 'react'

interface SpeechFeedbackProps {
  storyText: string
}

const SpeechFeedback: React.FC<SpeechFeedbackProps> = ({ storyText }) => {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackAudio, setFeedbackAudio] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    setError(null)
    setFeedback(null)
    setFeedbackAudio(null)
    setTranscript(null)
    setAudioBlob(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new window.MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunks.current = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/mp3' })
        setAudioBlob(blob)
      }
      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      setError('Microphone access denied or not available.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const sendForFeedback = async () => {
    if (!audioBlob) return
    setLoading(true)
    setError(null)
    setFeedback(null)
    setFeedbackAudio(null)
    setTranscript(null)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.mp3')
      formData.append('story', storyText)
      const res = await fetch('/api/story-feedback', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        setError('Failed to get feedback. Please try again.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setTranscript(data.transcript)
      setFeedback(data.feedbackText)
      setFeedbackAudio(data.feedbackAudio)
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white/80 rounded-2xl shadow-lg p-6 mt-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-text-arabic mb-4 text-center">🎤 أعد سرد القصة بصوتك</h2>
      <p className="text-text-english/80 mb-4 text-center">Retell the story in your own words! Press record, speak, then get feedback.</p>
      <div className="flex flex-col items-center gap-4">
        {!recording && (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-primary text-white rounded-full font-bold text-lg shadow hover:bg-primary-light transition"
          >
            ▶️ ابدأ التسجيل (Start Recording)
          </button>
        )}
        {recording && (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-red-600 text-white rounded-full font-bold text-lg shadow hover:bg-red-700 transition animate-pulse"
          >
            ⏹️ أوقف التسجيل (Stop Recording)
          </button>
        )}
        {audioBlob && !recording && (
          <>
            <audio controls src={URL.createObjectURL(audioBlob)} className="my-2" />
            <button
              onClick={sendForFeedback}
              className="px-6 py-3 bg-secondary text-white rounded-full font-bold text-lg shadow hover:bg-secondary/80 transition"
              disabled={loading}
            >
              {loading ? 'جاري التحليل...' : 'احصل على التعليق الصوتي'}
            </button>
          </>
        )}
        {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
        {feedback && (
          <div className="mt-6 w-full">
            <h3 className="text-xl font-bold text-text-arabic mb-2">تعليق الذكاء الاصطناعي:</h3>
            <p className="text-lg text-text-arabic mb-2">{feedback}</p>
            {feedbackAudio && (
              <audio controls src={feedbackAudio} className="my-2" />
            )}
            {transcript && (
              <div className="mt-2 text-sm text-text-english/70">
                <strong>Transcript:</strong> {transcript}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SpeechFeedback 