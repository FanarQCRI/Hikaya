"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SpeechFeedback from "@/components/SpeechFeedback";
import type { Story } from "@/types";

export default function AudioUnderstandingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storyData = localStorage.getItem("currentStory");
    if (storyData) {
      setStory(JSON.parse(storyData));
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-light via-accent-light to-warm">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-arabic text-lg">جاري تحميل القصة...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-light via-accent-light to-warm">
        <div className="text-center">
          <p className="text-text-arabic text-lg mb-4">لم يتم العثور على القصة</p>
          <button
            onClick={() => router.push("/setup")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-light transition-colors"
          >
            العودة لإنشاء قصة جديدة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-light via-accent-light to-warm flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full px-4 py-8">
        <h1 className="text-3xl font-extrabold text-text-arabic text-center mb-6">فهم القصة بالصوت</h1>
        <SpeechFeedback storyText={story.pages.map((p: any) => p.arabicText).join("\n")} />
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push(`/story/${story.id}`)}
            className="px-6 py-3 bg-secondary text-white rounded-full font-bold text-lg shadow hover:bg-secondary/80 transition"
          >
            العودة للقصة
          </button>
          <button
            onClick={() => router.push(`/quiz/${story.id}`)}
            className="px-6 py-3 bg-primary text-white rounded-full font-bold text-lg shadow hover:bg-primary-light transition"
          >
            ابدأ الاختبار
          </button>
        </div>
      </div>
    </div>
  );
} 