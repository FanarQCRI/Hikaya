# حكايات (Hikayat) - Arabic Story Generation Platform

A beautiful, interactive storytelling platform for children, inspired by Arabic and Islamic heritage. Built with Next.js, TypeScript, and Tailwind CSS.

## 🌟 Features

### 📚 Interactive Stories
- **AI-Generated Content**: Stories created using Fanar LLM API
- **Beautiful Illustrations**: AI-generated images for each story page
- **Audio Narration**: Text-to-speech for Arabic content
- **Bilingual Support**: Arabic text with English translations

### 🎨 Child-Friendly Design
- **Whimsical Aesthetic**: Warm, cozy design inspired by Arabic/Islamic heritage
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Engaging page transitions and micro-interactions
- **Accessibility**: Designed with children's needs in mind

### 🎯 Educational Features
- **Difficulty Levels**: Beginner, Intermediate, and Advanced reading levels
- **Theme Selection**: Choose from 8 preset themes or create custom stories
- **Interactive Quizzes**: Test comprehension with AI-generated questions
- **Progress Tracking**: Earn points and track learning progress

## 🎨 Theme Options

- **🌙 Ramadan**: Stories about the holy month and spiritual growth
- **👨‍🍳 Cooking**: Adventures in the kitchen with traditional recipes
- **🕌 Mosques**: Tales about beautiful mosques and community
- **🐪 Animals**: Stories featuring animals from Islamic tradition
- **👨‍👩‍👧‍👦 Family**: Heartwarming family bonds and traditions
- **🌿 Nature**: Adventures in nature and the beauty of creation
- **🤝 Friendship**: Stories about kindness and helping others
- **🗺️ Adventure**: Exciting journeys in magical lands

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hikaya
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FANAR_API_URL=https://api.fanar.com
   NEXT_PUBLIC_FANAR_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
hikaya/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Landing page
│   │   ├── setup/             # Story configuration
│   │   ├── story/[id]/        # Story reading experience
│   │   └── quiz/[id]/         # Interactive quiz
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and API services
│   │   ├── api.ts            # Fanar LLM API integration
│   │   └── utils.ts          # Helper functions
│   ├── types/                # TypeScript type definitions
│   └── data/                 # Static data (themes, etc.)
├── public/                   # Static assets
└── package.json
```

## 🎨 Design System

### Colors
- **Primary**: Warm browns (#8B4513, #D2691E)
- **Secondary**: Forest green (#228B22)
- **Accent**: Golden yellow (#FFD700)
- **Warm**: Beige tones (#F5DEB3, #FAF0E6)
- **Text**: Dark grays for readability

### Typography
- **Arabic**: Amiri font for beautiful Arabic text
- **English**: Noto Sans Arabic for clean English text
- **Responsive**: Scales appropriately across devices

### Animations
- **Page Transitions**: Smooth fade and slide effects
- **Micro-interactions**: Hover states and button feedback
- **Loading States**: Engaging spinners and progress indicators

## 🔧 API Integration

The app integrates with the Fanar LLM API for:

- **Story Generation**: Creating engaging, age-appropriate content
- **Image Generation**: Beautiful illustrations for each story page
- **Audio Synthesis**: Natural Arabic text-to-speech
- **Translation**: Accurate Arabic-to-English translations
- **Quiz Generation**: Comprehension questions based on story content

### API Endpoints (Mock Implementation)
- `generateStory(config)`: Creates a complete story with pages
- `generateImage(prompt, theme)`: Generates story illustrations
- `generateAudio(text)`: Creates audio narration
- `translateToEnglish(arabicText)`: Translates Arabic to English
- `generateQuiz(storyId, content)`: Creates comprehension questions

## 🎯 User Journey

1. **Landing Page**: Beautiful introduction with call-to-action
2. **Story Setup**: Choose difficulty level and theme
3. **Story Reading**: Interactive book-style experience
4. **Quiz**: Test comprehension and earn points
5. **Results**: Celebrate achievement and encourage more reading

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Fanar LLM**: For providing the AI story generation capabilities
- **Arabic Typography**: Beautiful fonts from Google Fonts
- **Islamic Heritage**: Inspiration from rich cultural traditions
- **Children's Education**: Dedicated to making learning fun and engaging

## 📞 Support

For support, email support@hikayat.com or join our Discord community.

---

Made with ❤️ for children's education and cultural heritage
