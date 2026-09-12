# Jeyaprakash J — Personal Engineering Portfolio

A neat, bespoke, and human-crafted personal portfolio website for **Jeyaprakash J**, an Electronics & Communication Engineering student aspiring to be an **RF (Radio Frequency) Engineer & Embedded Systems Specialist** with applied AI/ML competencies.

---

## 🌟 Key Highlights

- **Bespoke Engineering Workstation Aesthetic**: Built with an authentic hardware/RF theme—subtle blueprint grid, oscilloscope graticule, technical monospaced telemetry tags, and high-contrast styling.
- **Interactive RF Oscilloscope**: Live HTML5 Canvas carrier wave simulator responding dynamically to cursor hover and frequency modulation.
- **Deep-Dive Project Architecture Modals**: Rich breakdowns for every project (Voice-Controlled Wheelchair, Light-Following Robot, Cloud File Storage, LearnX AI) including hardware schematics, sensor ADC interfacing, and challenges solved.
- **Categorized Project Filtering**: Interactive tabs for Embedded Hardware, Cloud Architecture, and AI Platforms.
- **Internship & Education Timeline**: Detailed record of industry internships at Proplus Technologies, Emiglitz Technologies, and ADOVI, alongside academic coursework at V.S.B. College of Engineering Technical Campus.
- **Direct Connect Drawer**: Instant one-click clipboard email copy with toast confirmation, direct mailto dispatcher, and live phone/LinkedIn/GitHub links.
- **Workstation Theme Switcher**: Instant switching between Dark Workstation and Blueprint Light modes with persistent `localStorage` preference.
- **Zero Heavy Framework Bloat**: Pure HTML5, modern CSS3, and vanilla ES6 JavaScript. Loads in under 0.05 seconds with zero build steps or npm installations needed.

---

## 📁 Project Structure

```
jeyaprakash-portfolio/
├── index.html                 # Semantic, accessible HTML5 structure
├── assets/
│   ├── css/
│   │   └── style.css          # CSS custom properties, responsive layout, animations
│   ├── js/
│   │   └── main.js            # Oscilloscope canvas, modals, filter tabs, theme toggle
│   └── images/
│       ├── profile.jpg        # Authentic photo extracted from resume
│       └── favicon.svg        # Custom RF antenna & carrier wave SVG icon
└── README.md                  # Project documentation & deployment guide
```

---

## 🚀 How to Run Locally

You can preview the website instantly using any local web server:

### Option 1: Using Python (Recommended)
Open PowerShell or Terminal in this folder and run:
```powershell
python -m http.server 8080
```
Then visit: [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Direct File Open
Simply double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.

---

## 🌐 How to Deploy to GitHub Pages (Free Hosting)

1. Create a new repository on your GitHub account (`https://github.com/new`) named:
   `jeyaprakash-portfolio` or `JeyaPrakashJP2.github.io`
2. Open PowerShell in this project folder and run:
   ```powershell
   git init
   git add .
   git commit -m "Initial release of Jeyaprakash J engineering portfolio"
   git branch -M main
   git remote add origin https://github.com/JeyaPrakashJP2/jeyaprakash-portfolio.git
   git push -u origin main
   ```
3. Go to **Settings** > **Pages** in your GitHub repository and set **Branch** to `main` and **Folder** to `/ (root)`.
4. Your live website will be accessible globally at:
   `https://JeyaPrakashJP2.github.io/jeyaprakash-portfolio/`

---

## 📬 Contact & Socials

- **Email**: [jjeyaprakash13@gmail.com](mailto:jjeyaprakash13@gmail.com)
- **Phone**: [+91 8270880162](tel:+918270880162)
- **GitHub**: [https://github.com/JeyaPrakashJP2](https://github.com/JeyaPrakashJP2)
- **LinkedIn**: [https://www.linkedin.com/in/jeya-prakash-496699404](https://www.linkedin.com/in/jeya-prakash-496699404)
