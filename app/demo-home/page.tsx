'use client'

import { useState } from 'react'
import { Arimo } from 'next/font/google'
import { 
  Sparkles, 
  Calendar, 
  Image as ImageIcon, 
  Lightbulb, 
  Coins, 
  ArrowLeft, 
  Bell, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  Layers, 
  Settings, 
  LogOut, 
  Check, 
  Clock, 
  ArrowUpRight,
  ThumbsUp,
  MessageCircle,
  RefreshCw,
  Search,
  HelpCircle,
  Sliders,
  ChevronDown
} from 'lucide-react'

// Custom SVGs for Facebook and Instagram to avoid lucide-react version compatibility issues
const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)


// Load Google Font 'Arimo'
const arimo = Arimo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '700'],
  variable: '--font-arimo',
  display: 'swap',
})

// Define mock data for interaction
const INITIAL_POSTS = [
  {
    id: 'post-1',
    platform: 'facebook',
    businessName: 'מאפיית לחם הבית',
    timeText: 'מתוזמן למחר · 09:00',
    content: 'בוקר של לחם טרי ☀️ ריח שמתמלא בכל הבית — בדיוק ככה מתחיל יום טוב אצלנו. היום יש לנו באגט חדש, מוזמנים לטעום! 🥖',
    hashtags: ['#לחםטרי', '#מאפייה', '#בוקרטוב'],
    status: 'scheduled',
    likes: 124,
    comments: 18,
  },
  {
    id: 'post-2',
    platform: 'instagram',
    businessName: 'מאפיית לחם הבית',
    timeText: 'טיוטה - נוצר על ידי AI',
    content: 'מחפשים את הליווי המושלם לקפה שלכם? ☕️ קרואסון החמאה הנימוח שלנו מחכה לכם עכשיו חם מהתנור. מי מגיע?',
    hashtags: ['#קרואסון', '#קפהשלבוקר', '#שחיתות'],
    status: 'draft',
    likes: 0,
    comments: 0,
  },
  {
    id: 'post-3',
    platform: 'instagram',
    businessName: 'מאפיית לחם הבית',
    timeText: 'פורסם לפני יומיים',
    content: 'סוף השבוע כבר כאן! 🥖 הכנו עבורכם מגוון חלות חגיגיות ומיוחדות לשבת. אל תפספסו, המלאי מוגבל!',
    hashtags: ['#חלהלשבת', '#סופש', '#שבתשלום'],
    status: 'published',
    likes: 245,
    comments: 42,
  }
]

const QUICK_TIPS = [
  'פוסטים עם שאלות מעוררים 40% יותר תגובות.',
  'השעה הכי טובה לפרסום אצל הקהל שלך היא 18:30.',
  'הוספת תמונה מיוצרת AI מגדילה מעורבות פי 2.'
]

