/* UPAI LifeHub v4 - Türkçe / English / 日本語 */

export const LANGS = [
  { id: "tr", flag: "🇹🇷", label: "Türkçe", locale: "tr-TR" },
  { id: "en", flag: "🇬🇧", label: "English", locale: "en-US" },
  { id: "ja", flag: "🇯🇵", label: "日本語", locale: "ja-JP" },
];

export const localeOf = (lang) => (LANGS.find((l) => l.id === lang) || LANGS[0]).locale;

const DICT = {
  tr: {
    appName: "UPAI LifeHub",
    settings: "Ayarlar", save: "Kaydet", close: "Kapat", cancel: "Vazgeç",
    add: "Ekle", delete: "Sil", edit: "Düzenle", done: "Tamam",
    loading: "Yükleniyor...", error: "Hata",

    tabs: {
      chat: "UPA", goals: "Hedefler", tasks: "Görevler", homework: "Ödev",
      exercise: "Egzersiz", calendar: "Takvim", pomodoro: "Pomodoro",
      schedule: "Program", lifestyle: "Yaşam", history: "Geçmiş", period: "Döngü",
    },

    chat: {
      title: "UPA Laboratuvar Asistanı",
      placeholder: "UPA ile konuş veya bir komut ver...",
      send: "Gönder", thinking: "UPA düşünüyor...",
      you: "Sen", upa: "UPA",
      attachFile: "Dosya ekle", attachImage: "Görsel ekle",
      listening: "Dinleniyor...", voiceInput: "Sesle konuş",
      speakOn: "Sesli yanıt açık", speakOff: "Sesli yanıt kapalı",
      clearChat: "Sohbeti temizle",
      fileReady: "dosya hazır", removeFile: "Kaldır",
      parsingFile: "Dosya okunuyor...",
      actionsApplied: "UPA şunları yaptı:",
      undo: "Geri al",
      noApiKey: "Önce Ayarlar'dan bir API anahtarı gir.",
      greeting: "Ben UPA. Bana yazabilir, konuşabilir, görsel ve dosya yükleyebilirsin. Program PDF'i atarsan takvimini kendim düzenlerim.",
    },

    actions: {
      add_task: "görev eklendi", complete_task: "görev tamamlandı", delete_task: "görev silindi",
      add_homework: "ödev eklendi", complete_homework: "ödev tamamlandı", delete_homework: "ödev silindi",
      add_event: "takvim etkinliği eklendi", delete_event: "etkinlik silindi", clear_events: "etkinlikler temizlendi",
      add_study_session: "çalışma seansı eklendi", add_exercise: "egzersiz kaydedildi",
      set_metric: "değer güncellendi", set_goal: "hedef güncellendi",
    },

    tasks: {
      title: "Görev Yönetimi", newTask: "Yeni görev...",
      priority: "Öncelik", time: "Saat",
      priorities: { critical: "Kritik", high: "Yüksek", medium: "Orta", low: "Düşük" },
      leadHint: "Hatırlatma öncesi süre: Kritik 60dk · Yüksek 30dk · Orta 15dk · Düşük 5dk",
      empty: "Henüz görev yok.",
      pending: "bekliyor",
    },

    homework: {
      title: "Ödev Takibi", add: "Ödev Ekle", subject: "Ders",
      description: "Konu / Açıklama", dueDate: "Teslim Tarihi",
      selectSubject: "Ders seç", customSubject: "Özel ders adı",
      empty: "Ödev yok. Harika!",
      overdue: "Gecikti", dueToday: "Bugün teslim", dueTomorrow: "Yarın teslim",
      filters: { all: "Tümü", pending: "Bekleyen", overdue: "Gecikmiş", done: "Bitmiş" },
      subjects: ["Matematik","Fizik","Kimya","Biyoloji","Tarih","Edebiyat","Coğrafya","İngilizce","Japonca","Almanca","Programlama","Diğer"],
    },

    exercise: {
      title: "Egzersiz & Kalori", log: "Egzersiz Kaydet",
      type: "Egzersiz", duration: "Süre (dk)", sets: "Set", reps: "Tekrar", notes: "Not",
      burned: "yakıldı", metEstimate: "MET tahmini",
      aiEstimate: "AI ile hesapla", estimating: "Hesaplanıyor...",
      empty: "Henüz egzersiz kaydı yok.",
      todayTotal: "Bugün yakılan",
      foodTitle: "Yemek Kalori Sorgusu",
      foodPlaceholder: "Ne yediğini yaz: 2 dilim ekmek, 1 yumurta...",
      foodCheck: "Kaloriye bak",
      foodDisclaimer: "Bu sadece bilgi amaçlıdır. Otomatik olarak eklenmez — istersen kendin girersin.",
      addManually: "Kalori sayacına ekle",
      types: ["Koşu","Yürüyüş","Bisiklet","Yüzme","Ağırlık","HIIT","Yoga","İp Atlama","Dans","Pilates","Diğer"],
    },

    calendar: {
      title: "Takvim", today: "Bugün",
      addEvent: "Etkinlik Ekle", eventTitle: "Etkinlik adı",
      startTime: "Başlangıç", endTime: "Bitiş", type: "Tür", notes: "Not",
      types: { study: "Ders", exam: "Sınav", task: "Görev", personal: "Kişisel", other: "Diğer" },
      noEvents: "Bu gün için etkinlik yok.",
      months: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
      days: ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],
      upaHint: "İpucu: UPA'ya ders programı PDF'i yükle, takvimini kendisi doldursun.",
    },

    goals: {
      title: "Ders & Yaşam Hedefleri",
      sessionTitle: "Ders & Proje Seansı",
      name: "İsim", hours: "Saat", minutes: "Dakika", saveSession: "Seansı Kaydet",
      steps: "Adım", study: "Çalışma (sa)", water: "Su (bardak)",
      calories: "Kalori", sleep: "Uyku (sa)",
      current: "Mevcut", target: "Hedef", limit: "Limit", total: "Toplam",
      report: "UPA'ya Rapor Et",
    },

    settings: {
      title: "Ayarlar", provider: "AI Sağlayıcı", apiKey: "API Anahtarı",
      model: "Model", weight: "Kilo (kg)", language: "Dil", theme: "Tema", mood: "Ruh Hali",
      syncTitle: "Cihaz Senkronizasyonu",
      syncInfo: "Aynı API anahtarını kullanan tüm cihazlar aynı veriyi görür. Telefon, tablet ve bilgisayar otomatik eşitlenir.",
      syncUrl: "Sunucu adresi (Netlify site adresin)",
      syncUrlHint: "Android uygulamasında bunu doldurman gerekir. Web'de boş bırakabilirsin.",
      syncNow: "Şimdi Senkronize Et", syncing: "Senkronize ediliyor...",
      syncOk: "Senkronize edildi", syncFail: "Senkronizasyon başarısız",
      lastSync: "Son eşitleme", autoSync: "Otomatik eşitleme",
      notifTitle: "Bildirimler", enableNotif: "Bildirimleri Aç", notifActive: "Bildirimler aktif",
      notifDenied: "Bildirimler engellendi — cihaz ayarlarından izin ver.",
      dangerZone: "Veri", exportData: "Verileri indir", importData: "Veri yükle",
    },

    notif: {
      snooze5: "5dk ertele", snooze10: "10dk ertele", dismiss: "Kapat",
      taskDue: "Görev yaklaşıyor", hwDue: "Ödev teslimi yaklaşıyor",
      eventDue: "Etkinlik yaklaşıyor",
      inMinutes: (m) => `${m} dakika içinde`,
      water: "Su içme zamanı", waterBody: (t) => `Hedefin ${t} bardak.`,
      stepReminder: "Adım hatırlatması", stepBody: (t) => `Günlük ${t} adım hedefin var.`,
      studyReminder: "Çalışma vakti", studyBody: (t) => `Bugünkü hedefin ${t} saat.`,
      overdueTitle: "Eksik kalan işler",
      snoozed: (m) => `${m} dakika ertelendi`,
    },

    brainFog: {
      title: "Kutu Nefes Egzersizi",
      inhale: "Nefes Al", hold: "Tut", exhale: "Nefes Ver", wait: "Bekle",
      dumpPlaceholder: "Aklındakileri serbest yaz...",
      back: "Geri Dön",
    },

    pomodoro: {
      title: "Pomodoro & Blok Çalışma", work: "Çalışma (dk)", brk: "Mola (dk)", block: "Blok (dk)",
      modes: { pomodoro: "🍅 Pomodoro", short: "☕ Kısa Mola", long: "🧘 Uzun Mola", block: "🧱 Blok" },
      start: "Başlat", pause: "Duraklat", reset: "Sıfırla",
      completed: "Tamamlanan Seans", customTitle: "Özel Süre Ayarları",
      finished: "Süre Doldu!", finishedBody: "tamamlandı",
    },
    history: {
      title: "Geçmiş Veriler", weekly: "Bu Hafta", monthly: "Aylık Görünüm",
      noData: "Kayıtlı veri yok", noMonthData: "Bu ay için kayıt yok. Veriler her gün otomatik kaydedilir.",
      found: "günlük kayıt bulundu", moodLabel: "Ruh hali",
      steps: "Adım", water: "Su (bardak)", calories: "Kalori", study: "Çalışma (saat)", sleep: "Uyku (saat)",
    },
    period: { title: "Döngü Takibi", lastStart: "Son Başlangıç", cycleLength: "Döngü Süresi (Gün)", nextEstimate: "Tahmini sonraki" },
    lifestyle: { title: "Müzik & Yaşam", player: "Müzik / Podcast", link: "Link yapıştır...", outfit: "Kıyafet Önerisi", recipe: "Tarif Önerisi", suggest: "Öner", none: "Henüz öneri yok." },
    tips: { title: "Günlük Çalışma Tavsiyeleri", refresh: "Güncelle", needKey: "API anahtarı gerekli." },
    stats: { steps: "Adım", glasses: "Bardak", study: "Çalışma", sleep: "Uyku", kcal: "kcal", analyze: "Günlük Değerleri Analiz Et", member: "Lab Üyesi 009 · Canlı Takip" },
  },

  en: {
    appName: "UPAI LifeHub",
    settings: "Settings", save: "Save", close: "Close", cancel: "Cancel",
    add: "Add", delete: "Delete", edit: "Edit", done: "Done",
    loading: "Loading...", error: "Error",

    tabs: {
      chat: "UPA", goals: "Goals", tasks: "Tasks", homework: "Homework",
      exercise: "Exercise", calendar: "Calendar", pomodoro: "Pomodoro",
      schedule: "Planner", lifestyle: "Lifestyle", history: "History", period: "Cycle",
    },

    chat: {
      title: "UPA Lab Assistant",
      placeholder: "Talk to UPA or give a command...",
      send: "Send", thinking: "UPA is thinking...",
      you: "You", upa: "UPA",
      attachFile: "Attach file", attachImage: "Attach image",
      listening: "Listening...", voiceInput: "Speak",
      speakOn: "Voice replies on", speakOff: "Voice replies off",
      clearChat: "Clear chat",
      fileReady: "file ready", removeFile: "Remove",
      parsingFile: "Reading file...",
      actionsApplied: "UPA did the following:",
      undo: "Undo",
      noApiKey: "Add an API key in Settings first.",
      greeting: "I'm UPA. Type, talk, or upload images and files to me. Send me a schedule PDF and I'll fill your calendar myself.",
    },

    actions: {
      add_task: "task added", complete_task: "task completed", delete_task: "task deleted",
      add_homework: "homework added", complete_homework: "homework completed", delete_homework: "homework deleted",
      add_event: "calendar event added", delete_event: "event deleted", clear_events: "events cleared",
      add_study_session: "study session added", add_exercise: "exercise logged",
      set_metric: "value updated", set_goal: "goal updated",
    },

    tasks: {
      title: "Task Manager", newTask: "New task...",
      priority: "Priority", time: "Time",
      priorities: { critical: "Critical", high: "High", medium: "Medium", low: "Low" },
      leadHint: "Reminder lead time: Critical 60m · High 30m · Medium 15m · Low 5m",
      empty: "No tasks yet.",
      pending: "pending",
    },

    homework: {
      title: "Homework Tracker", add: "Add Homework", subject: "Subject",
      description: "Topic / Description", dueDate: "Due Date",
      selectSubject: "Select subject", customSubject: "Custom subject",
      empty: "No homework. Nice!",
      overdue: "Overdue", dueToday: "Due today", dueTomorrow: "Due tomorrow",
      filters: { all: "All", pending: "Pending", overdue: "Overdue", done: "Done" },
      subjects: ["Math","Physics","Chemistry","Biology","History","Literature","Geography","English","Japanese","German","Programming","Other"],
    },

    exercise: {
      title: "Exercise & Calories", log: "Log Exercise",
      type: "Exercise", duration: "Duration (min)", sets: "Sets", reps: "Reps", notes: "Notes",
      burned: "burned", metEstimate: "MET estimate",
      aiEstimate: "Estimate with AI", estimating: "Calculating...",
      empty: "No exercise logged yet.",
      todayTotal: "Burned today",
      foodTitle: "Food Calorie Lookup",
      foodPlaceholder: "What did you eat: 2 slices of bread, 1 egg...",
      foodCheck: "Check calories",
      foodDisclaimer: "This is informational only. Nothing is added automatically — you enter it yourself if you want.",
      addManually: "Add to calorie counter",
      types: ["Running","Walking","Cycling","Swimming","Weights","HIIT","Yoga","Jump Rope","Dance","Pilates","Other"],
    },

    calendar: {
      title: "Calendar", today: "Today",
      addEvent: "Add Event", eventTitle: "Event name",
      startTime: "Start", endTime: "End", type: "Type", notes: "Notes",
      types: { study: "Study", exam: "Exam", task: "Task", personal: "Personal", other: "Other" },
      noEvents: "No events for this day.",
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      upaHint: "Tip: upload a schedule PDF to UPA and it will fill your calendar for you.",
    },

    goals: {
      title: "Study & Life Goals",
      sessionTitle: "Study & Project Session",
      name: "Name", hours: "Hours", minutes: "Minutes", saveSession: "Save Session",
      steps: "Steps", study: "Study (h)", water: "Water (glasses)",
      calories: "Calories", sleep: "Sleep (h)",
      current: "Current", target: "Target", limit: "Limit", total: "Total",
      report: "Report to UPA",
    },

    settings: {
      title: "Settings", provider: "AI Provider", apiKey: "API Key",
      model: "Model", weight: "Weight (kg)", language: "Language", theme: "Theme", mood: "Mood",
      syncTitle: "Device Sync",
      syncInfo: "Every device using the same API key sees the same data. Phone, tablet and computer stay in sync.",
      syncUrl: "Server address (your Netlify site URL)",
      syncUrlHint: "Required in the Android app. You can leave it blank on the web.",
      syncNow: "Sync Now", syncing: "Syncing...",
      syncOk: "Synced", syncFail: "Sync failed",
      lastSync: "Last sync", autoSync: "Auto sync",
      notifTitle: "Notifications", enableNotif: "Enable Notifications", notifActive: "Notifications active",
      notifDenied: "Notifications blocked — allow them in device settings.",
      dangerZone: "Data", exportData: "Download data", importData: "Import data",
    },

    notif: {
      snooze5: "Snooze 5m", snooze10: "Snooze 10m", dismiss: "Dismiss",
      taskDue: "Task coming up", hwDue: "Homework due soon",
      eventDue: "Event coming up",
      inMinutes: (m) => `in ${m} minutes`,
      water: "Time to drink water", waterBody: (t) => `Your goal is ${t} glasses.`,
      stepReminder: "Step reminder", stepBody: (t) => `Your daily goal is ${t} steps.`,
      studyReminder: "Study time", studyBody: (t) => `Today's goal is ${t} hours.`,
      overdueTitle: "Unfinished items",
      snoozed: (m) => `Snoozed for ${m} minutes`,
    },

    brainFog: {
      title: "Box Breathing",
      inhale: "Inhale", hold: "Hold", exhale: "Exhale", wait: "Wait",
      dumpPlaceholder: "Dump whatever's on your mind...",
      back: "Go Back",
    },

    pomodoro: {
      title: "Pomodoro & Deep Work", work: "Work (min)", brk: "Break (min)", block: "Block (min)",
      modes: { pomodoro: "🍅 Pomodoro", short: "☕ Short Break", long: "🧘 Long Break", block: "🧱 Block" },
      start: "Start", pause: "Pause", reset: "Reset",
      completed: "Sessions completed", customTitle: "Custom Durations",
      finished: "Time's up!", finishedBody: "finished",
    },
    history: {
      title: "History", weekly: "This Week", monthly: "Monthly View",
      noData: "No data recorded", noMonthData: "No records this month. Data is saved automatically each day.",
      found: "days recorded", moodLabel: "Mood",
      steps: "Steps", water: "Water (glasses)", calories: "Calories", study: "Study (hours)", sleep: "Sleep (hours)",
    },
    period: { title: "Cycle Tracker", lastStart: "Last Start", cycleLength: "Cycle Length (days)", nextEstimate: "Next estimated" },
    lifestyle: { title: "Music & Life", player: "Music / Podcast", link: "Paste a link...", outfit: "Outfit Suggestion", recipe: "Recipe Suggestion", suggest: "Suggest", none: "No suggestion yet." },
    tips: { title: "Daily Study Tips", refresh: "Refresh", needKey: "API key required." },
    stats: { steps: "Steps", glasses: "Glasses", study: "Study", sleep: "Sleep", kcal: "kcal", analyze: "Analyze Daily Values", member: "Lab Member 009 · Live Tracking" },
  },

  ja: {
    appName: "UPAI LifeHub",
    settings: "設定", save: "保存", close: "閉じる", cancel: "キャンセル",
    add: "追加", delete: "削除", edit: "編集", done: "完了",
    loading: "読み込み中...", error: "エラー",

    tabs: {
      chat: "UPA", goals: "目標", tasks: "タスク", homework: "宿題",
      exercise: "運動", calendar: "カレンダー", pomodoro: "ポモドーロ",
      schedule: "プランナー", lifestyle: "ライフ", history: "履歴", period: "生理",
    },

    chat: {
      title: "UPA ラボアシスタント",
      placeholder: "UPAに話しかける、または指示する...",
      send: "送信", thinking: "UPAが考えています...",
      you: "あなた", upa: "UPA",
      attachFile: "ファイル添付", attachImage: "画像添付",
      listening: "聞いています...", voiceInput: "音声入力",
      speakOn: "音声返答オン", speakOff: "音声返答オフ",
      clearChat: "チャットを消去",
      fileReady: "ファイル準備完了", removeFile: "削除",
      parsingFile: "ファイルを読み込み中...",
      actionsApplied: "UPAが実行しました:",
      undo: "元に戻す",
      noApiKey: "まず設定でAPIキーを入力してください。",
      greeting: "UPAです。入力、音声、画像やファイルのアップロードができます。時間割のPDFを送ってくれれば、カレンダーを自動で埋めます。",
    },

    actions: {
      add_task: "タスク追加", complete_task: "タスク完了", delete_task: "タスク削除",
      add_homework: "宿題追加", complete_homework: "宿題完了", delete_homework: "宿題削除",
      add_event: "予定を追加", delete_event: "予定を削除", clear_events: "予定をクリア",
      add_study_session: "勉強セッション追加", add_exercise: "運動を記録",
      set_metric: "値を更新", set_goal: "目標を更新",
    },

    tasks: {
      title: "タスク管理", newTask: "新しいタスク...",
      priority: "優先度", time: "時刻",
      priorities: { critical: "緊急", high: "高", medium: "中", low: "低" },
      leadHint: "通知の事前時間: 緊急60分 · 高30分 · 中15分 · 低5分",
      empty: "タスクはまだありません。",
      pending: "残り",
    },

    homework: {
      title: "宿題トラッカー", add: "宿題を追加", subject: "科目",
      description: "トピック・説明", dueDate: "提出期限",
      selectSubject: "科目を選択", customSubject: "カスタム科目",
      empty: "宿題なし。いいね！",
      overdue: "期限切れ", dueToday: "今日提出", dueTomorrow: "明日提出",
      filters: { all: "すべて", pending: "未完了", overdue: "期限切れ", done: "完了" },
      subjects: ["数学","物理","化学","生物","歴史","文学","地理","英語","日本語","ドイツ語","プログラミング","その他"],
    },

    exercise: {
      title: "運動・カロリー", log: "運動を記録",
      type: "運動", duration: "時間（分）", sets: "セット", reps: "回数", notes: "メモ",
      burned: "消費", metEstimate: "MET推定",
      aiEstimate: "AIで計算", estimating: "計算中...",
      empty: "運動の記録はまだありません。",
      todayTotal: "今日の消費",
      foodTitle: "食事カロリー検索",
      foodPlaceholder: "食べたもの: パン2枚、卵1個...",
      foodCheck: "カロリーを見る",
      foodDisclaimer: "これは参考情報のみです。自動では追加されません — 必要なら自分で入力してください。",
      addManually: "カロリー計に追加",
      types: ["ランニング","ウォーキング","サイクリング","水泳","筋トレ","HIIT","ヨガ","縄跳び","ダンス","ピラティス","その他"],
    },

    calendar: {
      title: "カレンダー", today: "今日",
      addEvent: "予定を追加", eventTitle: "予定名",
      startTime: "開始", endTime: "終了", type: "種類", notes: "メモ",
      types: { study: "勉強", exam: "試験", task: "タスク", personal: "個人", other: "その他" },
      noEvents: "この日の予定はありません。",
      months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
      days: ["月","火","水","木","金","土","日"],
      upaHint: "ヒント: 時間割のPDFをUPAに送ると、カレンダーを自動で埋めてくれます。",
    },

    goals: {
      title: "勉強・生活目標",
      sessionTitle: "勉強・プロジェクトセッション",
      name: "名前", hours: "時間", minutes: "分", saveSession: "セッションを保存",
      steps: "歩数", study: "勉強（時間）", water: "水（杯）",
      calories: "カロリー", sleep: "睡眠（時間）",
      current: "現在", target: "目標", limit: "上限", total: "合計",
      report: "UPAに報告",
    },

    settings: {
      title: "設定", provider: "AIプロバイダー", apiKey: "APIキー",
      model: "モデル", weight: "体重 (kg)", language: "言語", theme: "テーマ", mood: "気分",
      syncTitle: "デバイス同期",
      syncInfo: "同じAPIキーを使うすべてのデバイスが同じデータを見ます。スマホ、タブレット、PCが自動で同期されます。",
      syncUrl: "サーバーアドレス（NetlifyサイトのURL）",
      syncUrlHint: "Androidアプリでは必須です。ウェブでは空欄でも構いません。",
      syncNow: "今すぐ同期", syncing: "同期中...",
      syncOk: "同期完了", syncFail: "同期失敗",
      lastSync: "最終同期", autoSync: "自動同期",
      notifTitle: "通知", enableNotif: "通知を有効化", notifActive: "通知有効",
      notifDenied: "通知がブロックされています — デバイス設定で許可してください。",
      dangerZone: "データ", exportData: "データをダウンロード", importData: "データを読み込む",
    },

    notif: {
      snooze5: "5分スヌーズ", snooze10: "10分スヌーズ", dismiss: "閉じる",
      taskDue: "タスクの時間が近づいています", hwDue: "宿題の提出期限が近づいています",
      eventDue: "予定が近づいています",
      inMinutes: (m) => `あと${m}分`,
      water: "水分補給の時間", waterBody: (t) => `目標は${t}杯です。`,
      stepReminder: "歩数リマインダー", stepBody: (t) => `1日の目標は${t}歩です。`,
      studyReminder: "勉強の時間", studyBody: (t) => `今日の目標は${t}時間です。`,
      overdueTitle: "未完了の項目",
      snoozed: (m) => `${m}分スヌーズしました`,
    },

    brainFog: {
      title: "ボックス呼吸",
      inhale: "吸って", hold: "止めて", exhale: "吐いて", wait: "待って",
      dumpPlaceholder: "頭の中にあることを自由に書いてください...",
      back: "戻る",
    },

    pomodoro: {
      title: "ポモドーロ・集中ブロック", work: "作業（分）", brk: "休憩（分）", block: "ブロック（分）",
      modes: { pomodoro: "🍅 ポモドーロ", short: "☕ 短い休憩", long: "🧘 長い休憩", block: "🧱 ブロック" },
      start: "開始", pause: "一時停止", reset: "リセット",
      completed: "完了セッション", customTitle: "時間のカスタム設定",
      finished: "時間になりました！", finishedBody: "が終了しました",
    },
    history: {
      title: "履歴", weekly: "今週", monthly: "月間ビュー",
      noData: "記録なし", noMonthData: "今月の記録はありません。データは毎日自動保存されます。",
      found: "日分の記録", moodLabel: "気分",
      steps: "歩数", water: "水（杯）", calories: "カロリー", study: "勉強（時間）", sleep: "睡眠（時間）",
    },
    period: { title: "生理周期", lastStart: "前回開始日", cycleLength: "周期の長さ（日）", nextEstimate: "次回予測" },
    lifestyle: { title: "音楽・ライフ", player: "音楽 / ポッドキャスト", link: "リンクを貼り付け...", outfit: "服装の提案", recipe: "レシピの提案", suggest: "提案する", none: "まだ提案はありません。" },
    tips: { title: "今日の勉強のヒント", refresh: "更新", needKey: "APIキーが必要です。" },
    stats: { steps: "歩数", glasses: "杯", study: "勉強", sleep: "睡眠", kcal: "kcal", analyze: "今日のデータを分析", member: "ラボメンバー009 · ライブ追跡" },
  },
};

export const getT = (lang) => DICT[lang] || DICT.tr;

export const MOODS_I18N = {
  tr: ["🌟 Enerjik", "😊 Mutlu", "😐 Normal", "😔 Yorgun", "🎯 Odaklı", "😤 Stresli"],
  en: ["🌟 Energetic", "😊 Happy", "😐 Normal", "😔 Tired", "🎯 Focused", "😤 Stressed"],
  ja: ["🌟 元気", "😊 幸せ", "😐 普通", "😔 疲れた", "🎯 集中", "😤 ストレス"],
};

export default DICT;
