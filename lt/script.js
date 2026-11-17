document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
      menuToggle.setAttribute('aria-expanded', !expanded);
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close all other items (optional, makes it cleaner)
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      item.classList.toggle('active', !isActive);
    });
  });

  // 3. Audio Synth for Timer (Web Audio API - no external assets needed!)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(freq, type, duration, count = 1, interval = 200) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        try {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
          console.warn('Audio play error:', e);
        }
      }, i * interval);
    }
  }

  // 4. LT Timer Widget
  const timerDisplay = document.getElementById('timerDisplay');
  const timerStartBtn = document.getElementById('timerStart');
  const timerResetBtn = document.getElementById('timerReset');
  const TOTAL_SECONDS = 5 * 60; // 5 minutes
  let remainingSeconds = TOTAL_SECONDS;
  let timerInterval = null;

  function updateTimerDisplay() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    // Warning styling
    if (remainingSeconds <= 60 && remainingSeconds > 0) {
      timerDisplay.style.color = '#d97706'; // warning
    } else if (remainingSeconds === 0) {
      timerDisplay.style.color = '#dc2626'; // ended
    } else {
      timerDisplay.style.color = 'var(--text-main)'; // normal
    }
  }

  function startTimer() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (timerInterval) {
      // Pause
      clearInterval(timerInterval);
      timerInterval = null;
      timerStartBtn.textContent = '再開';
      timerStartBtn.classList.remove('primary');
      return;
    }

    timerStartBtn.textContent = '一時停止';
    timerStartBtn.classList.add('primary');

    timerInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateTimerDisplay();

        // 4 minute mark (1 minute left)
        if (remainingSeconds === 60) {
          playTone(880, 'sine', 0.4, 1); // 1 bell
        }
        // Finish (0 seconds)
        if (remainingSeconds === 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          timerStartBtn.textContent = '終了！';
          playTone(660, 'triangle', 0.6, 3, 250); // 3 bells
        }
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    remainingSeconds = TOTAL_SECONDS;
    updateTimerDisplay();
    timerStartBtn.textContent = 'スタート';
    timerStartBtn.classList.add('primary');
  }

  if (timerStartBtn && timerResetBtn) {
    timerStartBtn.addEventListener('click', startTimer);
    timerResetBtn.addEventListener('click', resetTimer);
    updateTimerDisplay();
  }

  // 5. LT Idea Gacha Generator
  const gachaBtn = document.getElementById('gachaBtn');
  const gachaResult = document.getElementById('gachaResult');

  const gachaTemplates = [
    "【初級】最新の◯◯を触ってみて感じたこと",
    "【初級】◯◯でつまずいた原因と、調べて分かったこと",
    "【初級】使ってよかったツール・拡張機能を3つ紹介",
    "【初級】◯◯の仕組みを、初めて学ぶ人向けに説明してみた",
    "【中級】自分の欲しい機能を作るために◯◯を選んだ理由",
    "【中級】こだわりの開発環境を作るまでに試したこと",
    "【初級】知って便利だったGitの基本操作を紹介",
    "【初級】インターン・ハッカソンに参加して学んだこと",
    "【初級】買ってよかったガジェット・キーボードを紹介",
    "【中級】◯◯の仕組みを調べ、使う側から作る側の視点で考えてみた",
    "【中級】1週間で◯◯を作るために工夫した設計と実装",
    "【初級】初学者におすすめしたい技術書・学習リソース",
    "【初級】毎週の面倒な作業をスクリプトで自動化してみた",
    "【初級】アプリの画面を改善して分かった見やすさの工夫",
    "【中級】自分のアプリを確認して学んだセキュリティの基本",
    "【初級】初めてテストを書いて気づいたバグ予防の大切さ",
    "【初級】身近なデータをグラフにして見つけた意外な傾向",
    "【初級】三日坊主を抜け出すために試した学習の続け方",
    "【中級】コードレビューを受けて設計や実装を改善した話",
    "【初級】ブラウザにページが表示されるまでを調べてみた",
    "【中級】外部サービスのAPIを使って小さな機能を作ってみた",
    "【初級】自分の作品を公開して届いた反応と学び",
    "【初級】作業場所や休憩の工夫で集中しやすさを比べてみた",
    "【中級】自分のサイトを見直して改善したアクセシビリティ",
    "【中級】アプリのログからトラブルの原因を探してみた",
    "【中級】小さなアプリで◯◯を選んだ理由と比較したこと",
    "【中級】機能を小さく分けて作り直し、変わったこと"
  ];

  const targetTechnologies = [
    "Next.js / React", "Vue / Nuxt", "Flutter", "TypeScript", 
    "Rust", "Go言語", "Python", "Docker", "GitHub Actions", 
    "Tailwind CSS", "Supabase / Firebase", "Linuxコマンド", 
    "Claude / ChatGPT API", "Vim / Neovim", "Notion / Obsidian",
    "Playwright / Cypress", "Figma / CSS", "FastAPI / Django",
    "PostgreSQL / SQLite", "AWS / Azure", "アクセシビリティ",
    "REST API / GraphQL", "pytest / Vitest", "Docker Compose",
    "Google Apps Script", "Cloudflare Workers"
  ];

  if (gachaBtn && gachaResult) {
    gachaBtn.addEventListener('click', () => {
      gachaResult.style.opacity = '0.5';
      gachaBtn.disabled = true;

      setTimeout(() => {
        const randomTemplate = gachaTemplates[Math.floor(Math.random() * gachaTemplates.length)];
        const randomTech = targetTechnologies[Math.floor(Math.random() * targetTechnologies.length)];
        const finalTitle = randomTemplate.replace(/◯◯/g, randomTech);

        gachaResult.textContent = `💡 「 ${finalTitle} 」`;
        gachaResult.style.opacity = '1';
        gachaBtn.disabled = false;
      }, 200);
    });
  }

  // 5. Archive Level Accordion Toggle
  const archiveItems = document.querySelectorAll('.archive-toggle-item');
  const archiveExpandAll = document.getElementById('archiveExpandAll');
  const archiveCollapseAll = document.getElementById('archiveCollapseAll');

  archiveItems.forEach(item => {
    const headerBtn = item.querySelector('.archive-toggle-header');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        item.classList.toggle('active', !isActive);
        headerBtn.setAttribute('aria-expanded', !isActive);
      });
    }
  });

  if (archiveExpandAll) {
    archiveExpandAll.addEventListener('click', () => {
      archiveItems.forEach(item => {
        item.classList.add('active');
        const btn = item.querySelector('.archive-toggle-header');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      });
    });
  }

  if (archiveCollapseAll) {
    archiveCollapseAll.addEventListener('click', () => {
      archiveItems.forEach(item => {
        item.classList.remove('active');
        const btn = item.querySelector('.archive-toggle-header');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 6. Slide Structure Template Toggle
  const slideTemplateBox = document.getElementById('slide-template');
  const slideTemplateToggle = document.getElementById('slideTemplateToggle');
  if (slideTemplateBox && slideTemplateToggle) {
    slideTemplateToggle.addEventListener('click', () => {
      const isActive = slideTemplateBox.classList.toggle('active');
      slideTemplateToggle.setAttribute('aria-expanded', isActive);
      const label = slideTemplateToggle.querySelector('.slide-toggle-label');
      if (label) {
        label.textContent = isActive ? '構成を閉じる ▲' : 'スライド構成を見る ▼';
      }
    });
  }

  // Page Tabs - About/Rules/Flow
  const tabSection = document.getElementById('about');
  const tabBtns = document.querySelectorAll('#about .page-tab-btn');
  const tabPanels = document.querySelectorAll('#about .page-tab-panel');

  function activateIndexTab(tabId) {
    tabBtns.forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateIndexTab(btn.dataset.tab));
  });

  const indexTabMap = { '#about': 'tab-about', '#rules': 'tab-rules', '#flow': 'tab-flow' };
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (indexTabMap[href]) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activateIndexTab(indexTabMap[href]);
        if (tabSection) tabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
      });
    }
  });

  const switchToRulesBtn = document.getElementById('switchToRulesTab');
  if (switchToRulesBtn) {
    switchToRulesBtn.addEventListener('click', () => {
      activateIndexTab('tab-rules');
      if (tabSection) tabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const initHash = window.location.hash;
  if (initHash && indexTabMap[initHash]) {
    activateIndexTab(indexTabMap[initHash]);
  }
});