export default function DemoHomePage() {
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all')
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics'>('posts')
  const [showNotifications, setShowNotifications] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [tokens, setTokens] = useState(12450)
  const [imageQuota, setImageQuota] = useState({ used: 12, total: 30 })
  const [customPrompt, setCustomPrompt] = useState('')
  const [newPostGenerated, setNewPostGenerated] = useState(false)

  // Handlers
  const handleApprove = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'scheduled', timeText: 'אושר ומתוזמן לעוד 4 שעות' } : p))
  };

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  };

  const handleCreatePostAI = () => {
    if (tokens < 250) return alert('אין מספיק טוקנים!')
    setIsGenerating(true)
    setTimeout(() => {
      const newPost = {
        id: `post-${Date.now()}`,
        platform: 'instagram',
        businessName: 'מאפיית לחם הבית',
        timeText: 'טיוטה חדשה - נוצרה כעת',
        content: customPrompt 
          ? `הנה פוסט שנוצר בהשראת: "${customPrompt}" ✨ המומחים שלנו עובדים קשה כדי לספק לכם את חוויית האפייה הטובה ביותר בכל בוקר! 🥐`
          : 'סוד הטעם המושלם טמון באהבה ובזמן שאנו משקיעים בכל בצק. ✨ בואו לגלות את סדרת המחמצת המיוחדת שלנו.',
        hashtags: customPrompt ? ['#תוצרתבית', '#איכות'] : ['#לחםמחמצת', '#אפייהמסורתית', '#בריאות'],
        status: 'draft',
        likes: 0,
        comments: 0
      }
      setPosts(prev => [newPost, ...prev])
      setTokens(t => t - 250)
      setIsGenerating(false)
      setCustomPrompt('')
      setNewPostGenerated(true)
      setTimeout(() => setNewPostGenerated(false), 5000)
    }, 1500)
  };

  const filteredPosts = posts.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  // Simple Notification List
  const notifications = [
    { text: 'הפוסט השבועי שלך פורסם בהצלחה באינסטגרם 🎉', time: 'לפני 10 דק׳' },
    { text: 'הגעת ל-85% מנפח תמונות ה-AI החודשי שלך', time: 'לפני שעתיים' },
    { text: 'רעיון חדש לפוסט מחכה לך במדור הרעיונות 💡', time: 'לפני יום' }
  ]

  return (
    <div 
      className={`${arimo.className} min-h-screen bg-[#F8F9FA] text-[#252A53] antialiased overflow-x-hidden p-0 m-0`}
      style={{ direction: 'rtl' }}
    >
      
      {/* Dynamic Glow Accents in page corners (Web3 Style) */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#9850FF]/8 to-[#BE56FF]/8 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#3B82EF]/5 to-[#BE56FF]/5 blur-[100px] pointer-events-none z-0" />

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF]/80 backdrop-blur-md border-b border-[#E5E7EB] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#9850FF] to-[#BE56FF] flex items-center justify-center shadow-md shadow-[#9850FF]/15 hover:rotate-3 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#252A53]">
              Soci<span className="bg-gradient-to-l from-[#9850FF] to-[#BE56FF] bg-clip-text text-transparent font-extrabold">Me</span>
            </span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold text-white bg-[#3B82EF] rounded-full">
              פרו
            </span>
          </div>

          {/* Quick Search Panel */}
          <div className="hidden md:flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-full px-3.5 py-1.5 w-72">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="חיפוש מהיר פוסטים, רעיונות..." 
              className="bg-transparent border-none text-xs outline-none text-[#252A53] w-full"
            />
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4 relative">
            
            {/* Help Icon */}
            <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] hover:shadow-sm active:scale-95 transition-all text-[#252A53]"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute left-0 mt-3 w-80 bg-white border border-[#E5E7EB] rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.1)] p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                    <span className="font-bold text-sm text-[#252A53]">התראות אחרונות</span>
                    <button className="text-[10px] text-[#3B82EF] hover:underline">סמן הכל כנקרא</button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map((n, idx) => (
                      <div key={idx} className="text-xs py-2 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                        <p className="text-[#252A53] leading-relaxed font-medium">{n.text}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5 pl-1.5 border-r border-[#E5E7EB] mr-1">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-[#252A53]">דור דוד אדרי</span>
                <span className="text-[10px] text-slate-400">מאפיית לחם הבית</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] bg-gradient-to-tr from-[#3B82EF] to-[#BE56FF] p-0.5 hover:scale-105 transition-transform cursor-pointer">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-[#252A53]">
                  דד
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. WELCOME HERO CARD (Spans 3 cols) */}
          <div className="lg:col-span-3 rounded-[24px] border border-[#E5E7EB] bg-[#FFFFFF] shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 md:p-8 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300">
            
            {/* Background design elements */}
            <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent to-[#BE56FF]/5 pointer-events-none" />
            <div className="absolute -left-16 -top-16 w-44 h-44 rounded-full bg-gradient-to-tr from-[#9850FF] to-[#BE56FF] opacity-10 blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute right-1/3 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#3B82EF] to-[#BE56FF] opacity-5 blur-lg pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#9850FF]/10 text-[#9850FF] border border-[#9850FF]/15">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  עדכון AI שבועי פעיל
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#252A53] mt-2">
                  שלום דור, איזה תוכן נייצר היום? 👋
                </h1>
                <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                  העסק שלך <span className="font-bold text-[#252A53] underline decoration-[#9850FF] decoration-2">מאפיית לחם הבית</span> מוגדר בהצלחה. האסטרטגיה השבועית שלך מוכנה עם פוסטים ורעיונות חדשים המבוססים על העדפות הקהל שלך.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
                <button 
                  onClick={() => document.getElementById('ai-input-focus')?.focus()}
                  className="rounded-full border border-[#E5E7EB] text-[#252A53] bg-white font-bold text-xs px-5 py-3 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 shadow-sm transition-all duration-200"
                >
                  ראה דוחות ביצוע
                </button>
                <button 
                  onClick={handleCreatePostAI}
                  disabled={isGenerating}
                  className="rounded-full bg-[#3B82EF] text-white font-bold text-xs px-6 py-3.5 shadow-[0_4px_14px_rgba(59,130,239,0.35)] hover:shadow-[0_6px_20px_rgba(59,130,239,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      יצירה מהירה ב-AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Micro-Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#3B82EF]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">מעורבות שבועית</span>
                  <span className="text-sm font-bold text-[#252A53]">+18.4%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#9850FF]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">מתוזמנים החודש</span>
                  <span className="text-sm font-bold text-[#252A53]">14 פוסטים</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">מטרות שבוצעו</span>
                  <span className="text-sm font-bold text-[#252A53]">3 מתוך 4</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">שווי פרסום מוערך</span>
                  <span className="text-sm font-bold text-[#252A53]">₪1,840</span>
                </div>
              </div>
            </div>

          </div>


          {/* 2. MAIN FEED / ACTIVITY AREA (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-[#E5E7EB] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
                    activeTab === 'posts' 
                      ? 'bg-[#252A53] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-[#252A53]'
                  }`}
                >
                  פוסטים וטיוטות ({posts.length})
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
                    activeTab === 'analytics' 
                      ? 'bg-[#252A53] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-[#252A53]'
                  }`}
                >
                  אנליטיקה מהירה
                </button>
              </div>

              {activeTab === 'posts' && (
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-xs font-bold text-slate-500 bg-transparent border-none outline-none cursor-pointer hover:text-[#252A53]"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="draft">טיוטות AI</option>
                    <option value="scheduled">מתוזמנים</option>
                    <option value="published">פורסמו</option>
                  </select>
                </div>
              )}
            </div>

            {/* Conditionally Render Active Tab */}
            {activeTab === 'posts' ? (
              <div className="space-y-4">
                
                {/* Toast Notification for new posts */}
                {newPostGenerated && (
                  <div className="bg-gradient-to-r from-[#9850FF] to-[#BE56FF] text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-between shadow-md shadow-[#9850FF]/15 animate-in fade-in zoom-in-95 duration-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white animate-spin" />
                      ה-AI יצר פוסט חדש בהצלחה! הוספנו אותו לראש הרשימה.
                    </span>
                    <button className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/30">מעולה</button>
                  </div>
                )}

                {filteredPosts.length === 0 ? (
                  <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-12 text-center text-slate-400">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-sm font-bold text-[#252A53] mb-1">לא נמצאו פוסטים התואמים לסינון</p>
                    <p className="text-xs text-slate-400">נסה לשנות את הסינון או ליצור פוסט חדש בעזרת המערכת.</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div 
                      key={post.id}
                      className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative group"
                    >
                      {/* Social Platform Icon Badge */}
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                        {post.platform === 'facebook' ? (
                          <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <Facebook className="w-4 h-4 fill-current" />
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
                            <Instagram className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="flex items-start gap-4">
                        
                        {/* Circle Avatar Placeholders for Post Maker */}
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 mt-0.5">
                          {post.businessName.substring(0, 2)}
                        </div>

                        <div className="space-y-1 text-right flex-1 pr-1">
                          <h3 className="font-bold text-sm text-[#252A53]">
                            {post.businessName}
                          </h3>
                          
                          {/* Time & Badge */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{post.timeText}</span>
                            
                            {post.status === 'draft' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                טיוטה
                              </span>
                            )}
                            {post.status === 'scheduled' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                מתוזמן
                              </span>
                            )}
                            {post.status === 'published' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                פורסם
                              </span>
                            )}
                          </div>

                          {/* Main Text content */}
                          <p className="text-xs text-[#252A53] leading-relaxed pt-3 pb-2 font-normal whitespace-pre-line max-w-xl">
                            {post.content}
                          </p>

                          {/* Hashtags */}
                          <div className="flex flex-wrap gap-1.5">
                            {post.hashtags.map(h => (
                              <span 
                                key={h} 
                                className="text-[10px] font-bold bg-[#F8F9FA] text-[#3B82EF] hover:bg-blue-50 border border-slate-100 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                              >
                                {h}
                              </span>
                            ))}
                          </div>

                          {/* Dynamic Feedback for published posts */}
                          {post.status === 'published' && (
                            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                                {post.likes} לייקים
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                                {post.comments} תגובות
                              </span>
                              <span className="text-emerald-500 font-bold ml-auto flex items-center gap-0.5">
                                ביצועים מעולים
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          )}

                          {/* Action Bar (Interactive) */}
                          <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-50">
                            
                            {post.status !== 'published' && (
                              <>
                                <button 
                                  onClick={() => handleDelete(post.id)}
                                  className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5"
                                >
                                  מחק
                                </button>
                                <button 
                                  className="text-[11px] font-bold text-slate-500 hover:text-[#252A53] border border-[#E5E7EB] hover:bg-slate-50 bg-white rounded-full px-4 py-1.5 transition-all duration-200"
                                >
                                  ערוך תוכן
                                </button>
                              </>
                            )}

                            {post.status === 'draft' && (
                              <button 
                                onClick={() => handleApprove(post.id)}
                                className="text-[11px] font-bold text-white bg-[#3B82EF] hover:bg-[#3b82ef]/90 hover:shadow-md hover:shadow-blue-200 active:scale-95 rounded-full px-5 py-2 transition-all duration-200 flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                אשר ותזמן
                              </button>
                            )}

                            {post.status === 'scheduled' && (
                              <button 
                                className="text-[11px] font-bold text-[#3B82EF] border border-[#3B82EF]/20 hover:bg-blue-50 rounded-full px-5 py-2 transition-all duration-200 flex items-center gap-1"
                              >
                                פרסם עכשיו
                              </button>
                            )}

                            {post.status === 'published' && (
                              <button 
                                onClick={() => {
                                  // Reuse post content to write a new one
                                  setCustomPrompt(`וריאציה נוספת של: ${post.content.substring(0, 30)}...`)
                                  document.getElementById('ai-input-focus')?.focus()
                                }}
                                className="text-[11px] font-bold text-[#9850FF] hover:bg-purple-50 border border-[#9850FF]/15 rounded-full px-4 py-1.5 transition-all duration-200 flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                יצר פוסט דומה
                              </button>
                            )}

                          </div>

                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* QUICK ANALYTICS PANEL */
              <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
                <div>
                  <h3 className="font-bold text-base text-[#252A53] mb-2">ביצועי חשבונות סושיאל</h3>
                  <p className="text-xs text-slate-400">נתונים בזמן אמת מתוך פייסבוק ואינסטגרם המחוברים.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-2xl p-4 bg-[#F8F9FA]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-[#252A53]">חשיפת פוסטים (שבועי)</span>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        +24% השבוע
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-[#252A53]">42.5K</span>
                    <span className="text-[10px] text-slate-400 block mt-1">חשיפות אורגניות וצפיות בוידאו</span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-4 bg-[#F8F9FA]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-[#252A53]">קליקים לאתר</span>
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        +12% השבוע
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-[#252A53]">680</span>
                    <span className="text-[10px] text-slate-400 block mt-1">מתוך פוסטים שקושרו עם SociMe</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">עדכון אחרון: לפני 5 דקות</span>
                  <button className="text-xs font-bold text-[#3B82EF] hover:underline flex items-center gap-1">
                    סנכרן נתוני Meta API 
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* 3. SIDEBAR / QUICK ACTIONS & STATS (Spans 1 col on lg) */}
          <div className="lg:col-span-1 space-y-6">

            {/* STATS BENTO CARD (Tokens & Quota) */}
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              
              {/* Background gradient hint */}
              <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#3B82EF]/5 to-transparent blur-lg pointer-events-none" />

              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-bold text-[#252A53] uppercase tracking-wider">
                  יתרת החשבון שלי
                </span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#3B82EF] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </span>
              </div>

              {/* Token Counter */}
              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-[#252A53] tracking-tight block">
                  {tokens.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  טוקנים זמינים ליצירת תוכן AI
                </span>
              </div>

              {/* Custom Quota Indicator */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#252A53]">תמונות AI החודש</span>
                  <span className="text-slate-500">{imageQuota.used} / {imageQuota.total}</span>
                </div>
                {/* Custom premium Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-l from-[#3B82EF] to-[#BE56FF] rounded-full transition-all duration-500" 
                    style={{ width: `${(imageQuota.used / imageQuota.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">מתאפס ב-1 לכל חודש קלנדרי</p>
              </div>

              {/* Upgrade Button */}
              <button 
                onClick={() => setTokens(t => t + 5000)}
                className="w-full mt-6 rounded-full bg-slate-50 hover:bg-[#3B82EF] hover:text-white border border-[#E5E7EB] hover:border-transparent text-[#252A53] font-bold text-xs py-3 hover:-translate-y-0.5 active:translate-y-0 shadow-sm transition-all duration-200"
              >
                רכוש טוקנים נוספים
              </button>

            </div>


            {/* AI QUICK GENERATOR WIDGET */}
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              
              <div className="absolute top-0 right-0 w-full h-[5px] bg-gradient-to-l from-[#9850FF] to-[#BE56FF]" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[#252A53] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#9850FF]" />
                  מחשבות ורעיונות ל-AI
                </h3>
                <span className="text-[10px] bg-[#9850FF]/10 text-[#9850FF] px-2 py-0.5 rounded font-bold">
                  מהיר
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                כתוב משפט אחד על מה תרצה לפרסם, וה-AI ירחיב אותו לפוסט שלם תוך שניות.
              </p>

              {/* Text Input Block */}
              <div className="space-y-3">
                <textarea 
                  id="ai-input-focus"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder='לדוגמה: "מבצע מיוחד לסופ״ש הקרוב על כל סוגי החלות..."'
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-2xl p-3 text-xs outline-none focus:border-[#9850FF] transition-all bg-[#F8F9FA] resize-none text-[#252A53]"
                />

                <button 
                  onClick={handleCreatePostAI}
                  disabled={isGenerating || !customPrompt.trim()}
                  className={`w-full rounded-full font-bold text-xs py-3 flex items-center justify-center gap-2 transition-all ${
                    customPrompt.trim() 
                      ? 'bg-gradient-to-l from-[#9850FF] to-[#BE56FF] text-white shadow-md shadow-[#9850FF]/15 hover:shadow-lg hover:shadow-[#9850FF]/25 hover:-translate-y-0.5 cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      מעבד רעיון...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      ייצר פוסט בהתאמה (250 טוקנים)
                    </>
                  )}
                </button>
              </div>

            </div>


            {/* QUICK ACTIONS NAVIGATION BOX */}
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300">
              
              <h3 className="font-bold text-sm text-[#252A53] mb-4">
                כלים וקיצורי דרך
              </h3>

              {/* Navigation Grid list */}
              <div className="space-y-2">
                {[
                  { title: 'יצירת תוכן מורחבת', desc: 'פוסטים, קרוסלות, תמונות', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50' },
                  { title: 'לוח שנה ותזמון', desc: 'צפה ונהל את לוח השנה', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { title: 'מחולל תמונות AI', desc: 'תמונות מתאימות לרשתות', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50' },
                  { title: 'מדור רעיונות תוכן', desc: 'רעיונות שנכתבו במיוחד עבורך', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((act, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all duration-200 group"
                  >
                    <div className={`w-9 h-9 rounded-xl ${act.bg} ${act.color} flex items-center justify-center shrink-0`}>
                      <act.icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 text-right">
                      <span className="text-xs font-bold text-[#252A53] block group-hover:text-[#3B82EF] transition-colors">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {act.desc}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-[-2px] transition-transform" />
                  </div>
                ))}
              </div>

            </div>


            {/* LIGHTBULB TIPS WIDGET */}
            <div className="rounded-[24px] border border-[#E5E7EB] bg-gradient-to-br from-[#252A53] to-[#12082E] p-6 text-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              
              {/* Background gradient design circles */}
              <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#9850FF]/20 to-transparent blur-lg pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">טיפ סושיאל יומי</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {QUICK_TIPS[Math.floor(Date.now() / 86400000) % QUICK_TIPS.length]}
                </p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-400">מוגש על ידי SociMe AI</span>
                  <button className="text-[10px] text-amber-400 font-bold hover:underline">למד עוד</button>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] mt-16 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center md:text-right">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#9850FF] to-[#BE56FF] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-[#252A53]">SociMe</span>
          </div>
          <div>
            © {new Date().getFullYear()} SociMe. כל הזכויות שמורות לדור דוד אדרי.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#252A53]">תנאי שימוש</a>
            <a href="#" className="hover:text-[#252A53]">מדיניות פרטיות</a>
            <a href="#" className="hover:text-[#252A53]">תמיכה</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
