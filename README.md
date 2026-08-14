# 🧪 UPAI LifeHub v4

AI destekli kişisel çalışma ve yaşam asistanı. Web sitesi (Netlify), Android uygulaması (APK / Play Store) ve iOS/Windows'a kurulabilir PWA olarak aynı anda çalışır — hepsi birbiriyle senkronize.

---

## İçindekiler
1. [Yenilikler](#yenilikler)
2. [Hızlı başlangıç (bilgisayarda)](#1-hızlı-başlangıç)
3. [Netlify ile web sitesi](#2-netlify-ile-web-sitesi)
4. [GitHub ile APK üretme](#3-github-ile-apk-üretme)
5. [Play Store'a yayınlama](#4-play-storea-yayınlama)
6. [Telefona/tablete/bilgisayara kurma](#5-uygulama-olarak-kurma)
7. [Cihazlar arası senkronizasyon](#6-cihazlar-arası-senkronizasyon)
8. [UPA'ya dosya yükleme ve komut verme](#7-upaya-dosya-yükleme-ve-komut-verme)
9. [Sorun giderme](#8-sorun-giderme)

---

## Yenilikler

| Özellik | Açıklama |
|---|---|
| 🌍 **3 dil** | Türkçe / English / 日本語 — arayüz **ve** UPA'nın konuştuğu dil |
| 📎 **Dosya yükleme** | PDF, Word (.docx), TXT, MD, CSV, JSON ve görseller |
| 🎤 **Sesli konuşma** | Mikrofonla konuş, UPA sesli yanıtlasın (Android'de yerel motor) |
| ⚙️ **UPA komutları** | UPA görev/ödev/takvim ekleyip silebilir — program PDF'i at, takvimi kendisi doldursun |
| 📅 **Takvim** | Aylık görünüm, etkinlik türleri, UPA tarafından doldurulabilir |
| 📝 **Ödev sekmesi** | Ders, teslim tarihi, öncelik, gecikme takibi |
| 💪 **Egzersiz** | MET tabanlı + AI kalori hesabı; yemek kalorisi **sadece bilgi** olarak gösterilir |
| 🔔 **Akıllı bildirim** | Öncelik bazlı erken uyarı: Kritik 60dk, Yüksek 30dk, Orta 15dk, Düşük 5dk |
| 🔴 **Yanıp sönen ışık** | Üst çubukta, geciken/yaklaşan iş varsa kırmızı yanıp söner |
| ⏰ **Erteleme** | Her bildirimde 5dk / 10dk ertele butonu |
| ☁️ **Senkronizasyon** | Aynı API anahtarı = aynı veri, tüm cihazlarda |
| 📱 **Mobil düzeltme** | Alt butonlar artık tam görünüyor (`safe-area-inset` desteği) |

---

## 1. Hızlı başlangıç

```bash
npm install
npm start
```

Tarayıcıda `http://localhost:3000` açılır.

İlk açılışta **⚙️ Ayarlar → API Anahtarı** kısmına bir anahtar gir:

| Sağlayıcı | Nereden alınır | Notlar |
|---|---|---|
| Google Gemini | aistudio.google.com/apikey | Ücretsiz kotası var, görsel + PDF destekler — **önerilen** |
| Anthropic Claude | console.anthropic.com | Görsel + PDF destekler |
| OpenAI | platform.openai.com | Görsel destekler |
| Groq | console.groq.com | Çok hızlı, ücretsiz |
| OpenRouter | openrouter.ai/keys | Tek anahtarla çok model |

---

## 2. Netlify ile web sitesi

1. Bu klasörü bir GitHub deposuna yükle:
   ```bash
   git init
   git add .
   git commit -m "UPAI LifeHub v4"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/upai-lifehub.git
   git push -u origin main
   ```
2. [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → GitHub deponu seç.
3. Ayarlar otomatik gelir (`netlify.toml` dosyasından okunur):
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`
4. **Deploy** de. Birkaç dakika sonra `https://xxx.netlify.app` adresin hazır.
5. Site adını değiştirmek için: **Site configuration → Change site name**.

> ⚠️ **Senkronizasyon için gerekli:** Netlify panelinde **Blobs**'un etkin olması gerekir. Yeni sitelerde varsayılan olarak açıktır; değilse Site configuration → Blobs bölümünden aç.

---

## 3. GitHub ile APK üretme

APK, GitHub Actions üzerinde otomatik derlenir — bilgisayarına Android Studio kurman gerekmez.

### Otomatik (her push'ta)
Depoya her `git push` yaptığında **debug APK** üretilir:

1. GitHub'da deponu aç → **Actions** sekmesi
2. **Build Android APK & AAB** iş akışını seç
3. En üstteki çalışmaya tıkla → aşağıda **Artifacts** bölümünden `upai-lifehub-debug-apk` dosyasını indir
4. ZIP'i aç, içindeki `app-debug.apk`'yı telefonuna at ve kur
   - Android "Bilinmeyen kaynaklardan yükleme" izni isteyecek — izin ver

### Elle çalıştırma
**Actions → Build Android APK & AAB → Run workflow** butonuyla da başlatabilirsin.

---

## 4. Play Store'a yayınlama

Play Store **imzalı AAB** ister. Adımlar:

### 4.1 Keystore (imza anahtarı) oluştur

Bilgisayarında bir kere çalıştır:

```bash
keytool -genkey -v -keystore upai-release.keystore \
  -alias upai -keyalg RSA -keysize 2048 -validity 10000
```

Sana şifre soracak — **bu şifreyi kaybetme**. Kaybedersen uygulamayı bir daha güncelleyemezsin.

### 4.2 Keystore'u base64'e çevir

```bash
# macOS / Linux
base64 -i upai-release.keystore | tr -d '\n' > keystore.txt

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("upai-release.keystore")) > keystore.txt
```

### 4.3 GitHub Secrets ekle

Depo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret adı | Değer |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `keystore.txt` içeriğinin tamamı |
| `KEYSTORE_PASSWORD` | keystore şifren |
| `KEY_ALIAS` | `upai` |
| `KEY_PASSWORD` | anahtar şifren (genelde keystore ile aynı) |

### 4.4 İmzalı sürümü derle

**Actions → Build Android APK & AAB → Run workflow** → `release` seçeneğini **true** yap → çalıştır.

Bittiğinde `upai-lifehub-release` artifact'ında `app-release.aab` olacak.

### 4.5 Play Console'a yükle

1. [play.google.com/console](https://play.google.com/console) → geliştirici hesabı aç (tek seferlik 25 USD)
2. **Create app** → isim: `UPAI LifeHub`, tür: Uygulama, ücretsiz
3. **Production → Create new release** → `app-release.aab` dosyasını yükle
4. Zorunlu bölümleri doldur:
   - Gizlilik politikası bağlantısı (Netlify sitende bir `/gizlilik` sayfası yeterli)
   - İçerik derecelendirmesi anketi
   - Hedef kitle ve içerik
   - Veri güvenliği formu — **"Veriler cihazda saklanır, API anahtarı kullanıcıya aittir"** diyebilirsin
   - Ekran görüntüleri (telefon için en az 2 adet) + 512×512 uygulama ikonu (`public/icon-512.png`) + 1024×500 kapak görseli
5. **Send for review** — inceleme genelde birkaç gün sürer

> Uygulama kimliği: `com.beril.upailifehub` — değiştirmek istersen `capacitor.config.json` içinden düzenle (Play Store'a ilk yüklemeden **önce**).

---

## 5. Uygulama olarak kurma

| Cihaz | Nasıl |
|---|---|
| **Android** | APK'yı kur, veya Play Store'dan indir. Chrome'da siteyi açıp "Ana ekrana ekle" de de olur. |
| **iPhone / iPad** | Safari'de siteyi aç → **Paylaş** → **Ana Ekrana Ekle** |
| **Windows / Mac** | Chrome veya Edge'de siteyi aç → adres çubuğunun sağındaki **⊕ Yükle** ikonuna tıkla |

Hepsi tam ekran, uygulama gibi açılır ve çevrimdışı çalışır.

---

## 6. Cihazlar arası senkronizasyon

Prensip: **aynı API anahtarını giren her cihaz aynı veriyi görür.**

- API anahtarının kendisi sunucuya **gönderilmez** — sadece SHA-256 ile türetilmiş bir kimlik gider.
- Görevler, ödevler, takvim, egzersiz kayıtları ve günlük değerler eşitlenir.
- Listeler `id` bazında birleştirilir, yani iki cihazda farklı şeyler eklersen ikisi de korunur.

### Kurulum
- **Web'de:** hiçbir şey yapmana gerek yok, otomatik çalışır.
- **Android uygulamasında:** ⚙️ Ayarlar → **Sunucu adresi** alanına Netlify adresini yaz:
  ```
  https://senin-siten.netlify.app
  ```
  Bu şart — APK kendi içinden çalıştığı için sunucunun nerede olduğunu bilemez.

Ayarlar'daki **☁️ Şimdi Senkronize Et** ile elle de tetikleyebilirsin. Veri değiştiğinde 12 saniye içinde otomatik gönderilir.

---

## 7. UPA'ya dosya yükleme ve komut verme

### Dosya yükleme
UPA sekmesinde:
- **📷** → görsel (fotoğraf, ekran görüntüsü, tahta fotoğrafı)
- **📎** → PDF, Word, TXT, CSV, JSON…
- Dosyayı sohbet alanına **sürükleyip bırakabilirsin** de

Desteklenen boyut: dosya başına 12MB, görseller 5MB.

### UPA'nın uygulamayı düzenlemesi
UPA sadece cevap vermez — **uygulamanın verisini değiştirebilir**. Örnekler:

> "Ders programım ekte, takvimime işle" *(PDF ekleyerek)*

> "Yarın 14:00'te matematik sınavı ekle, kritik öncelikli"

> "Fizik ödevini tamamlandı olarak işaretle"

> "Bu haftanın takvimini temizle ve şu programı gir: …"

> "Bugün 5000 adım attım, kaydet"

UPA bir değişiklik yaptığında mesajın altında **⚙️ UPA şunları yaptı:** başlığıyla listelenir, böylece her zaman ne değiştiğini görürsün.

Yapabildikleri: görev ekle/tamamla/sil · ödev ekle/tamamla/sil · takvim etkinliği ekle/sil/temizle · çalışma seansı ekle · egzersiz kaydet · günlük değer güncelle · hedef değiştir.

### Program oluşturucu
🗓 **Program** sekmesinde iki buton var:
- **⚡** — programı sadece gösterir
- **📅 Takvim** — programı oluşturup **takvimine işler**

---

## 8. Sorun giderme

**Bildirimler gelmiyor**
Ayarlar → 🔔 Bildirimleri Aç. Android'de ayrıca sistem ayarlarından uygulama bildirimlerine izin ver. Tarayıcıda engellediysen adres çubuğundaki kilit ikonundan sıfırla.

**Senkronizasyon çalışmıyor**
- Android'de "Sunucu adresi" dolu mu?
- Netlify'da Blobs etkin mi?
- İki cihazda **birebir aynı** API anahtarı mı var? (baştaki/sondaki boşluklar önemli)

**PDF okunamıyor**
Taranmış (fotoğraf şeklindeki) PDF'lerden metin çıkarılamaz. Gemini veya Claude sağlayıcısını seçersen dosya doğrudan gönderilir ve okunabilir.

**Sesli konuşma çalışmıyor**
- Android APK'da mikrofon izni gerekir (ilk kullanımda sorar)
- iOS Safari'de ses tanıma sınırlıdır; yazarak kullanmak daha güvenilir
- Masaüstünde Chrome/Edge önerilir

**APK derlemesi başarısız**
Actions sekmesindeki hata kaydına bak. En sık sebep: `npm install` sırasında ağ hatası — iş akışını tekrar çalıştırmak genelde yeterli.

**"API anahtarını kontrol et" hatası**
Anahtarı yanlış sağlayıcıya girmiş olabilirsin. Gemini anahtarları `AIza…`, OpenAI `sk-…`, Anthropic `sk-ant-…` ile başlar.

---

## Proje yapısı

```
├── .github/workflows/     APK ve web derleme iş akışları
├── android-resources/     Uygulama ikonu ve açılış ekranı kaynakları
├── netlify/functions/     Senkronizasyon sunucu fonksiyonu
├── public/                PWA manifest, service worker, ikonlar
├── scripts/               Derleme yardımcıları (pdf worker, manifest yaması)
└── src/
    ├── i18n.js            tr / en / ja sözlüğü
    ├── App.jsx            Ana uygulama
    ├── components/        Sekmeler ve arayüz parçaları
    └── utils/
        ├── aiClient.js    Tüm AI sağlayıcıları (görsel + dosya + komut)
        ├── upaActions.js  UPA komut motoru
        ├── fileParser.js  PDF / Word / görsel okuma
        ├── notifications.js  Öncelik bazlı bildirimler
        ├── sync.js        Cihazlar arası eşitleme
        └── voice.js       Sesli giriş ve çıkış
```

---

## Komutlar

```bash
npm start           # geliştirme sunucusu
npm run build       # üretim derlemesi
npm run cap:add     # Android platformunu ekle (bir kere)
npm run cap:sync    # web derlemesini Android'e aktar
npm run apk:debug   # yerelde debug APK derle (Android SDK gerekir)
npm run aab:release # yerelde release AAB derle
```
