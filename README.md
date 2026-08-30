# 🌌 SoundScape 3D - Interactive 3D Audio Visualizer

<p align="center">
  <img src="./public/favicon.svg" alt="SoundScape 3D Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>Trình phát nhạc & trực quan hóa âm thanh 3D thời gian thực với WebGL, Three.js và Web Audio API.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

---

## ✨ Tính năng nổi bật (Features)

- 🎧 **7 Hiệu ứng 3D Visualizer độc quyền**:
  1. **Particle Cloud**: Đám mây hạt lượng tử biến hình theo dải tần âm thanh (FFT).
  2. **Tunnel Wave**: Đường hầm sóng neon uốn lượn xuyên không gian.
  3. **Aurora**: Dải lụa cực quang ma mị chuyển động mềm mại trên nền trời đêm.
  4. **Cosmic Galaxy**: Thiên hà xoắn ốc 3D phản hồi theo từng nhịp bass và treble.
  5. **Cyber Synthwave Grid**: Lưới địa hình tương lai phong cách Cyberpunk / Retro Wave.
  6. **Liquid Plasma Core**: Khối cầu plasma biến dạng chất lỏng phát sáng huyền bí.
  7. **3D Circular Spectrum**: Vòng tròn cột phổ âm thanh 3D sống động xoay quanh tâm.
- ⚡ **Web Audio API Engine**: Phân tích tần số âm thanh thời gian thực với FFT Fast Fourier Transform.
- 🎵 **Đa dạng nguồn phát**:
  - **Upload file từ máy**: Tải lên các file `.mp3`, `.wav`, `.ogg` trực tiếp từ thiết bị.
  - **Demo Playlist tích hợp**: Kho bài hát mẫu chất lượng cao sẵn sàng nghe ngay.
  - **YouTube Music Player**: Tìm kiếm và phát nhạc trực tiếp từ YouTube.
- 🎛️ **Trình điều khiển âm thanh hoàn chỉnh**:
  - Play, Pause, Next, Prev, Seek thanh trượt thời gian, Điều chỉnh âm lượng.
  - Chế độ Shuffle (ngẫu nhiên) & Repeat (lặp lại bài hát).
  - Quản lý danh sách phát (Playlist Drawer) tiện lợi, mượt mà.
- 🎥 **Camera tương tác 3D**: Tự do xoay (Orbit), phóng to/thu nhỏ (Zoom), lia góc nhìn bằng chuột hoặc chạm cảm ứng.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics & Shaders**: [Three.js](https://threejs.org/) + GLSL Custom Shaders + Post-processing (Unreal Bloom)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Hướng dẫn cài đặt & chạy Local

### Yêu cầu
- [Node.js](https://nodejs.org/) phiên bản 18+ hoặc 20+

### Các bước thực hiện:
```bash
# 1. Clone repository
git clone https://github.com/PucPam07/soundscape-3d.git
cd soundscape-3d

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Chạy môi trường phát triển
npm run dev
```

Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🌐 Hướng dẫn Triển khai lên Vercel (Deployment Guide)

### Cách 1: Deploy tự động từ GitHub (Khuyên dùng)
1. Đẩy code lên repository `https://github.com/PucPam07/soundscape-3d` (xem hướng dẫn bên dưới).
2. Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
3. Bấm **"Add New..."** -> **"Project"**.
4. Chọn repository **`soundscape-3d`** từ danh sách GitHub của bạn.
5. Giữ nguyên các cấu hình mặc định (Framework Preset: **Next.js**) và nhấn **Deploy**.
6. Vercel sẽ tự động build và cung cấp cho bạn đường link trực tiếp (ví dụ: `https://soundscape-3d.vercel.app`).

### Cách 2: Deploy bằng Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📤 Lệnh đẩy code lên GitHub

```bash
git add .
git commit -m "feat: initial commit for SoundScape 3D visualizer"
git branch -M main
git remote add origin https://github.com/PucPam07/soundscape-3d.git
git push -u origin main
```

---

## 📄 License
Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
