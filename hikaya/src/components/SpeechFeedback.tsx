import React, { useRef, useState } from 'react'

interface SpeechFeedbackProps {
  storyText: string
}

const SpeechFeedback: React.FC<SpeechFeedbackProps> = ({ storyText }) => {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [feedback, setFeedback] = useState<{ rating: number; comment: string } | null>(null)
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
      
      // Parse the feedback to extract rating and comment
      const feedbackText = data.feedbackText || ''
      const ratingMatch = feedbackText.match(/التقييم:\s*(\d+)\s*⭐+/)
      const commentMatch = feedbackText.match(/التعليق:\s*(.+)/)
      
      const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0
      const comment = commentMatch ? commentMatch[1].trim() : feedbackText
      
      setFeedback({ rating, comment })
      setFeedbackAudio(data.feedbackAudio)
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
    setLoading(false)
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingMessage = (rating: number) => {
    if (rating >= 4) return 'ممتاز! (Excellent!)'
    if (rating >= 3) return 'جيد! (Good!)'
    if (rating >= 2) return 'مقبول (Fair)'
    return 'يحتاج تحسين (Needs Improvement)'
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
            <h3 className="text-xl font-bold text-text-arabic mb-4 text-center">تقييم الذكاء الاصطناعي</h3>
            
            {/* Rating Display */}
            <div className="bg-gradient-to-r from-warm-light to-accent-light rounded-xl p-4 mb-4 text-center">
              <div className="text-3xl mb-2">
                <span className={getRatingColor(feedback.rating)}>{renderStars(feedback.rating)}</span>
              </div>
              <div className={`text-lg font-bold ${getRatingColor(feedback.rating)}`}>
                {getRatingMessage(feedback.rating)}
              </div>
            </div>
            
            {/* Feedback Comment */}
            <div className="bg-white/60 rounded-xl p-4 mb-4">
              <h4 className="text-lg font-bold text-text-arabic mb-2">التعليق:</h4>
              <p className="text-text-arabic leading-relaxed">{feedback.comment}</p>
            </div>
            
            {/* Audio Feedback */}
            {feedbackAudio && (
              <div className="bg-accent-light/30 rounded-xl p-4">
                <h4 className="text-lg font-bold text-text-arabic mb-2">التعليق الصوتي:</h4>
                <audio controls src={feedbackAudio} className="w-full" />
              </div>
            )}
            
            {/* Transcript */}
            {transcript && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-text-arabic mb-2">ما قلته:</h4>
                <p className="text-text-english/70 italic">"{transcript}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SpeechFeedback 